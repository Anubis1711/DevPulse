const express = require('express'); 
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./db');
const session = require('express-session');
const MongoStore = require('connect-mongo');

dotenv.config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// Configureer EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Gebruik express-session met MongoDB voor sessiebeheer
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/devpulse',
    ttl: 14 * 24 * 60 * 60  
  }),
  cookie: { secure: false }
}));

// Middleware voor statische bestanden en body-parsing
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes importeren
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const logoutRoutes = require('./routes/log-out');
const feedRoutes = require('./routes/feed');
const commitRoutes = require('./routes/commits');
const followRoutes = require('./routes/follow');
const comparisonRoutes = require('./routes/comparison');
const searchRoutes = require('./routes/search');

// Route voor de home pagina
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Database verbinden en routes configureren
connectDB().then(() => {
  app.use('/auth', authRoutes);
  app.use('/profile', profileRoutes);
  app.use('/', logoutRoutes);
  app.use('/feed', feedRoutes);
  app.use('/commits', commitRoutes);
  app.use('/follow', followRoutes);
  app.use('/comparison', comparisonRoutes);
  app.use('/search', searchRoutes);

  // Server starten
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to connect to MongoDB. Server not started.", err);
});