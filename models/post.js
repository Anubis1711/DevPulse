const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  commitInfo: {
    message: String,
    author: String,
    sha: String,
    url: String,
    additions: Number,
    deletions: Number,
    files: [{
      filename: String,
      additions: Number,
      deletions: Number,
      changes: Number,
      status: String
    }]
  },
  createdAt: { type: Date, default: Date.now },
  
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],


  comments: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
});

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
