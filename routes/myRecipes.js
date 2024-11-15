const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
    try {
        const { userId, search, sortBy, cuisine } = req.query;

        // Convert userId string to ObjectId
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Build query
        let query = { user_id: userObjectId };
        
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (cuisine && cuisine !== 'All') {
            query.cuisine = cuisine;
        }

        // Build sort
        let sort = {};
        switch (sortBy) {
            case 'oldest':
                sort = { created_at: 1 };
                break;
            case 'rating':
                sort = { averageRating: -1 };
                break;
            default: // 'latest'
                sort = { created_at: -1 };
        }

        const recipes = await Recipe.aggregate([
            { $match: query },
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
                    as: 'author'
                }
            },
            { $unwind: '$author' },
            {
                $addFields: {
                    averageRating: {
                        $cond: {
                            if: { $eq: [{ $size: "$ratings" }, 0] },
                            then: 0,
                            else: { $avg: "$ratings.rating" }
                        }
                    }
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    image_url: 1,
                    prep_time: 1,
                    cooking_time: 1,
                    servings: 1,
                    cuisine: 1,
                    created_at: 1,
                    averageRating: 1,
                    'author.username': 1
                }
            },
            { $sort: sort }
        ]);

        res.json(recipes);

    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching recipes',
            error: error.message 
        });
    }
});

module.exports = router; 