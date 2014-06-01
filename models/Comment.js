var mongoose = require('mongoose'), Schema = mongoose.Schema;
var userSchema = require('./User.js');

var commentSchema = new mongoose.Schema({
  item: {
    type: Schema.Types.ObjectId,
    required: true
  },
  itemType: {
    type: String,
    required: true,
    enum: ['news', 'comment']
  },
  contents: {
    type: String,
    default: '',
    required: true
  },
  poster: {
    type: String,
    ref: 'User'
  },
  vote_count: {
    type: Number,
    default: 0
  },
  created: {
    type: Date,
    default: Date.now
  }
});

var User = mongoose.model('User', userSchema);
var Comment;
module.exports = Comment = mongoose.model('Comment', commentSchema);
