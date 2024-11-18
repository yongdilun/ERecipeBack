const express = require('express');
const mongoose = require('mongoose');
const FavoriteRecipe = require('../models/FavoriteRecipe');
const router = express.Router();

// Add a recipe to favorites
router.post('/add', async (req, res) => {
  try {
    const { user_id, recipe_id } = req.body;

    // Check if already favorited
    const existingFavorite = await FavoriteRecipe.findOne({ user_id, recipe_id });
    if (existingFavorite) {
      return res.status(400).json({ message: 'Recipe already in favorites' });
    }

    const favorite = new FavoriteRecipe({
      user_id,
      recipe_id
    });

    await favorite.save();
    res.status(201).json({ message: 'Recipe added to favorites', favorite });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to favorites', error: error.message });
  }
});

// Remove a recipe from favorites
router.delete('/remove', async (req, res) => {
  try {
    const { user_id, recipe_id } = req.body;
    await FavoriteRecipe.findOneAndDelete({ user_id, recipe_id });
    res.json({ message: 'Recipe removed from favorites' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing from favorites', error: error.message });
  }
});

// Check if a recipe is favorited by user
router.get('/check/:recipeId', async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { userId } = req.query;
    
    const favorite = await FavoriteRecipe.findOne({
      user_id: userId,
      recipe_id: recipeId
    });

    res.json({ isFavorited: !!favorite });
  } catch (error) {
    res.status(500).json({ message: 'Error checking favorite status', error: error.message });
  }
});

// Get all favorite recipes for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const favorites = await FavoriteRecipe.find({ user_id: userId })
      .populate('recipe_id')
      .sort({ saved_at: -1 });

    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching favorites', error: error.message });
  }
});

module.exports = router;
