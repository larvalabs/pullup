var mongoose = require('mongoose'),
    secrets = require('../config/secrets'),
    async = require('async'),
    dbClearDown = require('./db_clear_down'),
    User = require('../models/User'),
    NewsItem = require('../models/NewsItem'),
    Vote = require('../models/Vote');

exports.task = function () {
  var done = this.async();

  async.series([
    function (cb) {
      dbClearDown.clearDown(function (err) {
        cb(err);          
      });
    },
    function (cb) {
      mongoose.connect(secrets.db, function (err) {
        var user = new User({
          username: 'DummyUser'
        });

        async.series([
          function (next) {
            user.save(next);
          },
          function (next) {
            var newsItem = new NewsItem({
              title: 'Dummy Discussion',
              summary: 'Some dummy text created by db-seed',
              source: 'pullup.io',
              poster: user._id
            });

            newsItem.url = '/news/' + newsItem._id;
            newsItem.save(function (err) {
              var vote = new Vote({
                item: newsItem,
                voter: user._id,
                amount: 1,
                  itemType: 'news'
              });

              vote.save(next);
            });
          }
        ], cb);
      });
    }
  ], function (err) {
    if (err) {
      console.log(err);
      return done(false);
    }

    done();
  });
};

