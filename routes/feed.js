const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const isAuthenticated = require('./auth');
const axios = require('axios');

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

    let commitDetails = null;
    if (commitInfo) {
      const [repoFullName, commitSha] = commitInfo.split(',');

      // Haal de commit details op van de GitHub API
      const accessToken = req.session.accessToken;
      const url = `https://api.github.com/repos/${repoFullName}/commits/${commitSha}`;

      const commitResponse = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      // Log de response van GitHub om te zien of alle velden correct worden opgehaald
      console.log("Commit Response Data:", commitResponse.data);

      // Sla de relevante commit details op
      const commit = commitResponse.data;
      commitDetails = {
        message: commit.commit.message,
        author: commit.commit.author ? commit.commit.author.name : (commit.commit.committer ? commit.commit.committer.name : "Onbekend"),
        sha: commit.sha,
        url: commit.html_url
      };

      // Log de commit details die worden opgeslagen
      console.log("Commit Details die worden opgeslagen:", commitDetails);
    }

    const newPost = new Post({
      author: user._id,
      content,
      imageUrl,
      commitInfo: commitDetails // Sla gedetailleerde informatie op
    });

    await newPost.save();
    res.redirect('/feed');
  } catch (error) {
    console.error("Error bij het aanmaken van een post:", error);
    res.status(500).send("Er ging iets mis bij het aanmaken van een post.");
  }
});

module.exports = router;
