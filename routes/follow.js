const express = require('express');
const router = express.Router();
const User = require('../models/user');
const isAuthenticated = require('../routes/auth');

// Profielpagina
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findOne({ login: req.session.userLogin }).populate('followers');
        if (!user) {
            return res.status(404).send("Gebruiker niet gevonden");
        }

        const profileUser = user; // Dit is de gebruiker wiens profiel wordt bekeken
        const currentUser = req.user; // De ingelogde gebruiker

        // Debug-logging
        console.log("profileUser:", profileUser);
        console.log("currentUser:", currentUser);

        // Render de profielpagina
        res.render('profile', { profileUser, currentUser });
    } catch (error) {
        console.error("Fout bij ophalen profielgegevens:", error.message);
        res.status(500).send("Er ging iets mis.");
    }
});

// Route om een gebruiker te volgen
router.post('/:id/follow', isAuthenticated, async (req, res) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToFollow || !currentUser) {
            return res.status(404).send({ message: 'Gebruiker niet gevonden' });
        }

        // Controleer of de gebruiker al wordt gevolgd
        if (!currentUser.following.includes(userToFollow._id)) {
            currentUser.following.push(userToFollow._id);
            userToFollow.followers.push(currentUser._id);

            await currentUser.save();
            await userToFollow.save();

            return res.status(200).send({ message: 'Gebruiker gevolgd', user: userToFollow });
        }
        // volgmelding

        res.status(400).send({ message: 'Gebruiker wordt al gevolgd' });
    } catch (error) {
        console.error('Fout bij volgen:', error.message);
        res.status(500).send({ message: 'Er ging iets mis', error });
    }
});

// Route om een gebruiker te ontvolgen
router.post('/:id/unfollow', isAuthenticated, async (req, res) => {
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.user._id);

        if (!userToUnfollow || !currentUser) {
            return res.status(404).send({ message: 'Gebruiker niet gevonden' });
        }

        // Controleer of de gebruiker wordt gevolgd
        currentUser.following = currentUser.following.filter(
            (id) => id.toString() !== userToUnfollow._id.toString()
        );
        userToUnfollow.followers = userToUnfollow.followers.filter(
            (id) => id.toString() !== currentUser._id.toString()
        );

        await currentUser.save();
        await userToUnfollow.save();

        res.status(200).send({ message: 'Gebruiker ontvolgd', user: userToUnfollow });
    } catch (error) {
        console.error('Fout bij ontvolgen:', error.message);
        res.status(500).send({ message: 'Er ging iets mis', error });
    }
});

module.exports = router;
