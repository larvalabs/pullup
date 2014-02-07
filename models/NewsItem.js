var mongoose = require('mongoose'), Schema = mongoose.Schema;
var userSchema = require('./User.js');

var newsItemSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  url: { type: String, unique: true },
  poster: { type: String, ref: 'User' },
  created: { type: Date, default: Date.now },
  votes: [{ type: String, ref: 'Vote' }]
});

var User = mongoose.model('User', userSchema);

module.exports = mongoose.model('NewsItem', newsItemSchema);
