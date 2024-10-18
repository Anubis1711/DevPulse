const express = require('express');
const axios = require('axios');
const router = express.Router();
const isAuthenticated = require('./auth');

// GET route om commits op te halen
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Zorg dat je repository informatie hebt (je kunt dit aanpassen naar jouw repository)
    const repoOwner = 'jouw-github-gebruikersnaam';
    const repoName = 'jouw-repository-naam';

    // Haal de accessToken op van de huidige sessie
    const accessToken = req.session.accessToken;

    if (!accessToken) {
      return res.status(401).send('Authenticatie vereist');
    }

    // API-aanroep naar GitHub om commits op te halen
    const commitsResponse = await axios.get(`https://api.github.com/repos/${repoOwner}/${repoName}/commits`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    // Verstuur de commitgegevens naar de client (EJS kan deze gebruiken om in een dropdown te zetten)
    res.json(commitsResponse.data);
  } catch (error) {
    console.error("Error tijdens het ophalen van de commits:", error.message);
    res.status(500).send("Er ging iets mis bij het ophalen van de commits.");
  }
});

module.exports = router;
