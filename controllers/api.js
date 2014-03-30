var secrets = require('../config/secrets');
var User = require('../models/User');
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
