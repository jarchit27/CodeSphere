const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullname:{type: String},
    codeforcesHandle: { type: String, index: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdOn: { type: Date, default: Date.now },
    resetOtp: { type: String, default: null },
    resetOtpExpires: { type: Date, default: null },
    resetOtpAttempts: { type: Number, default: 0 },
    lastResetOtpSentAt: { type: Date, default: null }
});

module.exports = mongoose.model("User" , userSchema);