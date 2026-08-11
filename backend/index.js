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
mongoose.connect(process.env.MONGO_URI);

const User = require("./models/user.model");
const Friend = require("./models/friend.model");
const Problem = require("./models/problem.model");

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const app = express();
const jwt = require('jsonwebtoken');
const {authenticateToken} = require("./utilities");
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
    cors({origin: "*",})
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

apiV1.post("/create-account", authLimiter, catchAsync(async(req, res) =>{
    if (!req.body) {
        return res.status(400).json({ error: true, message: "Invalid request body" });
    }
    
    const {fullname , codeforcesHandle ,email, password} = req.body;

    if(!fullname)
    {
        return res
        .status(400)
        .json({error:true , message: "Full Name is required"});
    }
    if(!codeforcesHandle)
    {
        return res.status(400).json({error:true , message: "Handle is required"})
    }
    if(!email)
    {
        return res.status(400).json({error:true , message: "Email is required"})
    }
    if(!password)
    {
        return res.status(400).json({error:true , message: "Password is required"})
    }

    const isUser = await User.findOne({email: email});

    if(isUser){
        return res.status(409).json({error:true, message:"User already exists"})
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({fullname, codeforcesHandle ,email , password: hashedPassword });
    await user.save();
    const accessToken  = jwt.sign({ user: { _id: user._id } }, process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: "36000m"
    })

    return res.json({
        error:false,
        user,
        accessToken,
        message: "Regisatration Successful",
    })
}));

apiV1.post("/login" , authLimiter, catchAsync(async(req, res)=>{
    if (!req.body) {
        return res.status(400).json({ error: true, message: "Invalid request body" });
    }

    const {email,password} = req.body;

    if(!email){
        return res.status(400).json({error:true , message: "Email is required"})
    }
    if(!password)
    {
        return res.status(400).json({error:true , message: "Password is required"})
    }

    const userInfo = await User.findOne({email: email});
    if(!userInfo){
        return res.status(400).json({error:true , message: "User not found"})
    }
    const isPasswordValid = await bcrypt.compare(password, userInfo.password);
    if(userInfo.email == email && isPasswordValid)
    {
        const accessToken = jwt.sign({ user: { _id: userInfo._id } }, process.env.ACCESS_TOKEN_SECRET,{expiresIn:"36000m"});

        return res.json({error:false, message:"Login Successful", email, accessToken});
    }
    else
    {
        return res.status(400).json({error:true, message:"Wrong Credentials"});
    }
}));

apiV1.get("/get-user" ,authenticateToken, catchAsync(async(req, res)=>{
    const {user} = req.user;
    const isUser = await User.findOne({_id: user._id});
    if(!isUser){
        return res.status(401).json({ error: true, message: "User not found" });
    }
    return res.status(200).json({user:{ fullname: isUser.fullname, codeforcesHandle: isUser.codeforcesHandle ,email: isUser.email, "_id" : isUser._id}, message:""});
}));

apiV1.post("/add-friend" , authenticateToken , catchAsync(async(req, res)=>{

    const {handle, name} = req.body;
    const { user } = req.user;

    if(!handle){
        return res.status(400).json({error:true , message: "Handle is required"})
    }
    if(!name){
        return res.status(400).json({error:true , message: "Friend is required"})
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
    return res.json({
        error: false,
        friend,
        message:"Friend added successfully",
    })
}));

apiV1.put("/edit-friend/:friendId" , authenticateToken , catchAsync(async(req, res)=>{

    const friendId = req.params.friendId;
    const {handle, name} = req.body;
    const {user} = req.user;

    if(!handle && !name )
        return res.status(401).json({error:true, message:"Error not found Friend"})

    
    const friend = await Friend.findOne({_id:friendId, userId: user._id})

    if(!friend)
        return res.status(404).json({error:true, message:"Friend not found"})

    if(handle) friend.handle = handle;
    if(name) friend.name = name;

    await friend.save();
    return res.json({
        error: false,
        friend,
        message:"friend added successfully",
    })
}));

apiV1.delete("/delete-friend/:friendId" , authenticateToken , catchAsync(async(req, res)=>{
    const friendId = req.params.friendId;
    const {user} = req.user;

    const friend = await Friend.findOne({_id:friendId, userId: user._id});

    if(!friend)
        return res.status(404).json({error:true, message:"Friend not found"})

    await Friend.deleteOne({_id: friendId, userId: user._id});
    return res.json({
        error: false,
        message:"Friend deleted successfully"
    })
}));

apiV1.get("/get-all-friends/" , authenticateToken , catchAsync(async(req, res)=>{
    const {user} = req.user;
    
    // Pagination parameters (default page 1, limit 12)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const totalFriends = await Friend.countDocuments({userId: user._id});
    const totalPages = Math.ceil(totalFriends / limit);
    
    const friends = await Friend.find({userId: user._id}).skip(skip).limit(limit);
    
    return res.json({
        error: false,
        friends,
        currentPage: page,
        totalPages: totalPages === 0 ? 1 : totalPages,
        totalFriends,
        message:"All friends successfully",
    });
}));

apiV1.post("/add-problem" , authenticateToken , catchAsync(async(req, res)=>{

    const {questionName,platform,difficulty,questionLink,notes ,tags} = req.body;
    const { user } = req.user;

    if(!questionName){
        return res.status(400).json({error:true , message: "Question Name is required"})
    }
    if(!platform){
        return res.status(400).json({error:true , message: "Platform is required"})
    }

    if(!difficulty){
        return res.status(400).json({error:true , message: "Difficulty Level is required"})
    }

    if(!questionLink){
        return res.status(400).json({error:true , message: "Link of Question is required"})
    }

    if(!notes){
        return res.status(400).json({error:true , message: "Note is required"})
    }

    const existingProblem = await Problem.findOne({ questionLink, userId: user._id });
    if (existingProblem) {
        return res.status(400).json({ error: true, message: "Problem already added" });
    }

    const problem = new Problem({
        questionName,platform,difficulty,questionLink,notes ,
        tags: tags || [],
        userId: user._id,
    });
    await problem.save();
    return res.json({
        error: false,
        problem,
        message:"Problem added successfully",
    })
}));

apiV1.delete("/delete-problem/:problemId" , authenticateToken , catchAsync(async(req, res)=>{
    const problemId = req.params.problemId;
    const {user} = req.user;

    const problem = await Problem.findOne({_id:problemId, userId: user._id});

    if(!problem)
        return res.status(404).json({error:true, message:"Problem not found"})

    await Problem.deleteOne({_id: problemId, userId: user._id});
    return res.json({
        error: false,
        message:"Problem deleted successfully"
    })
}));

apiV1.get("/get-all-problems/" , authenticateToken , catchAsync(async(req, res)=>{
    const {user} = req.user;
    
    // Pagination parameters (default page 1, limit 12)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const totalProblems = await Problem.countDocuments({userId: user._id});
    const totalPages = Math.ceil(totalProblems / limit);
    
    const problems = await Problem.find({userId: user._id}).skip(skip).limit(limit);
    
    return res.json({
        error: false,
        problems,
        currentPage: page,
        totalPages: totalPages === 0 ? 1 : totalPages,
        totalProblems,
        message:"All Problems successfully",
    });
}));

apiV1.get("/search-friend/", authenticateToken, catchAsync(async(req,res)=>{
    const {user} = req.user;
    const {query} = req.query;
    if(!query){
        return res.status(400).json({error:true , message:"query is required"})
    } 

    const matchingFriends = await Friend.find({
        userId: user._id,
        $or:[
            {handle : {$regex : new RegExp(query, "i")}},
            {name :{$regex : new RegExp(query, "i")}},
        ],
    });

    return res.json({
        error: false,
        friends: matchingFriends ,
        message:"Friends search query retrieved successfully",
    });
}));

app.use("/api/v1", apiV1);

// 3. Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("🔥 Error caught by global handler:", err.stack);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || "Internal Server Error"
    });
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
module.exports = app;