const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: { type: String, required: true, unique: true },  // GitHub ID voor uniekheid
  login: String,
  name: String,
  avatarUrl: String,
  bio: String,
  followers: { type: Number, default: 0 },
  description: { type: String, default: "Hier kan je je beschrijving aanpassen" }
});

const User = mongoose.model('User', userSchema);
module.exports = User;