const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const Rate = require('../models/Rate');

router.get('/', async (req, res) => {
    try {
        const latestRecipes = await Recipe.aggregate([
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
                $project: {
                    title: 1,
                    description: 1,
                    image_url: 1,
                    prep_time: 1,
                    cooking_time: 1,
                    servings: 1,
                    created_at: 1,
                    'author.username': 1
                }
            },
            { $sort: { created_at: -1 } },
            { $limit: 8 }
        ]);

        const topRatedRecipes = await Recipe.aggregate([
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
                    averageRating: 1,
                    'author.username': 1
                }
            },
            { $sort: { averageRating: -1 } },
            { $limit: 8 }
        ]);

        res.json({
            data: {
                latestRecipes,
                topRatedRecipes
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 