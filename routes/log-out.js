const express = require('express');
const router = express.Router();

// Uitlogroute
router.get('/logout', (req, res) => {
    // Vernietig de sessie van de gebruiker
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
            return res.redirect('/profile'); // Als er iets misgaat, blijf op profielpagina
        }
        res.clearCookie('connect.sid'); // Verwijder de sessiecookie
        res.redirect('/'); // Stuur de gebruiker terug naar de landingspagina
    });
});

module.exports = router;