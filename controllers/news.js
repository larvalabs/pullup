var mongoose = require('mongoose');
var passport = require('passport');
var _ = require('underscore');
var User = require('../models/User');
var NewsItem = require('../models/NewsItem');

exports.index = function(req, res) {
  NewsItem
  .find({})
  .sort('-created')
  .limit(30)
  .populate('poster')
  .exec(function(err, newsItems) {
    res.render('news/index', {
      title: 'Recent News',
      items: newsItems
    })
  });
}

exports.userNews = function(req, res) {
  User
  .find({'username': req.params.id})
  .exec(function(err, users) {
    NewsItem
    .find({'poster': users[0].id})
    .sort('-created')
    .limit(30)
    .populate('poster')
    .exec(function(err, newsItems) {
      res.render('news/index', {
        title: 'News shared by ' + users[0].username,
        items: newsItems,
        filteredUser: users[0].username
      })
    });
  });
}

/**
 * GET /news/submit
 * Submit news.
 */

exports.submitNews = function(req, res) {
  //if (!req.user) return res.redirect('/login');
  res.render('news/submit', {
    title: 'Submit News'
  });
};

/**
 * POST /news/submit
 * Submit news item.
 * @param {string} title
 * @param {string} url
 */

exports.postNews = function(req, res, next) {
  req.assert('title', 'Title cannot be blank.').notEmpty();
  req.assert('url', 'URL cannot be blank.').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/news/submit');
  }

  console.log("Posting for user id "+req.user.id);

  var newsItem = new NewsItem({
    title: req.body.title,
    url: req.body.url,
    poster: req.user.id
  });

  newsItem.save(function(err) {
    if (err) {
      if (err.code === 11000) {
        req.flash('errors', { msg: 'That URL already exists as a news item.' });
      }
      return res.redirect('/news/submit');
    }

    req.flash('success', { msg: 'News item submitted. Thanks!' });
    res.redirect('/news');
  });

};