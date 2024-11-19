const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const Rate = require('../models/Rate');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const RecipeStep = require('../models/RecipeStep');
const RecipeIngredient = require('../models/RecipeIngredient');
const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;

if (process.env.STORAGE_TYPE === 'cloud') {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}

async function deleteImage(imageUrl) {
    if (!imageUrl) return;

    if (process.env.STORAGE_TYPE === 'cloud') {
        try {
            const matches = imageUrl.match(/upload\/(?:v\d+\/)?(.+)\./);
            if (matches && matches[1]) {
                const publicId = matches[1];
                console.log('Deleting Cloudinary image with public_id:', publicId);
                await cloudinary.uploader.destroy(publicId);
            } else {
                console.error('Could not extract public_id from URL:', imageUrl);
            }
        } catch (err) {
            console.error('Error deleting image from Cloudinary:', err);
        }
    } else {
        try {
            const imagePath = path.join(__dirname, '..', 'public', imageUrl);
            await fs.unlink(imagePath);
        } catch (err) {
            console.error('Error deleting local image:', err);
        }
    }
}

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
        const { source } = req.query;

        // First get the recipe to access image URLs
        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recipe not found' 
            });
        }

        // Get all recipe steps to access their image URLs
        const steps = await RecipeStep.find({ recipe_id: recipeId });

        // Delete main recipe image if it exists
        if (recipe.image_url) {
            await deleteImage(recipe.image_url);
        }

        // Delete all step images
        for (const step of steps) {
            if (step.image_url) {
                await deleteImage(step.image_url);
            }
        }

        // Delete the recipe and all associated data including reports
        await Promise.all([
            Recipe.findByIdAndDelete(recipeId),
            RecipeIngredient.deleteMany({ recipe_id: recipeId }),
            RecipeStep.deleteMany({ recipe_id: recipeId }),
            Comment.deleteMany({ recipe_id: recipeId }),
            Rate.deleteMany({ recipe_id: recipeId }),
            Report.deleteMany({ 
                reportedContentId: recipeId,
                reportedContentType: 'recipe'
            }),
            Report.deleteMany({
                reportedContentType: 'comment',
                recipeId: recipeId
            })
        ]);

        res.json({ 
            success: true,
            message: 'Recipe, associated data, and reports deleted successfully',
            recipeId: recipeId,
            source: source
        });
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
