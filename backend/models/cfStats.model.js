const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cfStatsSchema = new Schema({
  handle: { type: String, required: true, unique: true, trim: true },
  solvedCount:    { type: Number, default: 0 },
  contestsCount:  { type: Number, default: 0 },
  rating:         { type: Number, default: 0 },
  maxRating:      { type: Number, default: 0 },
  rank:           { type: String, default: '' },
  maxRank:        { type: String, default: '' },
  country:        { type: String, default: '' },
  city:           { type: String, default: '' },
  organization:   { type: String, default: '' },
  friendOfCount:  { type: Number, default: 0 },
  contribution:   { type: Number, default: 0 },
  lastSyncedAt:   { type: Date, default: null },
});

module.exports = mongoose.model('CfStats', cfStatsSchema);
