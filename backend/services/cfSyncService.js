const crypto = require('crypto');
const axios = require('axios');
const CfStats = require('../models/cfStats.model');

function generateApiSig(methodName, params) {
    const apiKey = process.env.CF_API_KEY;
    const apiSecret = process.env.CF_API_SECRET;
    
    if (!apiKey || !apiSecret) {
        // Fallback to unauthorized if keys are not present
        return { ...params };
    }

    const time = Math.floor(Date.now() / 1000);
    const rand = crypto.randomBytes(3).toString('hex'); // 6 chars random string
    
    const allParams = { ...params, apiKey, time };
    
    // Sort parameters alphabetically by key
    const sortedKeys = Object.keys(allParams).sort();
    
    const paramsString = sortedKeys.map(key => `${key}=${allParams[key]}`).join('&');
    
    const textToHash = `${rand}/${methodName}?${paramsString}#${apiSecret}`;
    
    const hash = crypto.createHash('sha512').update(textToHash).digest('hex');
    
    const apiSig = `${rand}${hash}`;
    
    return { ...allParams, apiSig };
}

async function syncHandle(handle) {
    try {
        // 1. Fetch user.info
        const userInfoParams = generateApiSig('user.info', { handles: handle });
        const userInfoRes = await axios.get('https://codeforces.com/api/user.info', { params: userInfoParams });
        
        if (userInfoRes.data.status !== 'OK' || !userInfoRes.data.result || userInfoRes.data.result.length === 0) {
            throw new Error('Invalid user info response from Codeforces');
        }
        
        const userInfo = userInfoRes.data.result[0];

        // 2. Fetch user.status (to calculate problems solved)
        const userStatusParams = generateApiSig('user.status', { handle: handle });
        const userStatusRes = await axios.get('https://codeforces.com/api/user.status', { params: userStatusParams });
        
        if (userStatusRes.data.status !== 'OK') {
            throw new Error('Invalid user status response from Codeforces');
        }

        const submissions = userStatusRes.data.result;
        
        // Calculate solved count (unique problems with OK verdict)
        const solvedProblems = new Set();
        for (const sub of submissions) {
            if (sub.verdict === 'OK' && sub.problem) {
                // Unique problem identifier: contestId + index (e.g., "123A")
                if (sub.problem.contestId && sub.problem.index) {
                    solvedProblems.add(`${sub.problem.contestId}${sub.problem.index}`);
                }
            }
        }
        
        // Calculate contests given from user.rating (optional, but requested in plan)
        // Wait, Codeforces `user.rating` returns contest history. We can fetch it, 
        // or just rely on user.info's rating/maxRating and assume contests count is what is in user.rating.
        const userRatingParams = generateApiSig('user.rating', { handle: handle });
        const userRatingRes = await axios.get('https://codeforces.com/api/user.rating', { params: userRatingParams });
        
        let contestsCount = 0;
        if (userRatingRes.data.status === 'OK') {
            contestsCount = userRatingRes.data.result.length;
        }

        // 3. Upsert into CfStats
        const updateData = {
            solvedCount: solvedProblems.size,
            contestsCount: contestsCount,
            rating: userInfo.rating || 0,
            maxRating: userInfo.maxRating || 0,
            rank: userInfo.rank || '',
            maxRank: userInfo.maxRank || '',
            country: userInfo.country || '',
            city: userInfo.city || '',
            organization: userInfo.organization || '',
            friendOfCount: userInfo.friendOfCount || 0,
            contribution: userInfo.contribution || 0,
            lastSyncedAt: new Date()
        };

        const updatedStats = await CfStats.findOneAndUpdate(
            { handle: handle },
            updateData,
            { upsert: true, new: true }
        );

        return updatedStats;
    } catch (error) {
        console.error(`[CfSyncService] Failed to sync handle ${handle}:`, error.message);
        throw error; // Re-throw to be caught by syncQueue
    }
}

async function validateCodeforcesHandle(handle) {
    try {
        const userInfoParams = generateApiSig('user.info', { handles: handle });
        const userInfoRes = await axios.get('https://codeforces.com/api/user.info', { params: userInfoParams });
        if (userInfoRes.data.status === 'OK') {
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

module.exports = {
    syncHandle,
    validateCodeforcesHandle
};
