const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const User = require('../models/user');
const isAuthenticated = require('./auth');
const axios = require('axios');

// GET route voor de feed
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Haal repositories op uit de sessie
    const repositories = req.session.repositories || [];

    // Haal alle posts op uit de database
    const posts = await Post.find().populate('author').sort({ createdAt: -1 });

    // Render de feed met de beschikbare posts en repositories
    res.render('feed', { user: req.session.userLogin, posts, repositories });
  } catch (error) {
    console.error("Error bij het ophalen van de berichten:", error);
    res.status(500).send("Er ging iets mis bij het ophalen van de berichten.");
  }
});

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

          const accessToken = req.session.accessToken;
          if (!accessToken) {
              console.error("No accessToken in session.");
              return res.status(401).send("Authentication required");
          }

          const url = `https://api.github.com/repos/${repoFullName}/commits/${commitSha}`;
          try {
              console.log("Fetching commit details:", { repoFullName, commitSha });

              const commitResponse = await axios.get(url, {
                  headers: { Authorization: `Bearer ${accessToken}` }
              });
              const commit = commitResponse.data;

              let filesChanged = [];
              if (Array.isArray(commit.files)) {
                  filesChanged = commit.files.map(file => ({
                      filename: file.filename,
                      additions: file.additions,
                      deletions: file.deletions,
                      changes: file.changes,
                      status: file.status
                  }));
              } else {
                  console.warn("commit.files is not an array or undefined:", commit.files);
              }

              commitDetails = {
                  message: commit.commit.message,
                  author: commit.commit.author?.name || commit.commit.committer?.name || "Unknown",
                  sha: commit.sha,
                  url: commit.html_url,
                  additions: commit.stats?.additions || 0,
                  deletions: commit.stats?.deletions || 0,
                  files: filesChanged
              };
          } catch (error) {
              console.error("Error fetching commit details:", error.message);
              if (error.response) {
                  console.error("GitHub API error details:", error.response.data);
              }
              return res.status(500).send("Failed to fetch commit details.");
          }
      }

      // Ensure commitDetails is always an object before saving
      if (!commitDetails || typeof commitDetails !== 'object') {
          commitDetails = {};  // Default to an empty object if not correctly set
      }

      const newPost = new Post({
          author: user._id,
          content,
          imageUrl,
          commitInfo: commitDetails  // Ensured to be an object
      });

      await newPost.save();
      res.redirect('/feed');
  } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).send("Something went wrong while creating the post.");
  }
});


// POST route om een post te liken
router.post('/:postId/like', isAuthenticated, async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send("Post niet gevonden");
    }

    // Haal de huidige gebruiker op aan de hand van de sessie userLogin
    const user = await User.findOne({ login: req.session.userLogin });
    if (!user) {
      return res.status(404).send("Gebruiker niet gevonden");
    }

    // Controleer of de gebruiker al heeft geliked
    if (post.likes.includes(user._id)) {
      return res.status(400).send("Je hebt deze post al geliked");
    }

    // Voeg gebruiker toe aan lijst van likes
    post.likes.push(user._id);
    await post.save();

    res.redirect('/feed');
  } catch (error) {
    console.error("Error bij het liken van de post:", error);
    res.status(500).send("Er ging iets mis bij het liken van de post.");
  }
});

// POST route om een comment toe te voegen aan een post
router.post('/:postId/comment', isAuthenticated, async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).send("Post niet gevonden");
    }

    // Haal de huidige gebruiker op aan de hand van de sessie userLogin
    const user = await User.findOne({ login: req.session.userLogin });
    if (!user) {
      return res.status(404).send("Gebruiker niet gevonden");
    }

    // Voeg de nieuwe comment toe aan de post
    const newComment = {
      author: user._id,
      content,
      createdAt: new Date()
    };
    post.comments.push(newComment);
    await post.save();

    res.redirect('/feed');
  } catch (error) {
    console.error("Error bij het toevoegen van een comment:", error);
    res.status(500).send("Er ging iets mis bij het toevoegen van de comment.");
  }
});



module.exports = router;
