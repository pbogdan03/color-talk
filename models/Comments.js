var mongoose = require('mongoose');

var CommentSchema = new mongoose.Schema({
  body: String,
  author: String,
  upvotes: {type: Number, default: 0},
  voted: [{type: String, ref: 'User'}],
  post: {type: mongoose.Schema.Types.ObjectId, ref: 'Talk'}
});

CommentSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
};

CommentSchema.methods.downvote = function(cb) {
  this.upvotes = this.upvotes > 0 ? this.upvotes - 1 : 0;
  this.save(cb);
};

mongoose.model('Comment', CommentSchema);