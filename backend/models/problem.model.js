const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const problemSchema = new Schema({
  questionName: {
    type: String,
    required: true,
  },

  platform:{
    type:String,
    required : true,
    enum: ['LeetCode', 'Codeforces', 'CodeChef' ,'GeeksforGeeks', 'HackerRank','AtCoder', 'TopCoder' ,'Other'],

  },
  difficulty:{
    type:String,
    required : true,
    enum: ['Easy', 'Medium', 'Hard'],
  },

  questionLink: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^(https?:\/\/)/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },

  notes: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  userId:{type:String, required: true},
  fetchedAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports  = mongoose.model('Problem', problemSchema);