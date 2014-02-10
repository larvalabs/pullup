var mongoose = require('mongoose');
var passport = require('passport');
var _ = require('underscore');
var User = require('../models/User');
var NewsItem = require('../models/NewsItem');
var Vote = require('../models/Vote');
var Comment = require('../models/Comment');
var request = require('request');
var async = require('async');

exports.index = function(req, res, next) {
  NewsItem
  .find({})
  .sort('-created')
  .limit(30)
  .populate('poster')
  .exec(function(err, newsItems) {

    if(err) return next(err);

    sortByScore(newsItems, req.user, function (err, newsItems) {

      if(err) return next(err);

      var counter = newsItems.length;

      _.each(newsItems, function (newsItem) {
        Comment.count({ item:newsItem._id, itemType: 'news' }).exec(function (err, count) {

          if (err) return next(err);

          if (counter>1) {
            newsItem.comment_count = count;
            counter--;
          } else {
            newsItem.comment_count = count;

            res.render('news/index', {
              title: 'Recent News',
              items: newsItems
            });
          }
        });
      });

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
        getVotesForNewsItem(newsItem, req.user, cb);
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

  var errors = req.validationErrors();

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

exports.userNews = function(req, res) {
    console.log("Finding user news for id " + req.params.id);
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

      getVotesForNewsItems(newsItems, req.user, function (err, newsItems) {

        if(err) return next(err);
        res.render('news/index', {
          title: 'News shared by ' + users[0].username,
          items: newsItems,
          filteredUser: users[0].username,
          filteredUserWebsite: users[0].profile.website,
            userProfile: users[0].profile
        });
      });
    });
  });
};

exports.sourceNews = function(req, res) {
  NewsItem
  .find({'source': req.params.source})
  .sort('-created')
  .limit(30)
  .populate('poster')
  .exec(function(err, newsItems) {
    res.render('news/index', {
      title: 'Recent news from ' + req.params.source,
      items: newsItems,
      filteredSource: req.params.source
    })
  });
};

function sortByScore(newsItems, user, callback) {
  var gravity = 1.8;

  getVotesForNewsItems(newsItems, user, function(err, newsItems) {
    if (err) return callback(err);

    var now = new Date();
    newsItems = newsItems.map(function (item) {
      calculateScore(item, now, gravity);
      return item;
    });

    // sort with highest scores first
    newsItems.sort(function (a,b) {
      return b.score - a.score;
    });

    callback(null, newsItems);
  });
}

function calculateScore(item, now, gravity) {
  var votes = item.votes;
  if (votes === 0) {
    votes = 0.1;
  }
  var ageInHours = (now.getTime() - item.created.getTime()) / 3600000;
  item.score = votes / Math.pow(ageInHours + 2, gravity);
}

function getVotesForNewsItems(newsItems, user, callback) {
  Vote
  .find({ item: { $in: newsItems.map(function (item) { return item.id; }) }, itemType: { $in: ['news', null] } })
  .exec(function (err, votes) {

    if(err) return callback(err);

    newsItems = newsItems.map(function (item) {
      return addVotesToNewsItem(item, user, votes);
    });

    callback(null, newsItems);
  });
}

function getVotesForNewsItem(newsItem, user, callback) {
  Vote
  .find({ item: newsItem, itemType: { $in: ['news', null] } })
  .exec(function (err, votes) {

    if(err) return callback(err);

    callback(null, addVotesToNewsItem(newsItem, user, votes));
  });
}

function addVotesToNewsItem(newsItem, user, votes) {

  newsItem = typeof newsItem.toObject === 'function' ? newsItem.toObject() : newsItem;

  newsItem.votes = votes
    .filter(function (vote) {
      return vote.item.toString() === newsItem._id.toString();
    }).reduce(function (prev, curr, i) {

      // count this item as voted for if the logged in user has a vote tallied
      if(user && user.id && curr.voter.toString() === user.id.toString()) {
        newsItem.votedFor = true;
      }

      return prev + curr.amount;
    }, 0);

  return newsItem;
}

/**
 * GET /news/submit
 * Submit news.
 */

exports.submitNews = function(req, res) {

  if (req.query.u) {
    var address = req.query.u;
  } else {
    var address = "";
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

  req.assert('title', 'Title cannot be blank.').notEmpty();
  req.assert('url', 'URL cannot be blank.').notEmpty();

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.render('news/submit', {
      newsItem: newsItem,
      title: 'Submit News'
    });
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
      req.flash('success', { msg: 'News item submitted. Thanks!' });
      res.redirect('/news');
    }
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
    req.flash('errors', errors);
    return res.redirect(req.get('referrer') || '/');
  }

  if (!req.user) {
    req.flash('errors', { msg: 'Only members can upvote news items.' });
    return res.redirect('/signup');
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
