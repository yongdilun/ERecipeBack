const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const Comment = require('../models/Comment');

// Get dashboard overview data
router.get('/overview', async (req, res) => {
    try {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

        // User statistics
        const totalUsers = await User.countDocuments();
        const recentUsers = await User.countDocuments({
            created_at: { $gte: oneHourAgo }
        });

        // Recipe statistics
        const totalRecipes = await Recipe.countDocuments();
        const recentRecipes = await Recipe.find({
            created_at: { $gte: oneHourAgo }
        }).countDocuments();

        // Get recent recipes with user info
        const latestRecipes = await Recipe.find()
            .sort({ created_at: -1 })
            .limit(5)
            .populate({
                path: 'user_id',
                select: 'username'
            });

        // Get most popular recipes with rating count and weighted score
        const popularRecipes = await Recipe.aggregate([
            {
                $lookup: {
                    from: 'rates',
                    localField: '_id',
                    foreignField: 'recipe_id',
                    as: 'ratings'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'creator'
                }
            },
            { $unwind: '$creator' },
            {
                $addFields: {
                    ratingCount: { $size: '$ratings' },
                    averageRating: {
                        $cond: {
                            if: { $eq: [{ $size: '$ratings' }, 0] },
                            then: 0,
                            else: { $avg: '$ratings.rating' }
                        }
                    },
                    // Calculate weighted score based on both rating and number of ratings
                    weightedScore: {
                        $cond: {
                            if: { $eq: [{ $size: '$ratings' }, 0] },
                            then: 0,
                            else: {
                                $multiply: [
                                    { $avg: '$ratings.rating' },
                                    { 
                                        $add: [
                                            1,
                                            { 
                                                $multiply: [
                                                    0.1, 
                                                    { $size: '$ratings' }
                                                ] 
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    creatorName: '$creator.username'
                }
            },
            {
                $match: {
                    ratingCount: { $gt: 0 } // Only include recipes with ratings
                }
            },
            {
                $sort: { 
                    weightedScore: -1,
                    ratingCount: -1,
                    averageRating: -1
                }
            },
            {
                $limit: 5
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    averageRating: 1,
                    ratingCount: 1,
                    creatorName: 1,
                    weightedScore: 1
                }
            }
        ]);

        // Comment statistics
        const totalComments = await Comment.countDocuments();
        const recentComments = await Comment.countDocuments({
            created_at: { $gte: oneHourAgo }
        });

        // Get recent comments with user and recipe info
        const latestComments = await Comment.find()
            .sort({ created_at: -1 })
            .limit(5)
            .populate('user_id', 'username')
            .populate('recipe_id', 'title');

        res.json({
            users: {
                total: totalUsers,
                recent: recentUsers
            },
            recipes: {
                total: totalRecipes,
                recent: recentRecipes,
                latest: latestRecipes,
                popular: popularRecipes.map(recipe => ({
                    ...recipe,
                    weightedScore: recipe.weightedScore.toFixed(2)
                }))
            },
            comments: {
                total: totalComments,
                recent: recentComments,
                latest: latestComments
            }
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'Error fetching dashboard data' });
    }
});

module.exports = router;
