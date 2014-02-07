var mongoose = require('mongoose'), Schema = mongoose.Schema;
var userSchema = require('./User.js');
var newsItemSchema = require('./NewsItem.js');

var voteSchema = new mongoose.Schema({
  value: { type: Number, default: 1, max: +1, min: -1 },
  newsItem: { type: Schema.Types.ObjectId, ref: 'newsItem' },
  voter: { type: Schema.Types.ObjectId, ref: 'User' },
  created: { type: Date, default: Date.now }
});

var Vote = mongoose.model('Vote', voteSchema);

module.exports = mongoose.model('Vote', voteSchema);
