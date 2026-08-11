const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const friendSchema = new Schema({
  handle: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  userId:{type:String, required: true, index: true},
  rank: String,
  rating: Number,
  maxRank: String,
  maxRating: Number,
  contestCount: Number,
  problemsSolved: Number,
  fetchedAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent race conditions where double-clicking "Add" creates duplicate friends
friendSchema.index({ userId: 1, handle: 1 }, { unique: true });

module.exports  = mongoose.model('Friend', friendSchema);