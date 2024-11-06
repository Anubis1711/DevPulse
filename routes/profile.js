const axios = require('axios');
const moment = require('moment');
const express = require('express');
const User = require('../models/user');
const CommitStats = require('../models/commitStats');
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
    const lastWeek = moment().subtract(6, 'days').startOf('day'); // De startdatum voor een week geleden
    const dailyCommits = Array(7).fill(0); // Array om dagelijkse commits bij te houden

    // Haal commitgegevens uit de database voor de afgelopen week
    const commitStats = await CommitStats.find({
      userId: user._id,
      date: { $gte: lastWeek.toDate() }
    });

    // Map bestaande commitgegevens naar de dailyCommits-array
    commitStats.forEach(stat => {
      const dayIndex = moment(stat.date).diff(lastWeek, 'days');
      if (dayIndex >= 0 && dayIndex < 7) {
        dailyCommits[dayIndex] = stat.commits;
      }
    });

    // Haal de repositories van de gebruiker op
    const reposResponse = await axios.get('https://api.github.com/user/repos', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const repositories = reposResponse.data;

    // Voor elke repository, haal commits van de afgelopen week op
    for (const repo of repositories) {
      try {
        const commitsResponse = await axios.get(`https://api.github.com/repos/${repo.full_name}/commits`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { since: lastWeek.toISOString() }
        });

        // Voeg nieuwe commits toe aan dailyCommits en sla op in de database
        commitsResponse.data.forEach(async (commit) => {
          const commitDate = moment(commit.commit.author.date).startOf('day');
          const dayIndex = commitDate.diff(lastWeek, 'days');

          if (dayIndex >= 0 && dayIndex < 7) {
            dailyCommits[dayIndex]++;  // Verhoog de count voor de dag

            // Update of maak nieuwe commitstatistiek aan voor deze dag in de database
            await CommitStats.findOneAndUpdate(
              { userId: user._id, date: commitDate.toDate() },
              { $set: { commits: dailyCommits[dayIndex] } },
              { upsert: true, new: true }
            );
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
