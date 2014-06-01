var mongoose = require('mongoose'), Schema = mongoose.Schema;

var issueSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true
  },
  poster: {
    type: Schema.Types.ObjectId
  },
  vote_count: {
    type: Number,
    default: 0
  }
});

var Issue;
module.exports = Issue =  mongoose.model('Issue', issueSchema);
