var mongoose = require('mongoose'),
    secrets = require('../config/secrets'),
    async = require('async'),
    NewsItem = require('../models/NewsItem'),
    Vote = require('../models/Vote'),
    Comment = require('../models/Comment'),
    User = require('../models/User'),
    Issue = require('../models/Issue');

function clearDown (cb) {
  mongoose.connect(secrets.db, function (err) {
    if (err) return cb(err);

    var models = [NewsItem, Vote, Comment, User, Issue];

    async.eachSeries(models, function (model, done) {
      model.collection.remove(done);
    }, cb);
  });
};

exports.clearDown = clearDown;

exports.task = function () {
  var done = this.async();

  clearDown(function (err) {
    if (err) {
      console.log(err);
      return done(false);
    }

    done();
  });
};
