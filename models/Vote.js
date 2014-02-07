var mongoose = require('mongoose')
  , Schema = mongoose.Schema;


var voteSchema = new mongoose.Schema({
  newsItem: {
    type: Schema.Types.ObjectId,
    ref: 'NewsItem'
  },
  voter: {
    type: String,
    ref: 'User'
  },
  amount: {
    type: Number,
    default: 1
  }
});

module.exports = mongoose.model('Vote', voteSchema);
