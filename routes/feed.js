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

    // Voeg commit details toe aan elke post en verwijder SHA en URL
    for (let post of posts) {
      if (post.commitInfo && post.commitInfo.sha) {
        const { sha, url } = post.commitInfo;
        const repoFullName = url.split('/').slice(-4, -2).join('/'); // Haal repo naam op uit URL

        console.log("Fetching commit details for:", repoFullName, sha);
    
        try {
          // Haal details op over de commit
          const commitResponse = await axios.get(`https://api.github.com/repos/${repoFullName}/commits/${sha}`, {
            headers: { Authorization: `Bearer ${req.session.accessToken}` }
          });
              
          // Voeg de bestanden met toevoegingen en verwijderingen toe aan de post
          post.filesChanged = commitResponse.data.files.map(file => ({
            filename: file.filename,
            additions: file.additions,
            deletions: file.deletions
          }));

          // Verwijder SHA en URL van de commitinformatie
          delete post.commitInfo.sha;
          delete post.commitInfo.url;

        } catch (error) {
          console.error("Error bij het ophalen van commitdetails:", error.message);
        }
      }
    }

    // Render de feed met de beschikbare posts en repositories
    res.render('feed', { user: req.session.userLogin, posts, repositories, users: [] });
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

        // Stel de commitDetails in zonder SHA en URL
        commitDetails = {
          message: commit.commit.message,
          author: commit.commit.author?.name || commit.commit.committer?.name || "Unknown",
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

    // Maak een nieuwe post met de geformatteerde commitinformatie
    const newPost = new Post({
      author: user._id,
      content,
      imageUrl,
      commitInfo: commitDetails
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

    const user = await User.findOne({ login: req.session.userLogin });
    if (!user) {
      return res.status(404).send("Gebruiker niet gevonden");
    }

    if (post.likes.includes(user._id)) {
      return res.status(400).send("Je hebt deze post al geliked");
    }

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

    const user = await User.findOne({ login: req.session.userLogin });
    if (!user) {
      return res.status(404).send("Gebruiker niet gevonden");
    }

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

router.get('/search', isAuthenticated, async (req, res) => {
  const query = req.query.q; // De zoekterm uit de query string
  try {
      const users = await User.find({
          $or: [
              { name: new RegExp(query, 'i') },
              { login: new RegExp(query, 'i') }
          ]
      });

      const repositories = [];
      
      res.render('feed', { users, posts: [], repositories}); // Stuur zoekresultaten mee
  } catch (error) {
      console.error("Fout bij het zoeken:", error.message);
      res.status(500).send("Zoeken mislukt.");
  }
});


module.exports = router;
