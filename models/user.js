const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  login: String, 
  name: String,
  githubId: String,
  avatarUrl: String,
  bio: String,
  description: String,
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Array van ObjectId's
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]  // Array van ObjectId's
});

const User = mongoose.model('User', userSchema);
module.exports = User;