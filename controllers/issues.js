var GitHubApi = require('github');
var Issue = require('../models/Issue');
var User = require('../models/User');
var Vote = require('../models/Vote');
var async = require('async');
var _ = require('underscore');
var votesController = require('./votes');
var addVotesToIssues = votesController.addVotesFor('issue');
var util = require('util');
var markdownParser = require('../components/MarkdownParser');
var utils = require('../utils');
var githubSecrets = require('../config/secrets').github;
var github = new GitHubApi({
  version: "3.0.0"
});
var githubDetails = {
  user: 'larvalabs',
  repo: 'pullup',
  issueUrlTemplate: 'https://github.com/larvalabs/pullup/issues/'
};
var itemsPerPage = 30;

/**
 * GET /issues
 * View all open issues in the project
 */
exports.index = function (req, res, next) {

  // don't use a `/page/1` url
  if(req.params.page === '1') return res.redirect(req.url.slice(0, req.url.indexOf('page')));

  var issues = [];

  githubAuth(req.user);

  github.issues.repoIssues({
    user: githubDetails.user,
    repo: githubDetails.repo,
    state: 'open',
    per_page: 100
  }, issuesCallback);

  function issuesCallback(err, ret) {
    if(err) return next(err);

    issues = issues.concat(ret);

    if(github.hasNextPage(ret)) {
      return github.getNextPage(ret, issuesCallback);
    }

    getIssueIds(issues, function (err, issues) {

      if(err) return next(err);

      sortIssues(issues, req.user, function (err, issues) {

        if(err) return next(err);

        var page = Math.max(Number(req.params.page) || 1, 1),
          skip = (page - 1) * itemsPerPage,
          maxPages = Math.ceil(issues.length / itemsPerPage);

        res.render('issues/index', {
          title: 'Open Issues',
          tab: 'issues',
          issues: issues.slice(skip, skip + itemsPerPage),
          page: page,
          maxPages: maxPages
        });

      });

    });
  }
};

/**
 * GET /issues/:id
 * View this issue and related comments
 */
exports.show = function (req, res, next) {

  // redirect to the plain portion of the url
  if(req.query.last_comment) {
    return res.redirect(utils.urlWithoutQueryParam(req.originalUrl, 'last_comment'));
  }

  Issue
  .findById(req.params.id)
  .exec(function (err, issueDoc) {

    if(err) return next(err);

    async.parallel({
      votes: function (cb) {
        addVotesToIssues(issueDoc, req.user, cb);
      },
      issue: function (cb) {
        githubAuth(req.user);

        github.issues.getRepoIssue({
          user: githubDetails.user,
          repo: githubDetails.repo,
          number: issueDoc.number
        }, cb);
      },
      comments: function (cb) {
        githubAuth(req.user);

        github.issues.getComments({
          user: githubDetails.user,
          repo: githubDetails.repo,
          number: issueDoc.number,
          per_page: 100
        }, cb);
      }
    }, function (err, results) {

      if(err) return next(err);

      var issue = results.issue;

      issue._id = issueDoc._id;
      issue.votes = issueDoc.votes;
      issue.body = parseMarkdown(issue.body);

      _.each(results.comments, function (comment,i,l) {
        comment.mdBody = comment.body;
        comment.body = parseMarkdown(comment.body);
      });

      res.render('issues/show', {
        title: issue.title,
        tab: 'issues',
        item: issue,
        comments: results.comments
      });

    });
  });
};

/**
 * POST /issues/:id/comments
 * Post a comment about an issue
 */

exports.postComment = function (req, res, next) {
  req.assert('contents', 'Comment cannot be blank.').notEmpty();

  var errors = req.validationErrors();

  if (!githubToken(req.user)) {
    errors.push({
      param: 'user',
      msg: 'User must be logged in.',
      value: undefined
    });
  }

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/news/'+req.params.id);
  }

  Issue
  .findById(req.params.id)
  .exec(function (err, issueDoc) {

    if(err) return next(err);

    githubAuth(req.user);

    github.issues.createComment({
      user: githubDetails.user,
      repo: githubDetails.repo,
      number: issueDoc.number,
      body: req.body.contents
    }, function (err, comment) {

      if(err) return next(err);

      req.flash('success', { msg  : 'Comment posted. Thanks!' });
      res.redirect('/issues/'+issueDoc._id+'?last_comment='+comment.created_at);
    });
  });
};

// get the internal issue `_id`, and create new docs for those that don't yet exist
function getIssueIds(issues, callback) {
  if(!issues || !issues.length) return callback(null, issues);

  Issue
  .find({
    number: {
      $in: issues.map(function (issue) {
        return issue.number;
      })
    }
  })
  .exec(function (err, docs) {
    if(err) return callback(err);

    var docsByNumber = {};

    docs.forEach(function (doc) {
      docsByNumber[doc.number] = doc;
    });

    async.map(issues, function (issue, cb) {
      var doc = docsByNumber[issue.number];

      if(doc) {
        // this issue has been created in our db already
        issue._id = doc._id;
        cb(null, issue);

        // UPDATE VOTE AFTER SENDING BACK THE CALLBACK
        // this doesn't need happen before a user gets the information back,
        // it can happen in the background
        castFirstIssueVote(doc, issue.user.login);

      } else {
        // we need to create a new issue
        doc = new Issue({
          number: issue.number
        });

        doc.save(function (err, doc) {
          if(err) return cb(err);
          issue._id = doc._id;

          cb(null, issue);

          // UPDATE VOTE AFTER SENDING BACK THE CALLBACK
          // this doesn't need happen before a user gets the information back,
          // it can happen in the background
          castFirstIssueVote(doc, issue.user.login);
        });
      }
    }, callback);
  });
}

// cast a vote for an issue if the author is a user of pullup
function castFirstIssueVote(issue, author_username) {

  // if this doc has no poster, it's author was not a member the last time this check was run
  if(issue.poster) return;

  User.findOne({
    username: author_username
  }, function (err, user) {

    if(err) return console.warn(err);

    // only do anything if the user has since registered
    if(user) {

      var vote = new Vote({
        item: issue,
        voter: user,
        amount: 1,
        itemType: 'issue'
      });

      vote.save(function (err, vote) {
        if(err) {
          // 11000 means someone else already got to this before we could, not a big deal
          return console.warn(err);
        }

        // add the user as the poster of the issue
        issue.poster = user;

        issue.save(function (err) {
          if(err) return console.warn(err);
        });
      });

    }
  });
}

function sortIssues(issues, user, callback) {

  addVotesToIssues(issues, user, function (err, issues) {
    if(err) return callback(err);

    // sort by vote count and then age
    issues.sort(function (a, b) {
      return (b.votes - a.votes) || (new Date(b.created_at) - new Date(a.created_at));
    });

    callback(null, issues);
  });
}

function githubToken(user) {
  if(!user || !user.tokens || !user.tokens.length) return false;

  for(var i=0; i<user.tokens.length; i++) {
    if(!user.tokens[i]) continue;
    if(user.tokens[i].kind === 'github') return user.tokens[i].accessToken;
  }

  return false;
}

function githubAuth(user) {
  var token = githubToken(user);

  if(token) {
    // authenticate using the logged in user
    github.authenticate({
      type: 'oauth',
      token: token
    });
  } else {
    // authenticate using the app's credentials
    github.authenticate({
        type: "oauth",
        key: githubSecrets.clientID,
        secret: githubSecrets.clientSecret
    });
  }
}

function parseMarkdown (content) {
  content = parseIssueNumbers(content);

  return markdownParser(content);
}

function parseIssueNumbers (content) {
  return content.replace(/#[\d]+/g, function (issueNumber) {
    var number = issueNumber.substring(1);
    var href = githubDetails.issueUrlTemplate + number;

    return util.format('[%s](%s "%s")', issueNumber, href, issueNumber);
  });
}
