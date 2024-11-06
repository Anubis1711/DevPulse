const mongoose = require('mongoose');

const commitStatsSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    commits: { type: Number, default: 0 }
});

const CommitStats = mongoose.model('CommitStats', commitStatsSchema);
module.exports = CommitStats;
