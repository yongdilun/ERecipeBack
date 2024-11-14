const express = require('express');
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const RecipeStep = require('../models/RecipeStep');
const RecipeIngredient = require('../models/RecipeIngredient');
const Rate = require('../models/Rate'); // Import the Rate model
const Comment = require('../models/Comment'); // Import the Comment model
const User = require('../models/User'); // Import the User model
const router = express.Router();

// GET /api/recipes - Fetch all recipes with sorting, searching, and filtering
router.get('/', async (req, res) => {
  try {
    const { search, sortBy, cuisine } = req.query;
    let query = Recipe.find();

    // Apply search if provided
    if (search) {
      query = query.or([
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } }
      ]);
    }

    // Apply cuisine filter if provided
    if (cuisine && cuisine !== 'All') {
      query = query.where('cuisine').equals(cuisine);
    }

    // Fetch recipes first
    const recipes = await query.exec();

    // Calculate average ratings for all recipes
    const recipesWithRatings = await Promise.all(recipes.map(async (recipe) => {
      const ratings = await Rate.find({ recipe_id: recipe._id });
      const averageRating = ratings.length
        ? (ratings.reduce((sum, rate) => sum + rate.rating, 0) / ratings.length)
        : 0;
      
      return {
        ...recipe._doc,
        averageRating,
      };
    }));

    // Apply sorting
    let sortedRecipes = [...recipesWithRatings];
    if (sortBy) {
      switch (sortBy) {
        case 'latest':
          sortedRecipes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          break;
        case 'oldest':
          sortedRecipes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          break;
        case 'rating':
          sortedRecipes.sort((a, b) => b.averageRating - a.averageRating);
          break;
        default:
          sortedRecipes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    }

    res.json(sortedRecipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /api/recipes/:id - Fetch a single recipe by ID along with user's rating if it exists
router.get('/:id', async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.query.user_id; // Accept user_id as a query parameter

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    // Fetch all ratings to calculate the average
    const ratings = await Rate.find({ recipe_id: recipeId });
    const averageRating = ratings.reduce((sum, rate) => sum + rate.rating, 0) / ratings.length || 0;

    // Find user's rating if it exists
    let userRating = null;
    if (userId) {
      const userRate = await Rate.findOne({ recipe_id: recipeId, user_id: userId });
      userRating = userRate ? userRate.rating : null;
    }

    res.json({
      recipe,
      averageRating,
      userRating,
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recipes/:id/steps - Fetch steps for a specific recipe
router.get('/:id/steps', async (req, res) => {
  try {
    const recipeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }

    const steps = await RecipeStep.find({ recipe_id: recipeId }).sort('step_number');
    res.json(steps);
  } catch (error) {
    console.error('Error fetching recipe steps:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recipes/:id/ingredients - Fetch ingredients for a specific recipe
router.get('/:id/ingredients', async (req, res) => {
  try {
    const recipeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }

    const ingredients = await RecipeIngredient.find({ recipe_id: recipeId }).sort('ingredient_number');
    res.json(ingredients);
  } catch (error) {
    console.error('Error fetching recipe ingredients:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/recipes/:id/rate - Rate a specific recipe
router.post('/:id/rate', async (req, res) => {
  try {
    const { user_id, rating } = req.body;
    const recipeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }

    if (!user_id || typeof rating !== 'number') {
      return res.status(400).json({ message: 'User ID and rating are required' });
    }

    // Check if user has already rated this recipe
    const existingRate = await Rate.findOne({ recipe_id: recipeId, user_id });
    if (existingRate) {
      existingRate.rating = rating;
      await existingRate.save();
    } else {
      const newRate = new Rate({
        user_id,
        recipe_id: recipeId,
        rating,
      });
      await newRate.save();
    }

    res.status(201).json({ message: 'Rating added/updated successfully' });
  } catch (error) {
    console.error('Error adding/updating rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recipes/:id/rate - Get average rating of a recipe
router.get('/:id/rate', async (req, res) => {
  try {
      const recipeId = req.params.id; // Fixed param to req.params.id instead of req.params.recipeId

      // Fetch the average rating and the count of ratings
      const ratings = await Rate.find({ recipe_id: recipeId }); // Changed Rating to Rate

      const totalRatings = ratings.length;
      const averageRating = ratings.reduce((acc, rate) => acc + rate.rating, 0) / totalRatings || 0;

      res.json({
          averageRating: averageRating.toFixed(1),
          totalRatings: totalRatings
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
});


// POST /api/recipes/:id/comment - Add a comment to a recipe
router.post('/:id/comment', async (req, res) => {
  try {
    const { user_id, content } = req.body;
    const recipeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }

    if (!user_id || !content) {
      return res.status(400).json({ message: 'User ID and content are required' });
    }

    const newComment = new Comment({
      user_id,
      recipe_id: recipeId,
      content,
    });

    await newComment.save();
    res.status(201).json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recipes/:id/comments - Get comments of a recipe with populated usernames and total comment count
router.get('/:id/comments', async (req, res) => {
  try {
    const recipeId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipe ID format' });
    }

    // Fetch comments and total count separately
    const comments = await Comment.find({ recipe_id: recipeId })
      .sort({ created_at: -1 })
      .populate('user_id', 'username'); // Correctly populate `username` field from `User`

    const totalComments = await Comment.countDocuments({ recipe_id: recipeId });

    res.json({ comments, totalComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
