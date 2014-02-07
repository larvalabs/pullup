var mongoose = require('mongoose');
var passport = require('passport');
var _ = require('underscore');
var User = require('../models/User');
var NewsItem = require('../models/NewsItem');
var Vote = require('../models/Vote');

exports.index = function(req, res, next) {
  NewsItem
  .find({})
  .sort('-created')
  .limit(30)
  .populate('poster')
  .exec(function(err, newsItems) {

    if(err) return next(err);

    addVotesToNewsItems(newsItems, req.user, function (err, newsItems) {

      if(err) return next(err);

      res.render('news/index', {
        title: 'Recent News',
        items: newsItems
      });

    });

  });
};

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

      if(err) return next(err);

      addVotesToNewsItems(newsItems, req.user, function (err, newsItems) {

        if(err) return next(err);

        res.render('news/index', {
          title: 'News shared by ' + users[0].username,
          items: newsItems,
          filteredUser: users[0].username
        });

      });

    });
  });
}

function addVotesToNewsItems(newsItems, user, callback) {

  Vote
  .find({ item: { $in: newsItems.map(function (item) { return item.id; }) } })
  .exec(function (err, votes) {

    if(err) return callback(err);

    newsItems = newsItems.map(function (item) {
      item = typeof item.toObject === 'function' ? item.toObject() : item;

      item.votes = votes
        .filter(function (vote) {
          return vote.item.toString() === item._id.toString();
        }).reduce(function (prev, curr, i) {

          // count this item as voted for if the logged in user has a vote tallied
          if(user && user.id && curr.voter.toString() === user.id.toString()) {
            item.votedFor = true;
          }

          return prev + curr.amount;
        }, 0);

      return item;
    });

    callback(null, newsItems);
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


/**
 * PUT /news/:item
 * Vote up a news item.
 * @param {number} amount Which direction and amount to vote up a news item (limited to +1 for now)
 */

exports.vote = function (req, res, next) {

  req.assert('amount', 'Items can only be upvoted.').equals('1');

  var errors = req.validationErrors();

  if (errors) {
    res.flash('errors', errors);
    return res.redirect(req.get('referrer') || '/');
  }

  var vote = new Vote({
    item: req.params.id,
    voter: req.user.id,
    amount: req.body.amount
  });

  vote.save(function (err) {
    if (err) {
      if (err.code === 11000) {
        req.flash('errors', { msg: 'You can only upvote an item once.' });
      }
      return res.redirect(req.get('referrer') || '/');
    }

    req.flash('success', { msg: 'News item upvoted. Awesome!' });
    res.redirect(req.get('referrer') || '/');
  });


};
