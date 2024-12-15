const express = require('express'); // setup van express
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./db');
const session = require('express-session');



dotenv.config(); // Laad .env bestand voor gevoelige gegevens

const app = express();
const PORT = process.env.PORT || 3000;

// Configureer EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Gebruik express-session voor sessiebeheer
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true, // true = voor debugging
}));

// Middleware voor statische bestanden en body-parsing
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Gebruik van routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const logoutRoutes = require('./routes/log-out');
const feedRoutes = require('./routes/feed');
const commitRoutes = require('./routes/commits')
const followRoutes = require('./routes/follow')
const comparisonRoutes = require('./routes/comparison');


// Gebruik de routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/', logoutRoutes);
app.use('/feed', feedRoutes);
app.use('/commits', commitRoutes);
app.use('/follow', followRoutes);
app.use('/comparison', comparisonRoutes);



// Route voor de home pagina
//app.get('/', (req, res) => {
  //res.sendFile(path.join(__dirname, 'views', 'index.html'));
//});

connectDB().then(() => {
  // Routes configureren
  app.use('/auth', authRoutes);
  app.use('/profile', profileRoutes);

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  });

  // Server starten
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to connect to MongoDB. Server not started.");
});

