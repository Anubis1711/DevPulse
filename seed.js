const mongoose = require('mongoose');
const User = require('./models/user');
const Post = require('./models/post');
const CommitStats = require('./models/commitStats');
const dotenv = require('dotenv');

dotenv.config();

const demoUsers = [
  {
    username: "JohnDD",
    login: "JohnDoe",
    name: "John Doe",
    githubId: "12345",
    avatarUrl: "https://i.pravatar.cc/150?img=1",
    bio: "Passionate full-stack developer",
    description: "Love coding in JavaScript and building cool projects.",
    followers: [],
    following: [],
    mostUsedLanguage: 'JavaScript',
    commitsThisYear: 150,
    createdAt: '2021-04-12'
  },
  {
    username: "JaneS",
    login: "JaneS",
    name: "Jane Smith",
    githubId: "67890",
    avatarUrl: "https://i.pravatar.cc/150?img=2",
    bio: "Backend engineer with love for Python.",
    description: "Building APIs and automating workflows.",
    followers: [],
    following: [],
    mostUsedLanguage: 'Python',
    commitsThisYear: 196,
    createdAt: '2018-05-19'
  },
  {
    username: "SAM03",
    login: "SAM03",
    name: "Sam Lee",
    githubId: "11111",
    avatarUrl: "https://i.pravatar.cc/150?img=3",
    bio: "Frontend developer mastering React.",
    description: "Focusing on clean, responsive UI design.",
    followers: [],
    following: [],
    mostUsedLanguage: 'JavaScript',
    commitsThisYear: 218,
    createdAt: '2020-02-08'
  }
];

// Voeg posts toe voor demo-gebruikers
const demoPosts = [
  { content: "First post from JohnDD", author: null },
  { content: "Just completed a new feature!", author: null },
  { content: "Learning GraphQL is fun!", author: null },
];

// Voeg commit data toe
const demoCommits = [
  { userId: null, date: new Date(), commits: 10 },
  { userId: null, date: new Date(), commits: 5 }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/devpulse");
    console.log("Database connected!");

    // Voeg demo-gebruikers toe
    const createdUsers = await User.insertMany(demoUsers);
    console.log("Demo gebruikers toegevoegd:", createdUsers);

    // Koppel posts en commits aan gebruikers
    demoPosts.forEach((post, index) => (post.author = createdUsers[index % createdUsers.length]._id));
    demoCommits.forEach((commit, index) => (commit.userId = createdUsers[index % createdUsers.length]._id));

    await Post.insertMany(demoPosts);
    console.log("Demo posts toegevoegd!");

    await CommitStats.insertMany(demoCommits);
    console.log("Demo commits toegevoegd!");

    console.log("Database succesvol gesseed!");
    process.exit();
  } catch (error) {
    console.error("Fout bij het seeden van de database:", error);
    process.exit(1);
  }
}

seedDatabase();
