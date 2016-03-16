var mongoose = require('mongoose');
var passport = require('passport');
var _ = require('underscore');
var User = require('../models/User');
var Comment = require('../models/Comment');
var githubContributors = require('../components/GithubContributors');
var async = require('async');
var news = require('./news');
var markdownParser = require('../components/MarkdownParser');
var utils = require('../utils');


/**
 * GET /signup
 * Signup page.
 */

exports.getSignup = function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('account/signup', {
    title: 'Create Account'
  });
};

/**
 * GET /account
 * Profile page.
 */

exports.getAccount = function(req, res) {
  console.log (res.locals.user);
  res.render('account/profile', {
    title: 'Account Management'
  });
};

/**
 * POST /account/profile
 * Update profile information.
 */

exports.postUpdateProfile = function(req, res, next) {
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.location = req.body.location || '';
    user.profile.bio = req.body.bio || '';

    if(req.body.description.length < 32){  
        user.profile.description = req.body.description || '';
    }

    if (req.body.website.match(/https?:\/\//i)) {
      user.profile.website = req.body.website;
    } else if (user.profile.website) {
      user.profile.website = 'http://' + req.body.website;
    } else {
      user.profile.website = '';
    }

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Profile information updated.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 * @param {string} password
 */

exports.postUpdatePassword = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long').len(4);
  req.assert('confirmPassword', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user.password = req.body.password;

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 * @param {string} id
 */

exports.postDeleteAccount = function(req, res, next) {
  User.remove({ _id: req.user.id }, function(err) {
    if (err) return next(err);
    req.logout();
    res.redirect('/');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth2 provider from the current user.
 * @param {string} provider
 * @param {string} id
 */

exports.getOauthUnlink = function(req, res, next) {
  var provider = req.params.provider;
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user[provider] = undefined;
    user.tokens = _.reject(user.tokens, function(token) { return token.kind === provider; });

    user.save(function(err) {
      if (err) return next(err);
      req.flash('info', { msg: provider + ' account has been unlinked.' });
      res.redirect('/account');
    });
  });
};

function getUserOrRespond(req, resp, next, callback){
  User
    .findOne({'username': req.params.id})
    .exec(function(err, user) {

      if (err) return next(err);

      if (!user) {
        req.flash('errors', {msg: "That user does not exist. "});
        return res.redirect('/');
      }

      user.profile.bio = markdownParser(user.profile.bio);

      githubContributors.getContributors({
        onError: function() {
          callback(user);
        },
        onSuccess: function(data) {
          user.profile.contributions_count = githubContributors.getContributions(user.username, data);
          callback(user);
        }
      });
    });
}

function getCommentsForUser(user, callback){
  async.waterfall([
    function (cb) {
      Comment
        .find({'poster': user.id})
        .sort('-created')
        .limit(30)
        .populate('poster')
        .exec(cb);
    },
    function (comments, cb) {
      news.getNewsItemsForComments(comments, user, cb);
    },
    function (comments, cb){
      _.each(comments, function (comment,i,l) {
      comment.contents = markdownParser(utils.replaceUserMentions(comment.contents));
      });
      cb(null, comments);
    }
  ], callback);
}

/**
 * GET /user/:id
 */
exports.user = function(req, res, next) {
  getUserOrRespond(req, res, next, function(user){
    news.getNewsItems({'poster': user.id}, req.user, function(err, newsItems){
      if (err) return next(err);
      res.render('account/news', {
        title: 'Posts by ' + user.username,
        tab: 'news',
        items: newsItems,
        filteredUser: user.username,
        userProfile: user.profile
      });
    });
  });
};

/**
 * GET /user/:id/comments
 */
exports.userComments = function(req, res, next) {
  getUserOrRespond(req, res, next, function(user){
    getCommentsForUser(user, function (err, comments) {
      if (err) return next(err);

      res.render('account/comments', {
        title: 'Comments by ' + user.username,
        tab: 'comments',
        comments: comments,
        filteredUser: user.username,
        userProfile: user.profile
      });
    });
  });
};

/**
 * GET /user/:id/comments
 */
exports.userContributions = function(req, res, next) {
  getUserOrRespond(req, res, next, function(user){
    githubContributors.getIssues(function(allIssues) {
      var contributions = githubContributors.getIssuesForUser(user.username, allIssues);

      res.render('account/contributions', {
        title: 'Contributions by ' + user.username,
        tab: 'contributions',
        contributions: contributions,
        filteredUser: user.username,
        userProfile: user.profile
      });
    });
  });
};

/**
 * GET /logout
 * Log out.
 */

exports.logout = function(req, res) {
  req.logout();
  res.redirect('/');
};
