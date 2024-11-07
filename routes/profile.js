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
    const lastWeek = moment().subtract(6, 'days').startOf('day');
    const dailyCommits = Array(7).fill(0);

    // Haal bestaande commitgegevens uit de database voor de afgelopen week
    const commitStats = await CommitStats.find({
      userId: user._id,
      date: { $gte: lastWeek.toDate() }
    });

    // Bestaande commitgegevens worden toegewezen aan de dailyCommits-array
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

    // Loop door elke repository en haal de commits op voor de afgelopen week
    for (const repo of repositories) {
      try {
        const commitsResponse = await axios.get(`https://api.github.com/repos/${repo.full_name}/commits`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { since: lastWeek.toISOString() }
        });

        // Verwerk nieuwe commits van deze week
        for (const commit of commitsResponse.data) {
          const commitDate = moment(commit.commit.author.date).startOf('day');
          const dayIndex = commitDate.diff(lastWeek, 'days');

          if (dayIndex >= 0 && dayIndex < 7) {
            // Zoek een bestaande `CommitStats` document op basis van datum en userId
            let existingStat = await CommitStats.findOne({
              userId: user._id,
              date: commitDate.toDate()
            });

            if (existingStat) {
              // Als de bestaande commits al overeenkomen, doe niets
              if (existingStat.commits !== dailyCommits[dayIndex]) {
                dailyCommits[dayIndex] = existingStat.commits;
              }
            } else {
              // Voeg de commit toe aan de dailyCommits-array en maak een nieuw document
              dailyCommits[dayIndex]++;
              isUpdateNeeded = true;  // Markeer dat we een update nodig hebben
            }
          }
        }
      } catch (err) {
        if (err.response && err.response.status === 409) {
          console.warn(`Geen commits beschikbaar voor repository: ${repo.full_name}`);
        } else {
          console.error("Fout bij het ophalen van commits:", err.message);
        }
      }  
    }

    // Update database alleen als er nieuwe gegevens zijn
    if (isUpdateNeeded) {
      for (let i = 0; i < 7; i++) {
        const date = moment(lastWeek).add(i, 'days').toDate();

        // Zoek een bestaand document of maak een nieuw aan
        await CommitStats.findOneAndUpdate(
          { userId: user._id, date },
          { userId: user._id, date, commits: dailyCommits[i] },
          { upsert: true }  // Maakt een nieuw document aan als het niet bestaat
        );
      }
    }

    // Bereken de grootte van elk hartje op basis van het aantal commits
    const maxCommits = 10;
    const heartSizes = dailyCommits.map(commitCount => {
      const scale = Math.min(commitCount, maxCommits) / maxCommits;
      const heartSize = 24 + (24 * scale); // Basisgrootte 24px, max 48px
      return heartSize;
    });

    // Render de profielpagina met dailyCommits (gecombineerde commits van alle repositories)
    res.render('profile', { user, dailyCommits, heartSizes, repositories });
  } catch (error) {
    console.error("Fout bij het ophalen van commits of repositories:", error.message);
    res.status(500).send("Er ging iets mis bij het ophalen van de commits of repositories.");
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
    console.error("Fout bij het updaten van de gebruiker:", error.message);
    return res.status(500).send("Er ging iets mis bij het updaten van de gebruiker.");
  }
});

module.exports = router;
