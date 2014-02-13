var mongoose = require('mongoose'), Schema = mongoose.Schema;
var userSchema = require('./User.js');

var newsItemSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  url: { type: String, unique: true },
  summary: { type: String },
  source: { type: String },
  poster: { type: String, ref: 'User' },
  created: { type: Date, default: Date.now }
});

newsItemSchema.methods.isSelfPost = function() {
  return this.url === '/news/' + this._id;
};

var User = mongoose.model('User', userSchema);

module.exports = mongoose.model('NewsItem', newsItemSchema);
