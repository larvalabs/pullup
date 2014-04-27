var mongoose = require('mongoose'),
    should = require('should'),

    Comment = require('../models/Comment'),
    Issue = require('../models/Issue'),
    NewsItem = require('../models/NewsItem'),
    User = require('../models/User'),
    Vote = require('../models/Vote'),

    TEST_DB = 'mongodb://127.0.0.1/pullup-unittest-db';

describe('Aggregate Votes', function() {

  var db,
      user,
      vote;

  before(function(done) {
    mongoose.connect(TEST_DB);
    user = new User({
      name: 'testuser'
    });

    user.save(function(err) {
      done(err);
    });
  });

  after(function(done) {
    user.remove(function(err) {
      mongoose.disconnect(function(err) {
        done(err);
      });
    });
  });


  /*
   * Start NewsItem Tests.
   */
  describe('on NewsItems', function() {
    var item;
    
    beforeEach(function(done) {

      item = new NewsItem({
        title: 'Item title',
        url: 'pullup.io/news',
        poster: null,
        summary: 'some summary',
        source: 'pullup.io',
        vote_count: 0
      });
      
      item.save(function (err) {
        done(err);
      });
    });

    afterEach(function(done) {
      item.remove(function(err) {
        done(err);
      });
    });

    it('Initial vote count should be 0', function(done) {
      item.vote_count.should.equal(0);
      done();
    });

    it('should increment vote count when vote is created & decrement when removed.', function(done) {

      var vote = Vote({
        item: item._id,
        itemType: 'news',
        voter: user._id,
        amount: 1
      });

      testIncrementDecrement(vote, NewsItem, done);
    });
  });

  
  /*
   * Start Issues Tests.
   */
  describe('on Issues', function() {
    var issue;
    
    beforeEach(function(done) {

      issue = new Issue({
        number: 1,
        poster: user._id
      });
      
      issue.save(function (err) {
        done(err);
      });
    });

    afterEach(function(done) {
      issue.remove(function(err) {
        done(err);
      });
    });

    it('Initial vote count should be 0', function(done) {
      issue.vote_count.should.equal(0);
      done();
    });

    it('should increment vote count when vote is created & decrement when removed.', function(done) {

      var vote = Vote({
        item: issue._id,
        itemType: 'issue',
        voter: user._id,
        amount: 1
      });

      testIncrementDecrement(vote, Issue, done);
    });
  });

  
  /*
   * Start Comment Tests.
   */
  describe('on Comments', function() {
    var item, comment;
    
    beforeEach(function(done) {
      item = new NewsItem({
        title: 'Item title',
        url: 'pullup.io/news',
        poster: null,
        summary: 'some summary',
        source: 'pullup.io',
        vote_count: 0
      });
      
      item.save(function (err) {

        if (err) done(err);
        
        comment = new Comment({
          item: item._id,
          itemType: 'news',
          contents: 'Test Comment',
          poster: user._id
        });

        comment.save(function(err) {
          done(err);
        });
      });
      
    });

    afterEach(function(done) {
      comment.remove(function(err) {
        if (err) done(err);
        item.remove(function(err) {
          done(err);
        });
      });
    });

    it('Initial vote count should be 0', function(done) {
      comment.vote_count.should.equal(0);
      done();
    });

    it('should increment vote count when vote is created & decrement when removed.', function(done) {

      var vote = Vote({
        item: comment._id,
        itemType: 'comment',
        voter: user._id,
        amount: 1
      });

      testIncrementDecrement(vote, Comment, done);
    });
  });


  /*
   * Start duplicate vote tests.
   */
  describe('on duplicate vote', function() {
    var item;
    
    beforeEach(function(done) {

      item = new NewsItem({
        title: 'Item title',
        url: 'pullup.io/news',
        poster: null,
        summary: 'some summary',
        source: 'pullup.io',
        vote_count: 0
      });
      
      item.save(function (err) {
        done(err);
      });
    });

    afterEach(function(done) {
      item.remove(function(err) {
        done(err);
      });
    });

    it('Initial vote count should be 0', function(done) {
      item.vote_count.should.equal(0);
      done();
    });

    it('should not increment vote count twice for duplicate votes', function(done) {
      var vote = Vote({
        item: item._id,
        itemType: 'news',
        voter: user._id,
        amount: 1
      });

      vote.save(function(err) {
        if (err) {
          done(err);
        }

        NewsItem.findById(vote.item, function(err, item) {
          if (err) {
            done(err);
          }
          
          item.vote_count.should.equal(1);

          // second for for user/item
          var vote = Vote({
            item: item._id,
            itemType: 'news',
            voter: user._id,
            amount: 1
          });

          vote.save(function(err) {
            if (err) {
              //TODO: ensure only duplicate is ignored.
              // Ignore since this is the duplicate record error we want to trigger.
            }

            NewsItem.findById(vote.item, function(err, item) {
              if (err) {
                console.warn(err);
                done(err);
              }
              
              item.vote_count.should.equal(1);
              done();
              
            }); // rapidly approaching callback hell threshold...
          });
        }); 
      });
    });
  });
});          


function testIncrementDecrement(vote, itemModel, done) {
  vote.save(function(err) {
    if (err) {
      console.log('ERROR: ' + err);
      done(err);
    }

    itemModel.findById(vote.item, function(err, item) {
      if (err) {
        done(err);
      }

      item.vote_count.should.equal(1);
      vote.remove(function(err) {
        if (err) {
          done(err);
        }
        
        itemModel.findById(vote.item, function(err, item) {
          item.vote_count.should.equal(0);
          done(err);
        });
      });    
    });
  });
}
