var mongoose = require('mongoose'),
    Schema = mongoose.Schema,

    Comment = require('./Comment.js'),
    Issue = require('./Issue.js'),
    NewsItem = require('./NewsItem.js');


var voteSchema = new mongoose.Schema({
  item: {
    type: Schema.Types.ObjectId,
    required: true
  },
  itemType: {
    type: String,
    required: true,
    enum: ['news', 'comment', 'issue'],
    default: 'news'
  },
  voter: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    default: 1,
    required: true,
    min: 1,
    max: 1
  }
});

// each user can only vote on an item once
voteSchema.index({ item: 1, voter: 1 }, { unique: true });

// increment item vote count on save.
voteSchema.pre('save', function(next) {

  var initem = this;

  // ensure this isn't a duplicate vote, as this happens before the
  // unique index is enforced for the new vote.
  Vote.findOne({item: initem.item, voter: initem.voter}, function(err, dup) {
    if ( dup === null) {
      incrementVote(initem.item, initem.itemType, 1, next);
    } else {
      next();
    }
  });
    
});

// decrement item vote count on remove.
voteSchema.pre('remove', function(next) {
  incrementVote(this.item, this.itemType, -1, next);
});

// increment/decrement the aggregated vote count by amount.
function incrementVote(itemId, type, amount, next) {

  var item;
  
  if (type === 'issue') {
    item = Issue;
  } else if (type === 'comment') {
    item = Comment;
  } else {
    item = NewsItem;
  }
  

  item.findById(itemId, function(err, item){

    if (err) { next(err); }

    item.vote_count += amount;
    item.save(function(err) {

      if (err) {
	next(err);
      } else {
	next();
      }
    });
  });
  
}

var Vote;
module.exports = Vote = mongoose.model('Vote', voteSchema);
