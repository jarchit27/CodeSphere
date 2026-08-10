require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI);

const User = require("./models/user.model");
const Friend = require("./models/friend.model");
const Problem = require("./models/problem.model");

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const app= express();
const jwt = require('jsonwebtoken');
const {authenticateToken} = require("./utilities");
app.use(express.json());

app.use(
    cors({origin: "*",})
);

app.post("/create-account", async(req, res) =>{
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
        return res.json({error:true, message:"User already exists"})
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
});

app.post("/login" , async(req, res)=>{
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
    const isPasswordValid = await bcrypt.compare(password, userInfo.password) || userInfo.password === password;
    if(userInfo.email == email && isPasswordValid)
    {
        const accessToken = jwt.sign({ user: { _id: userInfo._id } }, process.env.ACCESS_TOKEN_SECRET,{expiresIn:"36000m"});

        return res.json({error:false, message:"Login Successful", email, accessToken});
    }
    else
    {
        return res.status(400).json({error:true, message:"Wrong Credentials"});
    }
});

app.get("/get-user" ,authenticateToken, async(req, res)=>{
    const {user} = req.user;
    const isUser = await User.findOne({_id: user._id});
    if(!isUser){
        return res.status(401).json({ error: true, message: "User not found" });
    }
    return res.status(200).json({user:{ fullname: isUser.fullname, codeforcesHandle: isUser.codeforcesHandle ,email: isUser.email, "_id" : isUser._id}, message:""});
});

app.post("/add-friend" , authenticateToken ,async(req, res)=>{

    const {handle, name} = req.body;
    const { user } = req.user;

    if(!handle){
        return res.status(400).json({error:true , message: "Handle is required"})
    }
    if(!name){
        return res.status(400).json({error:true , message: "Friend is required"})
    }

    try{
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
    }
    catch(error){
        return res.status(500).json({
            error:true,
            message: "Internal Server Error",
        });
    }
});

app.put("/edit-friend/:friendId" , authenticateToken ,async(req, res)=>{

    const friendId = req.params.friendId;
    const {handle, name} = req.body;
    const {user} = req.user;

    if(!handle && !name )
        return res.status(401).json({error:true, message:"Error not found Friend"})

    
    try{
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
    }
    catch(error){
        return res.status(500).json({
            error:true,
            message: "Internal Server Error",
        });
    }
});

app.delete("/delete-friend/:friendId" , authenticateToken ,async(req, res)=>{
    const friendId = req.params.friendId;
    const {user} = req.user;
    try{
        const friend = await Friend.findOne({_id:friendId, userId: user._id});

        if(!friend)
            return res.status(404).json({error:true, message:"Friend not found"})

        await Friend.deleteOne({_id: friendId, userId: user._id});
        return res.json({
            error: false,
            message:"Friend deleted successfully"
        })
    }
    catch(error){
        return res.status(500).json({
            error:true,
            message: "Internal Server Error"
        });
    }
});

app.get("/get-all-friends/" , authenticateToken ,async(req, res)=>{
    const {user} = req.user;
    try{
        const friends = await Friend.find({userId: user._id});
        return res.json({
            error: false,
            friends,
            message:"All friends successfully",
        });
    }
    catch(error){
        return res.status(500).json({
            error:true,
            message: "Internal Server Error",
        });
    }
});

app.post("/add-problem" , authenticateToken ,async(req, res)=>{

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

    try{
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
    }
    catch(error){
        return res.status(500).json({
            error:true,
            message: "Internal Server Error",
        });
    }
});

app.delete("/delete-problem/:problemId" , authenticateToken ,async(req, res)=>{
    const problemId = req.params.problemId;
    const {user} = req.user;
    try{
        const problem = await Problem.findOne({_id:problemId, userId: user._id});

        if(!problem)
            return res.status(404).json({error:true, message:"Problem not found"})

        await Problem.deleteOne({_id: problemId, userId: user._id});
        return res.json({
            error: false,
            message:"Problem deleted successfully"
        })
    }
    catch(error){
        return res.status(500).json({
            error:true,
            message: "Internal Server Error"
        });
    }
});

app.get("/get-all-problems/" , authenticateToken ,async(req, res)=>{
    const {user} = req.user;

    try{
        const problems = await Problem.find({userId: user._id});
        return res.json({
            error: false,
            problems,
            message:"All Problems successfully",
        });

    }
    catch(error){
        return res.status(500).json({
            error:true,
            message: "Internal Server Error",
        });
    }
});

app.get("/search-friend/", authenticateToken, async(req,res)=>{
    const {user} = req.user;
    const {query} = req.query;
    if(!query){
        return res.status(400).json({error:true , message:"query is required"})
    } 

    try {
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
    }
    catch(error){
        return res.status(500).json({
            error:true,
            message: "Internal Server Error",
        });
    }
});

app.get("/friend-stats/:handle", authenticateToken, async(req, res) => {
    const {handle} = req.params;
    const {user} = req.user;

    try {
        const friend = await Friend.findOne({ handle, userId: user._id });
        if (!friend) {
            return res.status(404).json({ error: true, message: "Friend not found" });
        }

        const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
        const now = new Date();
        const isCacheValid = friend.fetchedAt && 
                            friend.contestCount !== undefined && 
                            friend.problemsSolved !== undefined && 
                            (now - new Date(friend.fetchedAt)) < SIX_HOURS_MS;

        if (isCacheValid) {
            return res.json({
                error: false,
                stats: {
                    contestsCount: friend.contestCount,
                    solvedCount: friend.problemsSolved
                },
                cached: true
            });
        }

        // Fetch fresh data from Codeforces if stale or missing
        const [ratingRes, statusRes] = await Promise.all([
            axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`).catch(() => null),
            axios.get(`https://codeforces.com/api/user.status?handle=${handle}`).catch(() => null)
        ]);

        let contestsCount = friend.contestCount;
        let solvedCount = friend.problemsSolved;
        let fetchedSuccess = false;

        if (ratingRes && ratingRes.data && ratingRes.data.status === 'OK') {
            contestsCount = ratingRes.data.result.length;
            fetchedSuccess = true;
        }

        if (statusRes && statusRes.data && statusRes.data.status === 'OK') {
            const solved = new Set();
            statusRes.data.result.forEach(submission => {
                if (submission.verdict === 'OK' && submission.problem) {
                    solved.add(`${submission.problem.contestId}-${submission.problem.index}`);
                }
            });
            solvedCount = solved.size;
            fetchedSuccess = true;
        }

        // Update DB only if at least one fetch succeeded
        if (fetchedSuccess) {
            if (contestsCount !== undefined) friend.contestCount = contestsCount;
            if (solvedCount !== undefined) friend.problemsSolved = solvedCount;
            friend.fetchedAt = now;
            await friend.save();
        }

        return res.json({
            error: false,
            stats: {
                contestsCount,
                solvedCount
            },
            cached: false
        });

    } catch (error) {
        console.error("Stats fetch error:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
module.exports = app;