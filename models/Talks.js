var mongoose = require('mongoose');

var TalkSchema = new mongoose.Schema({
  title: String,
  author: String,
  upvotes: {type: Number, default: 0},
  voted: [{type: String, ref: 'User'}],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  color: {type: String, default: 'grey'}
});

TalkSchema.methods.upvote = function(cb) {
  this.upvotes += 1;
  this.save(cb);
};

TalkSchema.methods.downvote = function(cb) {
  this.upvotes = this.upvotes > 0 ? this.upvotes - 1 : 0;
  this.save(cb);
};

mongoose.model('Talk', TalkSchema);