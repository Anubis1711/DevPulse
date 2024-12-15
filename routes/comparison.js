const express = require('express');
const router = express.Router();

// Statische vergelijking demo pagina
router.get('/', (req, res) => {
    console.log("Comparison route is aangeroepen");
    res.render('comparison');
});

module.exports = router;
