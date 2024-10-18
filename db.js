const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();


const connectDB = async () => {
    try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devpulse');
    console.log("Connected to MongoDB");
    } catch (err) {
    console.error("Could not connect to MongoDB...", err);
    process.exit(1); // Stop de applicatie als de verbinding mislukt
    }
};

module.exports = connectDB;

//.then(() => console.log("Connected to MongoDB"))
//.catch(err => console.error("Could not connect to MongoDB...", err));