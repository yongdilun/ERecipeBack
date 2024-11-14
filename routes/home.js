const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const Rate = require('../models/Rate');

router.get('/', async (req, res) => {
    try {
        // Get all recipes sorted by date
        const allLatestRecipes = await Recipe.find()
            .sort({ created_at: -1 })
            .populate('user_id', 'username');

        // Get all recipes with ratings
        const allTopRatedRecipes = await Recipe.aggregate([
            {
                $lookup: {
                    from: 'rates',
                    localField: '_id',
                    foreignField: 'recipe_id',
                    as: 'ratings'
                }
            },
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
                $sort: { averageRating: -1 }
            }
        ]);

        // Populate user information for top rated recipes
        await Recipe.populate(allTopRatedRecipes, {
            path: 'user_id',
            select: 'username'
        });

        // Format the response data
        const formattedLatestRecipes = allLatestRecipes.map(recipe => ({
            _id: recipe._id,
            title: recipe.title,
            description: recipe.description,
            imageUrl: recipe.image_url,
            createdAt: recipe.created_at,
            prep_time: recipe.prep_time,
            cooking_time: recipe.cooking_time,
            servings: recipe.servings,
            cuisine: recipe.cuisine,
            author: {
                username: recipe.user_id?.username
            }
        }));

        const formattedTopRatedRecipes = allTopRatedRecipes.map(recipe => ({
            _id: recipe._id,
            title: recipe.title,
            description: recipe.description,
            imageUrl: recipe.image_url,
            prep_time: recipe.prep_time,
            cooking_time: recipe.cooking_time,
            servings: recipe.servings,
            cuisine: recipe.cuisine,
            averageRating: recipe.averageRating,
            author: {
                username: recipe.user_id?.username
            }
        }));

        res.json({
            success: true,
            data: {
                latestRecipes: formattedLatestRecipes,
                topRatedRecipes: formattedTopRatedRecipes
            }
        });

    } catch (error) {
        console.error('Error fetching home page recipes:', error);
        res.status(500).json({
            success: false,
            error: 'Server error while fetching recipes'
        });
    }
});

module.exports = router; 