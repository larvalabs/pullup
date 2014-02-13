var GitHubApi = require('github');

var github = new GitHubApi({
  version: "3.0.0"
});


exports.index = function (req, res, next) {
  github.issues.repoIssues({
    user: 'larvalabs',
    repo: 'pullup',
    state: 'open'
  }, function (err, issues) {
    if(err) return next(err);

    res.render('issues/index', {
      title: 'Open Issues',
      issues: issues
    });

  });
};
