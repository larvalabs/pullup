var userlist = require('../config/userlist');
var issuesController = require('./issues');
var NewsItem = require('../models/NewsItem');

/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  issuesController.githubAuth(req.user);

  issuesController.beginnerIssues(function(err, issues) {

    if(err) {
      issues = [];
    }

    res.render('homepage', {
      title: "Pullup",
      users: userlist.users,
      issues: issues
    });
  });
};

exports.signup = function(req, res) {
  res.render('howtosignup', {
    title: 'Signup'
  });
};

exports.about = function(req, res) {
  res.render('about', {
    title: 'About'
  });
};

exports.logs = function(req, res) {
  res.render('logs', {
    title: 'Logs'
  });
};

exports.bookmarklet = function(req, res) {
  res.render('bookmarklet', {
    title: 'Bookmarklet'
  });
};
