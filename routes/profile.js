// routes/profile.js
const axios = require('axios');
const moment = require('moment');
const express = require('express');
const User = require('../models/user');
const router = express.Router();
const isAuthenticated = require('../routes/auth');

router.get('/', isAuthenticated, async (req, res) => {
  if (!req.session || !req.session.accessToken) {
    return res.redirect('/login');
  }

  try {
    const user = await User.findOne({ login: req.session.userLogin });
    if (!user) {
      return res.status(404).send("Gebruiker niet gevonden");
    }

    const accessToken = req.session.accessToken;
    const lastWeek = moment().subtract(6, 'days'); // De startdatum voor een week geleden
    const dailyCommits = Array(7).fill(0); // Array om dagelijkse commits bij te houden

    // Haal de repositories van de gebruiker op
    const reposResponse = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const repositories = reposResponse.data;

    // Voor elke repository, haal commits van de afgelopen week op
    for (const repo of repositories) {
      try {
        // Commits ophalen voor deze specifieke repository binnen de afgelopen week
        const commitsResponse = await axios.get(`https://api.github.com/repos/${repo.full_name}/commits`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { since: lastWeek.toISOString() }
        });

        // Voeg commits toe aan de dailyCommits-array
        commitsResponse.data.forEach(commit => {
          const commitDate = moment(commit.commit.author.date).startOf('day');
          const dayIndex = 6 - moment().diff(commitDate, 'days'); // Bereken de index voor de dag
          if (dayIndex >= 0 && dayIndex < 7) {
            dailyCommits[dayIndex]++;  // Verhoog de count voor de dag
          }
        });
      } catch (err) {
        if (err.response && err.response.status === 409) {
          console.warn(`Geen commits beschikbaar voor repository: ${repo.full_name}`);
        } else {
          console.error("Error tijdens het ophalen van commits:", err.message);
        }
      }
    }

    // Render de profielpagina met dailyCommits (gecombineerde commits van alle repositories)
    res.render('profile', { user, dailyCommits, repositories });
  } catch (error) {
    console.error("Error tijdens het ophalen van commits of repositories:", error.message);
    res.status(500).send("Er ging iets mis bij het ophalen van de commits of repositories.");
  }
});

// Profile POST route om de beschrijving te updaten
router.post('/', isAuthenticated, async (req, res) => {
  const { login, description } = req.body;

  // Controleer of login aanwezig is in de POST request
  if (!login) {
    return res.status(400).send("Loginnaam ontbreekt in verzoek");
  }

  try {
    await User.updateOne({ login }, { description });
    res.redirect('/profile');
  } catch (error) {
    console.error("Error tijdens het updaten van de gebruiker:", error.message);
    return res.status(500).send("Er ging iets mis bij het updaten van de gebruiker.");
  }
});

module.exports = router;
