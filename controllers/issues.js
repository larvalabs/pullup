var GitHubApi = require('github');
var Issue = require('../models/Issue');
var User = require('../models/User');
var Vote = require('../models/Vote');
var async = require('async');
var votesController = require('./votes');
var addVotesToIssues = votesController.addVotesFor('issue');
var github = new GitHubApi({
  version: "3.0.0"
});

/**
 * GET /issues
 * View all open issues in the project
 */
exports.index = function (req, res, next) {
  github.issues.repoIssues({
    user: 'larvalabs',
    repo: 'pullup',
    state: 'open'
  }, function (err, issues) {
    if(err) return next(err);

    getIssueIds(issues, function (err, issues) {

      if(err) return next(err);

      sortByScore(issues, req.user, function (err, issues) {

        if(err) return next(err);

        res.render('issues/index', {
          title: 'Open Issues',
          issues: issues
        });

      });

    });
  });
};

// get the internal issue `_id`, and create new docs for those that don't yet exist
function getIssueIds(issues, callback) {
  if(!issues || !issues.length) return callback(null, issues);

  async.map(issues, function (issue, cb) {
    Issue.findOne({
      number: issue.number
    })
    .exec(function (err, doc) {
      if(err) return cb(err);

      // this issue has been created in our db already
      if(doc) {
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

    });
  }, callback);
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
          return console.warn(err);
        });
      });

    }
  });
}

function sortByScore(issues, user, callback) {
  var gravity = 1.8;

  addVotesToIssues(issues, user, function (err, issues) {
    if(err) return callback(err);

    // sort by vote count and then age
    issues.sort(function (a, b) {
      return (b.votes - a.votes) || (new Date(b.created_at) - new Date(a.created_at));
    });

    callback(null, issues);
  });
}
