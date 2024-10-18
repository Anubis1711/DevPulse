const express = require('express');
const User = require('../models/user');
const router = express.Router();
const isAuthenticated = require('../routes/auth');

// Profile GET route
router.get('/', isAuthenticated, async (req, res) => {
  console.log("Sessiewaarde:", req.session);

  // Controleer of de sessie en accessToken aanwezig zijn
  if (!req.session || !req.session.accessToken) {
    console.error("Access token ontbreekt of sessie bestaat niet");
    return res.redirect('/login'); // Stuur naar login als de gebruiker niet ingelogd is
  }

  try {
    // Corrigeer de sessie-typfout
    const user = await User.findOne({ login: req.session.userLogin });

    if (!user) {
      return res.status(404).send("Gebruiker niet gevonden");
    }

    // Render het profiel van de gebruiker
    res.render('profile', { user });

  } catch (error) {
    console.error("Error tijdens het ophalen van de gebruiker:", error.message);
    return res.status(500).send("Er ging iets mis bij het ophalen van de gebruiker.");
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
