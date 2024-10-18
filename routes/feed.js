const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const isAuthenticated = require('./auth');

// GET route voor de feed
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const posts = await Post.find().populate('author').sort({ createdAt: -1 });
    
    // Haal repositories op uit de sessie
    const repositories = req.session.repositories || [];

    // Render de feed met de beschikbare posts en repositories
    res.render('feed', { user: req.session.userLogin, posts, repositories });
  } catch (error) {
    console.error("Error bij het ophalen van de berichten:", error);
    res.status(500).send("Er ging iets mis bij het ophalen van de berichten.");
  }
});

// POST route om een nieuwe post te maken
router.post('/new', isAuthenticated, async (req, res) => {
  const { content, imageUrl, commitInfo } = req.body;

  try {
    const user = await User.findOne({ login: req.session.userLogin });
    if (!user) {
      return res.status(404).send("Gebruiker niet gevonden");
    }

    const newPost = new Post({
      author: user._id,
      content,
      imageUrl,
      commitInfo
    });

    await newPost.save();
    res.redirect('/feed');
  } catch (error) {
    console.error("Error bij het aanmaken van een post:", error);
    res.status(500).send("Er ging iets mis bij het aanmaken van een post.");
  }
});

module.exports = router;
