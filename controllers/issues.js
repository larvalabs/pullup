var GitHubApi = require('github');
var votesController = require('./votes');
var addVotesToIssues = votesController.addVotesFor('issue', 'number');
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

    sortByScore(issues, req.user, function (err, issues) {

      if(err) return next(err);

      res.render('issues/index', {
        title: 'Open Issues',
        issues: issues
      });

    });
  });
};


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
