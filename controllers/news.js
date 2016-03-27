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
var http = require('http');
var githubContributors = require('../components/GithubContributors');
var constants = require('../constants');
var markdownParser = require('../components/MarkdownParser');
var utils = require('../utils');
var secrets = require('../config/secrets');
var sendgrid  = require('sendgrid')(secrets.sendgrid.user, secrets.sendgrid.password);

const ONE_HOUR = 60 * 60 * 1000;  // ms

/**
 * News Item config
 */
var newsItemsPerPage = 30;
var maxPages = 30;

exports.index = function(req, res, next) {

  var page = typeof req.params.page !== 'undefined' ? req.params.page : 1;
  page = isNaN(page) ? 1 : Number(page);
  page = page < 1 ? 1 : page;

  // don't use a `/page/1` url
  if(req.params.page === '1') return res.redirect(req.url.slice(0, req.url.indexOf('page')));

  var view = 'news/index';
  if (req.route.path === '/rss') {
    view = 'rss';
    res.set('Content-Type', 'text/xml; charset=utf-8');
  }

  getNewsItems({}, page, req.user, function (err, newsItems) {
    if(err) return next(err);

    res.render(view, {
      title: 'Top News',
      tab: 'top',
      items: newsItems,
      page: page,
      archive: page > maxPages,
      newsItemsPerPage: newsItemsPerPage
    });
  }, sortByScore);
};

exports.new = function(req, res, next) {

  var page = typeof req.params.page !== 'undefined' ? req.params.page : 1;
  page = isNaN(page) ? 1 : Number(page);
  page = page < 1 ? 1 : page;

  // don't use a `/page/1` url
  if(req.params.page === '1') return res.redirect(req.url.slice(0, req.url.indexOf('page')));

  var view = 'news/index';

  getNewsItems({}, page, req.user, function (err, newsItems) {
    if(err) return next(err);

    res.render(view, {
      title: 'Newest',
      tab: 'new',
      items: newsItems,
      page: page,
      archive: page > maxPages,
      newsItemsPerPage: newsItemsPerPage
    });
  }, sortByNewest);
};

/**
 * GET /news/:id
 * View comments on a news item
 */
exports.comments = function (req, res, next) {

  // redirect to the plain portion of the url
  if(req.query.last_comment) {
    return res.redirect(utils.urlWithoutQueryParam(req.originalUrl, 'last_comment'));
  }

  getNewsItemShowData(req.user, req.params.id, function(results) {
    res.render('news/show', {
      title: results.newsItem.title,
      tab: 'news',
      item: results.newsItem,
      comments: results.comments,
      votes: results.votes
    });
  });
};


exports.deleteNewsItemAndComments = function (req, res, next) {
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

  async.parallel({
    newsItem: function(cb) {
      NewsItem
      .findByIdAndRemove(req.params.id)
      .exec(cb);
    },
    comments: function(cb) {
      Comment
      .remove({item: req.params.id}, cb);
    }
  }, function (err, results) {
    if (err) res.redirect('back');

    req.flash('success', { msg: 'News item and comments deleted.' });
    res.redirect('/news');
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

  comment.save(function(err, comment) {
    if (err) {
      return res.redirect('/news/'+req.params.id);
    }

    var mentions = utils.findUserMentions(comment.contents);

    async.parallel({
      newsItem: function (cb) {
        NewsItem
        .findById(req.params.id)
        .populate('poster')
        .exec(cb);
      },
      mentions: function (cb) {
        User
        .find({
          username: {
            $in: mentions
          }
        })
        .exec(cb);
      }
    }, function (err, results) {
      if(err) {
        return console.log("Error while retrieving emails for notifications", err);
      }

      var newsPoster = results.newsItem.poster;

      if (newsPoster.email && newsPoster.email !== req.user.email) {
        var email = new sendgrid.Email({
          to: newsPoster.email,
          from: 'noreply@pullup.io',
          fromname: 'pullup',
          subject: 'There is a new comment on your post',
          text: 'Link to post: http://pullup.io/news/' + req.params.id
        });

        sendgrid.send(email, function(err) {
          if (err) {
            return console.log("Error sending email: " + err.message);
          }
          console.log("Email successfully sent to " + newsPoster.id);
        });
      }

      utils.uniqueMongo(results.mentions).forEach(function (user) {
        if(user.email && user.email !== req.user.email) {
          var email = new sendgrid.Email({
            to: user.email,
            from: 'noreply@pullup.io',
            fromname: 'pullup',
            subject: "You've been mentioned in a comment",
            text: req.user.username + " mentioned you in a comment on the discussion for \"" + results.newsItem.title + "\".\n\n" +
              'Link to post: http://pullup.io/news/' + req.params.id
          });

          sendgrid.send(email, function(err) {
            if (err) {
              return console.log("Error sending email: " + err.message);
            }
            console.log("Email successfully sent to " + user.id);
          });
        }
      });
    });
 
    req.flash('success', { msg  : 'Comment posted. Thanks!' });
    res.redirect('/news/'+comment.item+'?last_comment='+comment.created);
  });
};

function commentIsEditable(comment) {
  return ((new Date) - comment.created) < ONE_HOUR;
}

function getNewsItemShowData(user, itemId, commentId, callback) {
  if (arguments.length === 3){
    callback = commentId;
    commentId = null;
  }
  NewsItem
    .findById(itemId)
    .populate('poster')
    .exec(function (err, newsItem) {

      if(err) return next(err);
      if (!newsItem) {
        req.flash('errors', { msg: 'News item not found.' });
        return res.redirect('/news');
      }

      async.parallel({
        votes: function (cb) {
          addVotesToNewsItems(newsItem, user, cb);
        },
        comments: function (cb) {
          if (commentId) {
            Comment
              .findById(commentId)
              .populate('poster')
              .exec(cb);
          } else {
            Comment
              .find({
                item: newsItem._id,
                itemType: 'news'
              })
              .sort({created: 1})
              .populate('poster')
              .exec(cb);
          }

        }
      }, function (err, results) {

        if (err) return next(err);

        if(!Array.isArray(results.comments)) {
          results.comments = [results.comments];
        }

        _.each(results.comments, function (comment, i, l) {
          comment.source = comment.contents;
          comment.contents = markdownParser(utils.replaceUserMentions(comment.contents));
          comment.editable = commentIsEditable(comment);
        });

        newsItem.summary = markdownParser(utils.replaceUserMentions(newsItem.summary));
        results.newsItem = newsItem;

        callback(results);
      });
    });
}
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

exports.viewComment = function (req, res, next) {
  getNewsItemShowData(req.user, req.params.id, req.params.comment_id, function(results) {
    res.render('comments/index', {
      title: 'Comment',
      item: results.newsItem,
      comment: results.comments[0],
      votes: results.votes
    });
  });
};

exports.editComment = function (req, res, next) {
  getNewsItemShowData(req.user, req.params.id, req.params.comment_id, function(results) {
    var userHasAccess = req.user.username === results.comments[0].poster.username;
    var commentEditable = commentIsEditable(results.comments[0]);
    if(!userHasAccess || !commentEditable) {
      return res.redirect('/news/'+req.params.id+"/comments/"+req.params.comment_id);
    }

    res.render('comments/index', {
      title: 'Comment',
      item: results.newsItem,
      comment: results.comments[0],
      votes: results.votes,
      editing: true
    });
  });
};

exports.updateComment = function (req, res, next) {
  req.assert('contents', 'Comment cannot be blank.').notEmpty();
  //req.assert('user', 'User must be logged in.').notEmpty();

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
    .findById(req.params.comment_id)
    .exec(function(err, comment) {
      if (err) next(err);

      if(req.user.id.toString() !== comment.poster.toString()){
        req.flash('errors', {
          param: 'user',
          msg: 'User does not have access to this comment.',
          value: undefined
        });
        return res.redirect('back');
      }

      if(!commentIsEditable(comment)) {
        req.flash('errors', {
          param: 'user',
          msg: 'Sorry, this comment is too old to edit.',
          value: undefined
        });
        return res.redirect('back');
      }

      comment.contents = req.body.contents;
      comment.save(function(err, comment) {
        if (err) next(err);
        req.flash('success', { msg  : 'Comment updated!' });
        return res.redirect('/news/'+req.params.id+"/comments/"+req.params.comment_id);
      });
    });
};

/**
 * GET /news/user/:id
 */
exports.userNews = function(req, res, next) {
  // Legacy redirect
  res.redirect(301, '/user/' + req.params.id);
};

exports.sourceNews = function(req, res, next) {
  var page = typeof req.params.page !== 'undefined' ? req.params.page : 1;
  page = isNaN(page) ? 1 : Number(page);
  page = page < 1 ? 1 : page;

  // don't use a `/page/1` url
  if(req.params.page === '1') return res.redirect(req.url.slice(0, req.url.indexOf('page')));

  getNewsItems({'source': req.params.source}, page, req.user, function (err, newsItems) {
    if(err) return next(err);

    res.render('news/index', {
      title: 'Recent news from ' + req.params.source,
      tab: 'news',
      items: newsItems,
      page: page,
      newsItemsPerPage: newsItemsPerPage,
      filteredSource: req.params.source
    });
  });
};

function getNewsItems(query, page, user, callback, sort) {

  var skip,
    limit;

  // `page` is an optional argument
  if(arguments.length < 5 && typeof user === 'function') {
    sort = callback;
    callback = user;
    user = page;
    page = 1;
  }

  // default to page 1, there is no page 0
  page = page || 1;

  // beyond the maximum number of pages, we don't use any custom sorts
  if(page > maxPages) {
    sort = null;
  }


  if(!sort) {
    // default sort is by `created`, so we can use `skip` and `limit` on the Mongo query
    skip = (page - 1) * newsItemsPerPage;
    limit = newsItemsPerPage;
  } else {
    // custom sort function, so we have to fetch all of the pages worth of items,
    // then sort and slice in the application
    skip = 0;
    limit = newsItemsPerPage * maxPages;
  }

  NewsItem
  .find(query)
  .sort('-created')
  .skip(skip)
  .limit(limit)
  .populate('poster')
  .exec(function (err, newsItems) {

    if(err) return callback(err);


    // no further sort necessary, just add metadata
    if(!sort) return addVotesAndCommentDataToNewsItems(newsItems, user, callback);

    // the only custom sort we use uses votes, so fetch those prior to sorting
    addVotesToNewsItems(newsItems, user, function (err, newsItems) {
      if(err) return callback(err);

      // skip and limit is calculated the same way as for the mongo query
      var skip = (page - 1) * newsItemsPerPage;
      var limit = newsItemsPerPage;

      newsItems = sort(newsItems).slice(skip, skip + limit);

      // now add comment data to the reduced set
      addCommentDataToNewsItems(newsItems, callback);
    });

  });
}

/**
 * All-in-one function for adding metadata to news items
 */
function addVotesAndCommentDataToNewsItems(items, user, callback) {

  async.waterfall([
    function (cb) {
      addVotesToNewsItems(items, user, cb);
    },
    function (items, cb) {
      addCommentDataToNewsItems(items, cb);
    }
  ], callback);
}

function addCommentDataToNewsItems(items, callback) {
  async.waterfall([
    function (cb) {
      addCommentCountToNewsItems(items, cb);
    },
    function (items, cb) {
      addLatestCommentTimeForNewsItems(items, cb);
    }
  ], callback);
}

function addLatestCommentTimeForNewsItems(items, callback) {

  if(!items.length) return callback(null, items);

  async.map(items, function(item, cb) {

    Comment
    .find({
      item: item._id
    })
    .sort({
      created: -1
    })
    .limit(1)
    .exec(function(err, doc) {

      if(err) return cb(err);

      if(!doc || !doc.length) return cb(null, item);

      var comments = doc[0];

      if((typeof comments === 'object') && (typeof comments.created !== 'undefined')) {
        // convert to a plain object if necessary
        item = typeof item.toObject === 'function' ? item.toObject() : item;
        item.latestCommentAt = comments.created;
				item.latestCommentBy = comments.poster;
      }

      cb(null, item);
    });

  }, callback);
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

function sortByNewest(newsItems) {
  newsItems.sort(function (a,b) {
    return b.created.getTime() - a.created.getTime();
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
    tab: 'news',
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
      tab: 'news',
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

exports.getNewsItems = getNewsItems;
exports.getNewsItemsForComments = getNewsItemsForComments;
