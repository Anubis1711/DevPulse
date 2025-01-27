const axios = require('axios');
const moment = require('moment');
const express = require('express');
const User = require('../models/user');
const CommitStats = require('../models/commitStats');
const isAuthenticated = require('../routes/auth');  

const router = express.Router();

// Profiel GET-route
router.get('/', isAuthenticated, async (req, res) => {
  try {
    if (!req.session || !req.session.accessToken) {
      return res.redirect('/login');
    }

    const user = await User.findOne({ login: req.session.userLogin });
    if (!user) {
      return res.status(404).send("Gebruiker niet gevonden");
    }

    const accessToken = req.session.accessToken;
    const lastWeek = moment().subtract(6, 'days').startOf('day');
    const dailyCommits = Array(7).fill(0);

    // Haal bestaande commitgegevens op
    const commitStats = await CommitStats.find({
      userId: user._id,
      date: { $gte: lastWeek.toDate() }
    });

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
    let isUpdateNeeded = false;

    // Loop door elke repo en haal commits op
    for (const repo of repositories) {
      try {
        const commitsResponse = await axios.get(`https://api.github.com/repos/${repo.full_name}/commits`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { since: lastWeek.toISOString() }
        });

        // Verwerk nieuwe commits
        for (const commit of commitsResponse.data) {
          const commitDate = moment(commit.commit.author.date).startOf('day');
          const dayIndex = commitDate.diff(lastWeek, 'days');

          if (dayIndex >= 0 && dayIndex < 7) {
            let existingStat = await CommitStats.findOne({
              userId: user._id,
              date: commitDate.toDate()
            });

            if (existingStat) {
              if (existingStat.commits !== dailyCommits[dayIndex]) {
                dailyCommits[dayIndex] = existingStat.commits;
              }
            } else {
              dailyCommits[dayIndex]++;
              isUpdateNeeded = true;
            }
          }
        }
      } catch (err) {
        if (err.response && err.response.status === 409) {
          console.warn(`Geen commits voor repo: ${repo.full_name}`);
        } else {
          console.error("Fout bij ophalen commits:", err.message);
        }
      }
    }

    // Update database indien nodig
    if (isUpdateNeeded) {
      for (let i = 0; i < 7; i++) {
        const date = moment(lastWeek).add(i, 'days').toDate();

        await CommitStats.findOneAndUpdate(
          { userId: user._id, date },
          { userId: user._id, date, commits: dailyCommits[i] },
          { upsert: true }
        );
      }
    }

    // Bereken hartgrootte op basis van commits
    const maxCommits = 10;
    const heartSizes = dailyCommits.map(commitCount => {
      const scale = Math.min(commitCount, maxCommits) / maxCommits;
      return 24 + (24 * scale);
    });

    // Render de profielpagina
    res.render('profile', { user, dailyCommits, heartSizes, repositories });

  } catch (error) {
    console.error("Fout bij ophalen commits/repos:", error.message);
    res.status(500).send("Er ging iets mis bij het ophalen van gegevens.");
  }
});

// Profiel POST-route om de beschrijving te updaten
router.post('/', isAuthenticated, async (req, res) => {
  const { login, description } = req.body;

  if (!login) {
    return res.status(400).send("Loginnaam ontbreekt in verzoek");
  }

  try {
    await User.updateOne({ login }, { description });
    res.redirect('/profile');
  } catch (error) {
    console.error("Fout bij updaten gebruiker:", error.message);
    return res.status(500).send("Er ging iets mis bij het updaten van de gebruiker.");
  }
});

module.exports = router;
