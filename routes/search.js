const express = require('express');
const router = express.Router();
const User = require('../models/user');
const isAuthenticated = require('../routes/auth');

router.get('/', isAuthenticated, async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Zoekterm is vereist.' });
    }

    try {
    
        const users = await User.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { login: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } },
            ]
        });
    
        res.json(users);
    } catch (error) {
        console.error('Fout bij zoeken:', error.message);
        res.status(500).json({ message: 'Zoekopdracht mislukt.' });
    }
    
});

module.exports = router;

