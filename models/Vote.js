var mongoose = require('mongoose')
  , Schema = mongoose.Schema;


var voteSchema = new mongoose.Schema({
  item: {
    type: Schema.Types.ObjectId,
    ref: 'NewsItem',
    required: true
  },
  voter: {
    type: String,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    default: 1,
    required: true
  }
});

// each user can only vote on an item once
voteSchema.index({ item: 1, voter: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
