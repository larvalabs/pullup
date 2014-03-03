var mongoose = require('mongoose'),
    secrets = require('../config/secrets'),
    async = require('async'),
    NewsItem = require('../models/NewsItem'),
    Vote = require('../models/Vote'),
    Comment = require('../models/Comment'),
    User = require('../models/User'),
    Issue = require('../models/Issue');

exports.task = function () {
  var done = this.async();

  mongoose.connect(secrets.db, function (err) {
    if (err) {
      console.log(err);
      return done(false);
    }
    
    var models = [NewsItem, Vote, Comment, User, Issue];

    async.eachSeries(models, function (model, cb) {
      model.collection.remove(cb);
    }, done);
  });
};
