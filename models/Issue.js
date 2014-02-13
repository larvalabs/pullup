var mongoose = require('mongoose'), Schema = mongoose.Schema;

var issueSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('Issue', issueSchema);
