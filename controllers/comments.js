var mongoose = require('mongoose');
var passport = require('passport');
var _ = require('underscore');
var User = require('../models/User');
var NewsItem = require('../models/NewsItem');
var Vote = require('../models/Vote');
var votesController = require('./votes');
var addVotesToNewsItems = votesController.addVotesFor('news');
var Comment = require('../models/Comment');
var request = require('request');
var async = require('async');
var http = require('http');
var constants = require('../constants');
var markdownParser = require('../components/MarkdownParser');
var utils = require('../utils');
var secrets = require('../config/secrets');
var sendgrid  = require('sendgrid')(secrets.sendgrid.user, secrets.sendgrid.password);

var ONE_HOUR = 60 * 60 * 1000;  // ms

function commentIsEditable(comment) {
  return ((new Date()) - comment.created) < ONE_HOUR;
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

/**
 * POST /news/:id/comments/:comment_id/delete
 * Delete comment on a news item
 */
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
    .findById(req.params.comment_id)
    .exec(function(err, comment) {
      if (err) res.redirect('back');

      if (req.user.id.toString() !== comment.poster.toString()){
        req.flash('errors', [{
          param: 'user',
          msg: 'You do not have access to delete this comment.',
          value: undefined
        }]);
        return res.redirect('back');
      }

      comment.remove(function(err){
        if (err) res.redirect('back');

        req.flash('success', { msg: 'Comment deleted.' });
        res.redirect('back');
      });
    });
};

/**
 * GET /news/:id/comments/:comment_id
 * View comment on a news item
 */
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

/**
 * GET /news/:id/comments/:comment_id/edit
 * Edit comment on a news item
 */
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

/**
 * POST /news/:id/comments/:comment_id/update
 * Update comment on a news item
 */
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
