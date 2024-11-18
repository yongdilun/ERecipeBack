const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Comment = require('../models/Comment');
const Rate = require('../models/Rate');

// Changed from '/api/admin/user-overview' to just '/'
router.get('/user-overview', async (req, res) => {
    try {
        // Get total users count
        const totalUsers = await User.countDocuments();
        
        // Get new users (registered in last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const newUsers = await User.countDocuments({
            created_at: { $gte: thirtyDaysAgo }
        });

        // Get detailed user statistics
        const users = await User.find({}, '-password');
        
        // Get activity counts for each user
        const userStats = await Promise.all(users.map(async (user) => {
            const recipeCount = await Recipe.countDocuments({ user_id: user._id });
            const commentCount = await Comment.countDocuments({ user_id: user._id });
            const ratingCount = await Rate.countDocuments({ user_id: user._id });
            
            return {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                created_at: user.created_at,
                updated_at: user.updated_at,
                activity: {
                    recipes: recipeCount,
                    comments: commentCount,
                    ratings: ratingCount
                }
            };
        }));

        res.json({
            success: true,
            data: {
                totalUsers,
                newUsers,
                userStats
            }
        });
    } catch (error) {
        console.error('Error fetching user overview:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching user overview',
            error: error.message 
        });
    }
});

module.exports = router;
