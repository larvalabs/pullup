var mongoose = require('mongoose');
var passport = require('passport');
var _ = require('underscore');
var User = require('../models/User');
var NewsItem = require('../models/NewsItem');
var Vote = require('../models/Vote');
var votesController = require('./votes');
var addVotesToNewsItems = votesController.addVotesFor('news');
var addVotesToItem = votesController.addVotesToItem;
var Comment = require('../models/Comment');
var request = require('request');
var async = require('async');

exports.index = function(req, res, next) {

  getNewsItems({}, req.user, function (err, newsItems) {
    if(err) return next(err);

    res.render('news/index', {
      title: 'Recent News',
      items: sortByScore(newsItems)
    });
  });
};

/**
 * GET /news/:id
 * View comments on a news item
 */
exports.comments = function (req, res, next) {

  NewsItem
  .findById(req.params.id)
  .populate('poster')
  .exec(function (err, newsItem) {

    if(err) return next(err);

    async.parallel({
      votes: function (cb) {
        addVotesToNewsItems(newsItem, req.user, cb);
      },
      comments: function (cb) {
        Comment
        .find({
          item: newsItem._id,
          itemType: 'news'
        })
        .populate('poster')
        .exec(cb);
      }
    }, function (err, results) {

      if(err) return next(err);

      res.render('news/show', {
        title: newsItem.title,
        item: newsItem,
        comments: results.comments
      });
    });

  });
};

/**
 * POST /news/:id/comments
 * Post a comment about a news page
 */

exports.postComment = function (req, res, next) {
  req.assert('contents', 'Comment cannot be blank.').notEmpty();
//  req.assert('user', 'User must be logged in.').notEmpty();

  var errors = req.validationErrors();

  if (!req.user) {
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

  var comment = new Comment({
    contents: req.body.contents,
    poster: req.user.id,
    item: req.params.id,
    itemType: 'news'
  });

  comment.save(function(err) {
    if (err) {
      return res.redirect('/news/'+req.params.id);
    }

    req.flash('success', { msg  : 'Comment posted. Thanks!' });
    res.redirect('/news/'+req.params.id);
  });
};

exports.deleteComment = function (req, res, next) {
  var errors = req.validationErrors();

  if (!req.user) {
    errors.push({
      param: 'user',
      msg: 'User must be logged in.',
      value: undefined
    });
  }

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('back');
  }

  Comment
  .findByIdAndRemove(req.params.comment_id)
  .exec(function(err, comment) {
    if (err) res.redirect('back');

    req.flash('success', { msg: 'Comment deleted.' });
    res.redirect('back');
  });
};

exports.userNews = function(req, res, next) {

  User
  .findOne({'username': req.params.id})
  .exec(function(err, user) {

    if(err) return next(err);

    if(!user) {
      req.flash('errors', { msg: "That user does not exist. "});
      return res.redirect('/');
    }

    async.parallel({
      newsItems: function(cb) {
        getNewsItems({'poster': user.id}, req.user, cb);
      },
      comments: function(cb) {

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
            getNewsItemsForComments(comments, req.user, cb);
          }
        ], cb);

      }
    }, function (err, results) {
      if (err) return next(err);

      res.render('news/index', {
        title: 'Posts by ' + user.username,
        items: results.newsItems,
        comments: results.comments,
        filteredUser: user.username,
        filteredUserWebsite: user.profile.website,
        userProfile: user.profile
      });

    });
  });
};

exports.sourceNews = function(req, res, next) {
  getNewsItems({'source': req.params.source}, req.user, function (err, newsItems) {
    if(err) return next(err);

    res.render('news/index', {
      title: 'Recent news from ' + req.params.source,
      items: newsItems,
      filteredSource: req.params.source
    });
  });
};

function getNewsItems(query, user, callback) {
  NewsItem
  .find(query)
  .sort('-created')
  .limit(30)
  .populate('poster')
  .exec(function (err, newsItems) {

    if(err) return callback(err);

    addVotesAndCommentCountToNewsItems(newsItems, user, callback);
  });
}

function addVotesAndCommentCountToNewsItems(items, user, callback) {

  async.waterfall([
    function (cb) {
      addVotesToNewsItems(items, user, cb);
    },
    function (items, cb) {
      addCommentCountToNewsItems(items, cb);
    }
  ], callback);
}

function addCommentCountToNewsItems(items, callback) {

  if(!items.length) return callback(null, items);

  async.map(items, function (item, cb) {

    Comment
    .count({
      item: item._id,
      itemType: 'news'
    })
    .exec(function (err, count) {
      if(err) return cb(err);

      // convert to a plain object if necessary
      item = typeof item.toObject === 'function' ? item.toObject() : item;

      item.comment_count = count;

      cb(null, item);
    });

  }, callback);
}

function sortByScore(newsItems) {
  var gravity = 1.8;
  var now = new Date();

  newsItems.forEach(function (item) {
    // calculate score modifies the item object
    calculateScore(item, now, gravity);
  });

  // sort with highest scores first
  newsItems.sort(function (a,b) {
    return b.score - a.score;
  });

  return newsItems;
}

function calculateScore(item, now, gravity) {
  var votes = item.votes;
  if (votes === 0) {
    votes = 0.1;
  }
  var ageInHours = (now.getTime() - item.created.getTime()) / 3600000;
  item.score = votes / Math.pow(ageInHours + 2, gravity);
}

function getNewsItemsForComments(comments, user, callback) {

  getNewsItems({ _id: { $in: comments.map(function (comment) { return comment.item; }) } }, user, function (err, newsItems) {
    if(err) return callback(err);

    var newsItemsById = {};

    newsItems.forEach(function (newsItem) {
      newsItemsById[newsItem._id.toString()] = newsItem; 
    });

    comments = comments.map(function (comment) {
      var newsItem = newsItemsById[comment.item.toString()];

      comment = typeof comment.toObject === 'function' ? comment.toObject() : comment;

      comment.newsItem = newsItem;

      return comment;
    });

    callback(null, comments);
  });
}

/**
 * GET /news/submit
 * Submit news.
 */

exports.submitNews = function(req, res) {
    var address;

  if (req.query.u) {
    address = req.query.u;
  } else {
    address = "";
  }

  var newsItem = {
    source: '',
    summary: '',
    title: '',
    url: address
  };

  res.render('news/submit', {
    newsItem: newsItem,
    title: 'Submit News'
  });
};

/**
 * GET /news/summarize
 * Summarize given url.
 */

exports.summarize = function(req, res) {
  request('http://clipped.me/algorithm/clippedapi.php?url='+req.query.url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHead(200, { 'Content-Type': 'application/json;charset=utf-8' });
      res.write(body);
      res.end();
    } else {
      res.end();
    }
  });
};

/**
 * POST /news/submit
 * Submit news item.
 * @param {string} title
 * @param {string} url
 */

exports.postNews = function(req, res, next) {

  console.log("Posting for user id "+req.user.id);

  var newsItem = new NewsItem({
    title: req.body.title,
    url: req.body.url,
    poster: req.user.id,
    summary: req.body.summary,
    source: req.body.source
  });

  var posttype = req.body.posttype;

  req.assert('title', 'Title cannot be blank.').notEmpty(); 
  if (posttype === 'self') {
    req.assert('summary', 'Post summary cannot be blank.').notEmpty();
  } else {
    req.assert('url', 'URL cannot be blank.').notEmpty();
  }
 
  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.render('news/submit', {
      newsItem: newsItem,
      title: 'Submit News',
      posttype: posttype
    });
  }

  if (posttype === 'self') {
    newsItem.url = '/news/' + newsItem._id;
    newsItem.source = 'pullup.io';
  }

  newsItem.save(function(err) {
    if (err) {
      if (err.code === 11000) {
        req.flash('errors', { msg: 'That URL already exists as a news item.' });

        NewsItem.findOne({url: newsItem.url}).exec( function (err, item) {
          if (err) {
            return res.redirect('/news/submit');
          }
          return res.redirect('/news/' + item._id);
        });

      } else {
        console.log('Error saving submission: ' + err.code);
        req.flash('errors', { msg: 'An error occurred while processing your request, please try again.' });
        return res.redirect('/news/submit');
      }
    } else {
      // cast an initial vote for a submitted story
      var vote = new Vote({
        item: newsItem,
        voter: req.user.id,
        amount: 1,
        itemType: 'news'
      });

      vote.save(function (err) {
        if (err) return res.redirect('/news/submit');

        req.flash('success', { msg: 'News item submitted. Thanks!' });
        res.redirect('/news');
      });
    }
  });

};

/**
 * PUT /news/:item
 * Vote up a news item.
 * @param {number} amount Which direction and amount to vote up a news item (limited to +1 for now)
 */
// See votes.js
