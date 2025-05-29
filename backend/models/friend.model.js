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
  userId:{type:String, required: true},
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
module.exports  = mongoose.model('Friend', friendSchema);