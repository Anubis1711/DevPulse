const express = require('express');
const axios = require('axios');
const router = express.Router();
const isAuthenticated = require('./auth');

// GET route om commits op te halen
router.get('/', isAuthenticated, async (req, res) => {
  const { repo } = req.query;

  if (!repo) {
    return res.status(400).send('Geen repository gespecificeerd');
  }

  try {
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      console.error('Geen accessToken gevonden in de sessie');
      return res.status(401).send('Authenticatie vereist');
    }

    // API-aanroep naar GitHub om commits op te halen van de opgegeven repository
    const url = `https://api.github.com/repos/${repo}/commits`;

    const commitsResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    res.json(commitsResponse.data);
  } catch (error) {
    console.error("Error tijdens het ophalen van de commits:", error.message);
    if (error.response) {
      console.error('Details:', error.response.data);
    }
    res.status(500).send("Er ging iets mis bij het ophalen van de commits.");
  }
});


module.exports = router;
