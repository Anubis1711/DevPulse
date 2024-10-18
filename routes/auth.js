const express = require('express');
const axios = require('axios');
const User = require('../models/user');
const router = express.Router();

router.get('/github', (req, res) => {
  const redirect_uri = `http://localhost:3000/auth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${redirect_uri}&scope=user`;
  res.redirect(url);
});

router.get('/github/callback', async (req, res) => {
    const code = req.query.code;
  
    if (!code) {
      return res.status(400).send("GitHub OAuth code ontbreekt.");
    }
  
    try {
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }, {
        headers: { Accept: 'application/json' },
      });
  
      const accessToken = tokenResponse.data.access_token;
      if (!accessToken) {
        return res.status(500).send("Kon geen toegangstoken verkrijgen.");
      }
  
      req.session.accessToken = accessToken;
  
      // Haal gebruikersinformatie op
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
  
      const { id, login, name, avatar_url, bio } = userResponse.data;
  
      // Zoek de gebruiker op of maak een nieuwe aan
      let user = await User.findOne({ githubId: id });
      if (!user) {
        user = new User({
          githubId: id,
          login,
          name,
          avatarUrl: avatar_url,
          bio
        });
        await user.save();
      }

      // Sla de gebruikerslogin op in de sessie
      req.session.userLogin = login;

      req.session.save((err) => { 
        if (err) { 
            console.error("Error bij het opslaan van de sessie:", err); 
            if (!res.headersSent) {
                return res.status(500).send("Er ging iets mis bij het opslaan van de sessie.");}
        } else {
            if (!res.headersSent) {
                res.redirect('/profile')
            }
        }
    });
  
      res.redirect('/profile'); 
    } catch (error) {
      console.error("Error tijdens OAuth:", error.message);
      res.status(500).send("Er ging iets mis met de GitHub OAuth.");
    }
});

function isAuthenticated(req, res, next) {
    console.log("isAuthenticated sessie check:", req.session);
    if (req.session && req.session.accessToken) {
        return next();
    } else {
        return res.redirect('/'); // Redirect naar home wanneer inloggen niet lukt
    }
}

module.exports = isAuthenticated;

module.exports = router;
