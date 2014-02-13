var GitHubApi = require('github');
var Issue = require('../models/Issue');
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
    Issue.findOneAndUpdate({ number: issue.number }, { number: issue.number }, { upsert: true }, function (err, doc) {
      if(err) return cb(err);
      issue._id = doc._id;

      cb(null, issue);
    });
  }, callback);
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
