const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const Rate = require('../models/Rate');
const Comment = require('../models/Comment');

router.get('/recipe-overview', async (req, res) => {
    try {
        const { search, sortBy, cuisine } = req.query;
        
        // Build the match query
        let matchQuery = {};
        
        if (search) {
            matchQuery.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { cuisine: { $regex: search, $options: 'i' } }
            ];
        }

        if (cuisine && cuisine !== 'All') {
            matchQuery.cuisine = cuisine;
        }

        // Build sort object
        let sortStage = { created_at: -1 }; // default sort
        if (sortBy) {
            switch (sortBy) {
                case 'latest':
                    sortStage = { created_at: -1 };
                    break;
                case 'oldest':
                    sortStage = { created_at: 1 };
                    break;
                case 'rating':
                    sortStage = { averageRating: -1 };
                    break;
            }
        }

        const recipes = await Recipe.aggregate([
            { $match: matchQuery },
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
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'recipe_id',
                    as: 'comments'
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
                    },
                    totalComments: { $size: "$comments" },
                    totalRatings: { $size: "$ratings" }
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
                    totalComments: 1,
                    totalRatings: 1,
                    'author.username': 1
                }
            },
            { $sort: sortStage }
        ]);

        res.json({
            success: true,
            data: recipes
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching recipes',
            error: error.message 
        });
    }
});

// Delete a comment
router.delete('/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        await Comment.findByIdAndDelete(commentId);
        res.json({ success: true, message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting comment',
            error: error.message 
        });
    }
});

// Delete a recipe
router.delete('/recipes/:recipeId', async (req, res) => {
    try {
        const { recipeId } = req.params;
        // Delete the recipe and all associated data
        await Promise.all([
            Recipe.findByIdAndDelete(recipeId),
            Comment.deleteMany({ recipe_id: recipeId }),
            Rate.deleteMany({ recipe_id: recipeId })
        ]);
        res.json({ success: true, message: 'Recipe and associated data deleted successfully' });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting recipe',
            error: error.message 
        });
    }
});

module.exports = router;
