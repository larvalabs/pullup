var userlist = require('../config/userlist');

/**
 * GET /
 * Home page.
 */

exports.index = function(req, res) {
  res.render('homepage', {
    title: "Pullup",
    users: userlist.users
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
