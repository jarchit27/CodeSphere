const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullname:{type: String},
    codeforcesHandle:{type: String, unique: true, index: true},
    email: {type:String, required: true, unique: true, index: true},
    password: {type:String},
    createdOn: {type: Date, default: Date.now},
})

module.exports = mongoose.model("User" , userSchema);