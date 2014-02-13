var mongoose = require('mongoose'), Schema = mongoose.Schema;

var issueSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true
  },
  poster: {
    type: Schema.Types.ObjectId
  }
});

module.exports = mongoose.model('Issue', issueSchema);
