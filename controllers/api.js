var secrets = require('../config/secrets');
var User = require('../models/User');
var votesController = require('./votes');
var newsController = require('./news');
var NewsItem = require('../models/NewsItem');
var addVotesToNewsItems = votesController.addVotesFor('news');
var querystring = require('querystring');
var async = require('async');
var cheerio = require('cheerio');
var request = require('request');
var _ = require('underscore');
var marked = require('marked');

marked.setOptions({
  sanitize: true,
  silent: true
});

exports.getMarkdown = function(req, res) {
  if (!req.user) {
    return res.send({
      messages: [{ msg: 'Only members can upvote items.' }]
    });
  }

  if(typeof req.body.source == 'undefined') {
    return res.send({
      messages: [{ msg: "You didn't send any markdown."}]
    });
  }

  if(req.body.source === ''){
    return res.send({
      result: ''
    });
  }

  return res.send({
    result: marked(req.body.source)
  });
};

exports.newsFeed = function(req, res) {

  var newsItemsPerPage = 10;

  var page = typeof req.query.page !== 'undefined' ? req.query.page : 1;
  page = isNaN(page) ? 1 : Number(page);
  page = page < 1 ? 1 : page;

  var skip = (page - 1) * newsItemsPerPage;

  NewsItem
  .find({url: new RegExp("^https?:\/\/")})
  .sort('-created')
  .limit(newsItemsPerPage)
  .populate('poster')
  .skip(skip)
  .exec(function (err, newsItems) {

    if(err) {
      res.statusCode = 500
      res.end(JSON.stringify({
        error: "Could not find news items",
        message: err
      }));
      return false;
    }

    // the only custom sort we use uses votes, so fetch those prior to sorting
    addVotesToNewsItems(newsItems, req.user, function (err, newsItems) {
      if(err) {
        res.statusCode = 500;
        res.end(JSON.stringify({
          error: "Could not get vote data for news items",
          message: err
        }));
        return false;
      }

      // now add comment data to the reduced set
      newsController.addCommentDataToNewsItems(newsItems, function(err, finalNewsItems) {
        if(err) {
          res.statusCode = 500;
          res.end(JSON.stringify({
            error: "Could not get comment data for news items",
            message: err
          }));
          return false;
        }
        
        res.end(JSON.stringify(finalNewsItems));
      });
    });

  });
}
