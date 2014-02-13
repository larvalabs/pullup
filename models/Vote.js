var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


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

module.exports = mongoose.model('Vote', voteSchema);
