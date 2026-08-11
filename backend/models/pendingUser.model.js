const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const pendingUserSchema = new Schema({
    fullname: { type: String },
    codeforcesHandle: { type: String },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    hashedOtp: { type: String, required: true },
    otpAttempts: { type: Number, default: 0 },
    lastOtpSentAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now, expires: 600 } // TTL Index: Auto-deletes doc after 10 minutes (600 seconds)
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);
