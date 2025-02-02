const express = require('express');
const axios = require('axios');
const User = require('../models/user');
const router = express.Router();

const getValueOrFallback = (value, fallback = '-') => (value ? value : fallback);

router.get('/', async (req, res) => {
    const { selectedUser } = req.query;;

    if (!req.session || !req.session.userLogin) {
        return res.redirect('/login');
    }

    try {
        // Haal ingelogde gebruiker (currentUser) van GitHub op
        const currentUser = await fetchGitHubData(req.session.accessToken);

        // Haal geselecteerde gebruiker uit de database
        const dbUser = await User.findOne({ login: selectedUser });


        if (!dbUser) {
            return res.status(404).send("Gebruiker niet gevonden in database.");
        }

        const selectedUserData = {
            avatarUrl: dbUser.avatarUrl || '-',
            name: dbUser.name || '-',
            login: dbUser.login || '-',
            bio: dbUser.bio || '-',
            repoCount: dbUser.repositories ? dbUser.repositories.length : '-',
            followers: dbUser.followers ? dbUser.followers.length : '-',
            highestStreak: '-',
            mostUsedLanguage: 'Onbekend',
        };

        res.render('comparison', { 
            currentUser: currentUser, 
            selectedUser: selectedUserData 
        });

    } catch (error) {
        console.error('Fout bij ophalen gebruikers:', error);
        res.status(500).send('Er ging iets mis.');
    }
});

// Functie om GitHub data op te halen voor de ingelogde gebruiker
async function fetchGitHubData(accessToken) {
    try {
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const reposResponse = await axios.get(userResponse.data.repos_url, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const followersResponse = await axios.get(userResponse.data.followers_url, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const eventsResponse = await axios.get(`https://api.github.com/users/${userResponse.data.login}/events`, { headers: { Authorization: `Bearer ${accessToken}` } });


        const commitCount = eventsResponse.data.filter(event => event.type === "PushEvent").length;

        return {
            avatarUrl: getValueOrFallback(userResponse.data.avatar_url),
            name: getValueOrFallback(userResponse.data.name),
            login: getValueOrFallback(userResponse.data.login),
            bio: getValueOrFallback(userResponse.data.bio),
            repoCount: reposResponse.data.length || "-",
            followers: followersResponse.data.length || "-",
            commitsThisYear: commitCount || '-',
            highestStreak: "-",
            mostUsedLanguage: await fetchMostUsedLanguage(reposResponse.data),
            createdAt: new Date(userResponse.data.created_at).toLocaleDateString() || '-',
        };
    } catch (error) {
        console.error('Fout bij ophalen GitHub data:', error.message);
        return {
            avatarUrl: '-',
            name: '-',
            login: '-',
            bio: '-',
            repoCount: '-',
            followers: '-',
            commitsThisYear: '-',
            highestStreak: '-',
            mostUsedLanguage: '-',
            createdAt: '-',
        };
    }
}

// Functie om meest gebruikte taal te berekenen
async function fetchMostUsedLanguage(repos) {
    const languages = {};
    repos.forEach(repo => {
        if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
    });

    const mostUsed = Object.entries(languages).sort((a, b) => b[1] - a[1]);
    return mostUsed.length ? mostUsed[0][0] : "-";
}

module.exports = router;
