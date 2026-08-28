require("dotenv").config();

// 1. Environment Variable Validation
const requiredEnv = ["MONGO_URI", "PORT", "ACCESS_TOKEN_SECRET"];
for (const envVar of requiredEnv) {
    if (!process.env[envVar]) {
        console.error(`FATAL ERROR: Missing environment variable: ${envVar}`);
        process.exit(1);
    }
}

// 2. Async Error Wrapper
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const mongoose = require("mongoose");
const path = require("path");
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ Successfully connected to MongoDB Atlas!");
        reseedQueueOnStartup();
    })
    .catch((err) => {
        console.error("❌ FATAL ERROR: Failed to connect to MongoDB Atlas.");
        console.error("This is usually caused by a network issue or an IP whitelist problem.");
        console.error(err);
        process.exit(1);
    });

const User = require("./models/user.model");
const PendingUser = require("./models/pendingUser.model");
const Friend = require("./models/friend.model");
const Problem = require("./models/problem.model");
const CfStats = require("./models/cfStats.model");
const { enqueue, reseedQueueOnStartup, syncEmitter } = require("./services/syncQueue");
const { validateCodeforcesHandle } = require("./services/cfSyncService");

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const app = express();
app.set("trust proxy", 1);
const jwt = require('jsonwebtoken');
const { authenticateToken, sendVerificationEmail } = require("./utilities");
const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: { error: true, message: "Too many requests from this IP, please try again after 15 minutes" },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json());

app.use(
    cors({ origin: "*", })
);

const apiV1 = express.Router();

// General rate limiter for all API endpoints (100 requests per 15 minutes)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: true, message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
});
apiV1.use(generalLimiter);

apiV1.post("/create-account", authLimiter, catchAsync(async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: true, message: "Invalid request body" });
    }

    const { fullname, codeforcesHandle, email, password } = req.body;

    if (!fullname) {
        return res
            .status(400)
            .json({ error: true, message: "Full Name is required" });
    }
    if (!codeforcesHandle) {
        return res.status(400).json({ error: true, message: "Handle is required" })
    }
    if (!email) {
        return res.status(400).json({ error: true, message: "Email is required" })
    }
    if (!password) {
        return res.status(400).json({ error: true, message: "Password is required" })
    }

    const isUser = await User.findOne({ email: email });

    if (isUser) {
        return res.status(409).json({ error: true, message: "User already exists and is verified" })
    }


    // Cooldown check: prevent spam signups sending unlimited emails
    const existingPending = await PendingUser.findOne({ email });
    if (existingPending && existingPending.lastOtpSentAt) {
        const timeSinceLastOtp = Date.now() - existingPending.lastOtpSentAt.getTime();
        if (timeSinceLastOtp < 60000) {
            return res.status(429).json({ error: true, message: "Please wait 60 seconds before trying again." });
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Upsert into PendingUser
    await PendingUser.findOneAndUpdate(
        { email },
        {
            fullname,
            codeforcesHandle,
            email,
            password: hashedPassword,
            hashedOtp: hashedOtp,
            otpAttempts: 0,
            lastOtpSentAt: new Date(),
            createdAt: new Date() // Resets TTL timer
        },
        { upsert: true, new: true }
    );

    // Send OTP via email in background (or log if no credentials)
    sendVerificationEmail(email, otp).catch(console.error);

    return res.json({
        error: false,
        isVerified: false,
        email: email,
        message: "Registration successful. Please verify your email.",
    })
}));

apiV1.post("/login", authLimiter, catchAsync(async (req, res) => {
    if (!req.body) {
        return res.status(400).json({ error: true, message: "Invalid request body" });
    }

    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ error: true, message: "Email is required" })
    }
    if (!password) {
        return res.status(400).json({ error: true, message: "Password is required" })
    }

    const userInfo = await User.findOne({ email: email });
    if (!userInfo) {
        return res.status(400).json({ error: true, message: "User not found" })
    }
    const isPasswordValid = await bcrypt.compare(password, userInfo.password);
    if (userInfo.email == email && isPasswordValid) {
        const accessToken = jwt.sign({ user: { _id: userInfo._id } }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "36000m" });

        return res.json({
            error: false,
            message: "Login Successful",
            accessToken,
            user: { fullname: userInfo.fullname, codeforcesHandle: userInfo.codeforcesHandle, email: userInfo.email, _id: userInfo._id }
        });
    }
    else {
        return res.status(400).json({ error: true, message: "Wrong Credentials" });
    }
}));

// --- FORGOT PASSWORD ---
apiV1.post("/forgot-password", authLimiter, catchAsync(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: true, message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ error: true, message: "User not found" });
    }

    // Cooldown check (60 seconds)
    if (user.lastResetOtpSentAt) {
        const timeSinceLastOtp = Date.now() - user.lastResetOtpSentAt.getTime();
        if (timeSinceLastOtp < 60000) {
            return res.status(429).json({ error: true, message: "Please wait 60 seconds before trying again." });
        }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.resetOtp = hashedOtp;
    user.resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
    user.resetOtpAttempts = 0;
    user.lastResetOtpSentAt = new Date();
    await user.save();

    sendVerificationEmail(email, otp, "reset").catch(console.error);

    return res.json({
        error: false,
        message: "Password reset OTP sent to your email.",
    });
}));

// --- RESET PASSWORD ---
apiV1.post("/reset-password", authLimiter, catchAsync(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: true, message: "Email, OTP, and new password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetOtp) {
        return res.status(400).json({ error: true, message: "Invalid request or OTP expired" });
    }

    // Check expiry
    if (Date.now() > user.resetOtpExpires.getTime()) {
        user.resetOtp = undefined;
        user.resetOtpExpires = undefined;
        user.resetOtpAttempts = undefined;
        await user.save();
        return res.status(400).json({ error: true, message: "OTP has expired. Please request a new one." });
    }

    // Check attempt limit
    if (user.resetOtpAttempts >= 5) {
        user.resetOtp = undefined;
        user.resetOtpExpires = undefined;
        user.resetOtpAttempts = undefined;
        await user.save();
        return res.status(400).json({ error: true, message: "Too many failed attempts. Please request a new OTP." });
    }

    const isOtpValid = await bcrypt.compare(otp, user.resetOtp);
    if (!isOtpValid) {
        user.resetOtpAttempts += 1;
        await user.save();
        const remaining = 5 - user.resetOtpAttempts;
        return res.status(400).json({ error: true, message: `Invalid OTP. ${remaining} attempt(s) remaining.` });
    }

    // Valid OTP - Reset Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // Clear reset fields
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = undefined;
    // We leave lastResetOtpSentAt to still enforce the 60s cooldown if they immediately forget again
    await user.save();

    return res.json({
        error: false,
        message: "Password reset successfully. You can now login.",
    });
}));

apiV1.post("/verify-email", authLimiter, catchAsync(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: true, message: "Email and OTP are required" });
    }

    // Atomic: grab and remove in one operation to prevent race conditions
    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) {
        return res.status(400).json({ error: true, message: "OTP has expired or user does not exist. Please sign up again." });
    }

    // Check attempt limit (max 5 wrong attempts)
    if (pendingUser.otpAttempts >= 5) {
        await PendingUser.deleteOne({ email });
        return res.status(400).json({ error: true, message: "Too many failed attempts. Please sign up again." });
    }

    const isOtpValid = await bcrypt.compare(otp, pendingUser.hashedOtp);
    if (!isOtpValid) {
        // Increment attempt counter
        pendingUser.otpAttempts += 1;
        await pendingUser.save();
        const remaining = 5 - pendingUser.otpAttempts;
        return res.status(400).json({ error: true, message: `Invalid OTP. ${remaining} attempt(s) remaining.` });
    }

    // OTP is valid — atomically delete PendingUser so a duplicate request gets nothing
    const deletedPendingUser = await PendingUser.findOneAndDelete({ email });
    if (!deletedPendingUser) {
        return res.status(400).json({ error: true, message: "Request already processed." });
    }

    // Move to main User collection
    const user = new User({
        fullname: deletedPendingUser.fullname,
        codeforcesHandle: deletedPendingUser.codeforcesHandle,
        email: deletedPendingUser.email,
        password: deletedPendingUser.password, // Already hashed
    });
    await user.save();

    const accessToken = jwt.sign({ user: { _id: user._id } }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "36000m" });

    return res.json({
        error: false,
        message: "Email verified successfully",
        accessToken,
        user: { fullname: user.fullname, codeforcesHandle: user.codeforcesHandle, email: user.email, _id: user._id }
    });
}));

apiV1.post("/resend-otp", authLimiter, catchAsync(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: true, message: "Email is required" });
    }

    const pendingUser = await PendingUser.findOne({ email });
    if (!pendingUser) {
        return res.status(400).json({ error: true, message: "No pending registration found for this email. Please sign up." });
    }

    // Cooldown check (60 seconds)
    const timeSinceLastOtp = Date.now() - pendingUser.lastOtpSentAt.getTime();
    if (timeSinceLastOtp < 60000) {
        return res.status(429).json({ error: true, message: "Please wait 60 seconds before requesting a new OTP." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    pendingUser.hashedOtp = await bcrypt.hash(otp, 10);
    pendingUser.lastOtpSentAt = new Date();
    pendingUser.createdAt = new Date(); // Reset TTL
    await pendingUser.save();

    sendVerificationEmail(email, otp).catch(console.error);

    return res.json({ error: false, message: "A new OTP has been sent." });
}));

apiV1.get("/get-user", authenticateToken, catchAsync(async (req, res) => {
    const { user } = req.user;
    const isUser = await User.findOne({ _id: user._id });
    if (!isUser) {
        return res.status(401).json({ error: true, message: "User not found" });
    }
    return res.status(200).json({ user: { fullname: isUser.fullname, codeforcesHandle: isUser.codeforcesHandle, email: isUser.email, "_id": isUser._id }, message: "" });
}));

apiV1.post("/add-friend", authenticateToken, catchAsync(async (req, res) => {

    const { handle, name } = req.body;
    const { user } = req.user;

    if (!handle) {
        return res.status(400).json({ error: true, message: "Handle is required" })
    }
    if (!name) {
        return res.status(400).json({ error: true, message: "Friend is required" })
    }

    const existingFriend = await Friend.findOne({ handle, userId: user._id });
    if (existingFriend) {
        return res.status(400).json({ error: true, message: "Friend already added" });
    }

    const friend = new Friend({
        handle,
        name,
        userId: user._id,
    });
    await friend.save();

    // Trigger background sync
    enqueue(handle).catch(console.error);

    return res.json({
        error: false,
        friend,
        message: "Friend added successfully",
    })
}));

apiV1.put("/edit-friend/:friendId", authenticateToken, catchAsync(async (req, res) => {

    const friendId = req.params.friendId;
    const { name } = req.body;
    const { user } = req.user;

    if (!name)
        return res.status(400).json({ error: true, message: "Display name is required" })


    const friend = await Friend.findOne({ _id: friendId, userId: user._id })

    if (!friend)
        return res.status(404).json({ error: true, message: "Friend not found" })

    friend.name = name;

    await friend.save();
    return res.json({
        error: false,
        friend,
        message: "Friend updated successfully",
    })
}));

apiV1.delete("/delete-friend/:friendId", authenticateToken, catchAsync(async (req, res) => {
    const friendId = req.params.friendId;
    const { user } = req.user;

    const friend = await Friend.findOne({ _id: friendId, userId: user._id });

    if (!friend)
        return res.status(404).json({ error: true, message: "Friend not found" })

    await Friend.deleteOne({ _id: friendId, userId: user._id });
    return res.json({
        error: false,
        message: "Friend deleted successfully"
    })
}));

apiV1.get("/get-all-friends/", authenticateToken, catchAsync(async (req, res) => {
    const { user } = req.user;

    // Pagination parameters (default page 1, limit 12)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const sortBy = req.query.sortBy || 'name';
    const order = req.query.order === 'desc' ? -1 : 1;

    let sortStage = { name: order }; // default
    if (sortBy === 'rating') sortStage = { 'stats.rating': order };
    if (sortBy === 'highestRating') sortStage = { 'stats.maxRating': order };
    if (sortBy === 'contests') sortStage = { 'stats.contestsCount': order };
    if (sortBy === 'problems') sortStage = { 'stats.solvedCount': order };
    if (sortBy === 'name') sortStage = { 'name': order };

    const totalFriends = await Friend.countDocuments({ userId: user._id });
    const totalPages = Math.ceil(totalFriends / limit);

    const friendsPipeline = await Friend.aggregate([
        { $match: { userId: user._id.toString() } },
        {
            $lookup: {
                from: 'cfstats', // MongoDB automatically pluralizes and lowercases model names
                localField: 'handle',
                foreignField: 'handle',
                as: 'stats'
            }
        },
        { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } },
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limit }
    ]);

    const enrichedFriends = friendsPipeline.map(f => {
        const stats = f.stats || {};
        return {
            _id: f._id,
            handle: f.handle,
            name: f.name,
            solvedCount: stats.solvedCount || 0,
            contestsCount: stats.contestsCount || 0,
            rating: stats.rating || 0,
            maxRating: stats.maxRating || 0,
            rank: stats.rank || '',
            maxRank: stats.maxRank || '',
            country: stats.country || '',
            city: stats.city || '',
            organization: stats.organization || '',
            contribution: stats.contribution || 0,
            lastSyncedAt: stats.lastSyncedAt || null
        };
    });

    // Lazy Trigger: Enqueue stale handles
    const STALE_MS = 2 * 60 * 60 * 1000;
    enrichedFriends.forEach(f => {
        if (!f.lastSyncedAt || (Date.now() - new Date(f.lastSyncedAt).getTime() > STALE_MS)) {
            enqueue(f.handle).catch(console.error);
        }
    });

    return res.json({
        error: false,
        friends: enrichedFriends,
        currentPage: page,
        totalPages: totalPages === 0 ? 1 : totalPages,
        totalFriends,
        message: "All friends successfully",
    });
}));

apiV1.post("/add-problem", authenticateToken, catchAsync(async (req, res) => {

    const { questionName, platform, difficulty, questionLink, notes, tags } = req.body;
    const { user } = req.user;

    if (!questionName) {
        return res.status(400).json({ error: true, message: "Question Name is required" })
    }
    if (!platform) {
        return res.status(400).json({ error: true, message: "Platform is required" })
    }

    if (!difficulty) {
        return res.status(400).json({ error: true, message: "Difficulty Level is required" })
    }

    if (!questionLink) {
        return res.status(400).json({ error: true, message: "Link of Question is required" })
    }

    if (!notes) {
        return res.status(400).json({ error: true, message: "Note is required" })
    }

    const existingProblem = await Problem.findOne({ questionLink, userId: user._id });
    if (existingProblem) {
        return res.status(400).json({ error: true, message: "Problem already added" });
    }

    const problem = new Problem({
        questionName, platform, difficulty, questionLink, notes,
        tags: tags || [],
        userId: user._id,
    });
    await problem.save();
    return res.json({
        error: false,
        problem,
        message: "Problem added successfully",
    })
}));

apiV1.delete("/delete-problem/:problemId", authenticateToken, catchAsync(async (req, res) => {
    const problemId = req.params.problemId;
    const { user } = req.user;

    const problem = await Problem.findOne({ _id: problemId, userId: user._id });

    if (!problem)
        return res.status(404).json({ error: true, message: "Problem not found" })

    await Problem.deleteOne({ _id: problemId, userId: user._id });
    return res.json({
        error: false,
        message: "Problem deleted successfully"
    })
}));

apiV1.get("/get-all-problems/", authenticateToken, catchAsync(async (req, res) => {
    const { user } = req.user;

    // Pagination parameters (default page 1, limit 12)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const totalProblems = await Problem.countDocuments({ userId: user._id });
    const totalPages = Math.ceil(totalProblems / limit);

    const problems = await Problem.find({ userId: user._id }).skip(skip).limit(limit);

    return res.json({
        error: false,
        problems,
        currentPage: page,
        totalPages: totalPages === 0 ? 1 : totalPages,
        totalProblems,
        message: "All Problems successfully",
    });
}));

apiV1.get("/search-friend/", authenticateToken, catchAsync(async (req, res) => {
    const { user } = req.user;
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: true, message: "query is required" })
    }

    const matchingFriendsPipeline = await Friend.aggregate([
        {
            $match: {
                userId: user._id.toString(),
                $or: [
                    { handle: { $regex: new RegExp(query, "i") } },
                    { name: { $regex: new RegExp(query, "i") } },
                ]
            }
        },
        {
            $lookup: {
                from: 'cfstats',
                localField: 'handle',
                foreignField: 'handle',
                as: 'stats'
            }
        },
        { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } },
        { $sort: { name: 1 } }
    ]);

    const enrichedFriends = matchingFriendsPipeline.map(f => {
        const stats = f.stats || {};
        return {
            _id: f._id,
            handle: f.handle,
            name: f.name,
            solvedCount: stats.solvedCount || 0,
            contestsCount: stats.contestsCount || 0,
            rating: stats.rating || 0,
            maxRating: stats.maxRating || 0,
            rank: stats.rank || '',
            maxRank: stats.maxRank || '',
            country: stats.country || '',
            city: stats.city || '',
            organization: stats.organization || '',
            contribution: stats.contribution || 0,
            lastSyncedAt: stats.lastSyncedAt || null
        };
    });

    // Lazy Trigger: Enqueue stale handles
    const STALE_MS = 2 * 60 * 60 * 1000;
    enrichedFriends.forEach(f => {
        if (!f.lastSyncedAt || (Date.now() - new Date(f.lastSyncedAt).getTime() > STALE_MS)) {
            enqueue(f.handle).catch(console.error);
        }
    });

    return res.json({
        error: false,
        friends: enrichedFriends,
        message: "Friends search query retrieved successfully",
    });
}));

apiV1.get("/validate-handle/:handle", authenticateToken, catchAsync(async (req, res) => {
    const handle = req.params.handle;
    if (!handle) {
        return res.status(400).json({ error: true, message: "Handle is required" });
    }
    const isValid = await validateCodeforcesHandle(handle);
    if (isValid) {
        return res.json({ error: false, message: "Handle is valid" });
    } else {
        return res.status(404).json({ error: true, message: "Handle not found on Codeforces" });
    }
}));

// SSE endpoint: pushes real-time sync updates to connected clients
apiV1.get("/sync-events", authenticateToken, (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });

    // Send a heartbeat every 30s to keep the connection alive
    const heartbeat = setInterval(() => {
        res.write(': heartbeat\n\n');
    }, 30000);

    // Listen for sync completions from the queue
    const onSynced = (data) => {
        res.write(`data: ${JSON.stringify({ type: 'synced', handle: data.handle })}\n\n`);
    };

    const onError = (data) => {
        res.write(`data: ${JSON.stringify({ type: 'error', handle: data.handle, error: data.error })}\n\n`);
    };

    syncEmitter.on('synced', onSynced);
    syncEmitter.on('error', onError);

    // Cleanup when client disconnects
    req.on('close', () => {
        clearInterval(heartbeat);
        syncEmitter.off('synced', onSynced);
        syncEmitter.off('error', onError);
    });
});

app.use("/api/v1", apiV1);

// 3. Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("🔥 Error caught by global handler:", err.stack);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || "Internal Server Error"
    });
});

// --- DEPLOYMENT: Serve Frontend in Production ---
const staticPath = path.join(__dirname, "../frontend/cp_help/dist");
app.use(express.static(staticPath));

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
module.exports = app;