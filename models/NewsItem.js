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

/**
 * Returns a properly formatted URL in case it is missing information, i.e. protocol
 * @param {string} url URL to format
 * @returns {string} url Formatted URL
 */
newsItemSchema.statics.formatUrl = function(url) {
  return /^(http:\/\/|https:\/\/)/.test(url) ? url : 'http://' + url;
};

// Logic to be executed before a model is saved to Mongo
newsItemSchema.pre('save', function (next) {
  if(!this.isSelfPost()) {
    this.url = NewsItem.formatUrl(this.url);
  }

  next();
});

var User = mongoose.model('User', userSchema);

var NewsItem;
module.exports = NewsItem = mongoose.model('NewsItem', newsItemSchema);
