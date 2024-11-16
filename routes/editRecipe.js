const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const RecipeIngredient = require('../models/RecipeIngredient');
const RecipeStep = require('../models/RecipeStep');
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configure cloudinary if using cloud storage
if (process.env.STORAGE_TYPE === 'cloud') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Helper function to delete image based on storage type
async function deleteImage(imageUrl) {
  if (!imageUrl) return;

  if (process.env.STORAGE_TYPE === 'cloud') {
    try {
      // Extract public_id from Cloudinary URL including the folder
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
      // For local storage
      const imagePath = path.join(__dirname, '..', 'public', imageUrl);
      await fs.unlink(imagePath);
    } catch (err) {
      console.error('Error deleting local image:', err);
    }
  }
}

router.get('/:recipeId', async (req, res) => {
  try {
    const recipeId = new mongoose.Types.ObjectId(req.params.recipeId);

    const recipe = await Recipe.findById(recipeId)
      .populate('user_id', 'username');

    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const ingredients = await RecipeIngredient.find({ recipe_id: recipeId })
      .sort({ ingredient_number: 1 });

    const steps = await RecipeStep.find({ recipe_id: recipeId })
      .sort({ step_number: 1 });

    res.json({
      recipe,
      ingredients,
      steps
    });

  } catch (error) {
    console.error('Error fetching recipe details:', error);
    res.status(500).json({ 
      message: 'Error fetching recipe details',
      error: error.message 
    });
  }
});

router.put('/:recipeId', async (req, res) => {
  try {
    const recipeId = new mongoose.Types.ObjectId(req.params.recipeId);
    const { title, description, servings, cookingTime, prepTime, cuisine, image_url, ingredients, instructions } = req.body;

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipeId,
      {
        title,
        description,
        servings,
        cooking_time: cookingTime,
        prep_time: prepTime,
        cuisine,
        image_url,
      },
      { new: true }
    );

    if (!updatedRecipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    await RecipeIngredient.deleteMany({ recipe_id: recipeId });
    await RecipeStep.deleteMany({ recipe_id: recipeId });

    await Promise.all(
      ingredients.map((ingredient, index) =>
        RecipeIngredient.create({
          recipe_id: recipeId,
          ingredient_number: index + 1,
          ingredient_name: ingredient.name,
          quantity: ingredient.quantity,
        })
      )
    );

    await Promise.all(
      instructions.map((instruction, index) =>
        RecipeStep.create({
          recipe_id: recipeId,
          step_number: index + 1,
          description: instruction.step,
          image_url: instruction.image,
        })
      )
    );

    res.json({ 
      message: 'Recipe updated successfully',
      recipe: updatedRecipe
    });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ 
      message: 'Error updating recipe',
      error: error.message 
    });
  }
});

router.delete('/:recipeId', async (req, res) => {
  try {
    const recipeId = new mongoose.Types.ObjectId(req.params.recipeId);

    // First get the recipe to access image URLs
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
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

    // Delete the recipe and its related data
    await Promise.all([
      Recipe.findByIdAndDelete(recipeId),
      RecipeIngredient.deleteMany({ recipe_id: recipeId }),
      RecipeStep.deleteMany({ recipe_id: recipeId })
    ]);

    res.json({ 
      message: 'Recipe and all associated data deleted successfully',
      recipeId: recipeId
    });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ 
      message: 'Error deleting recipe',
      error: error.message 
    });
  }
});

// Add a new route to handle image updates
router.put('/:recipeId/update-image', async (req, res) => {
  try {
    const recipeId = new mongoose.Types.ObjectId(req.params.recipeId);
    const { oldImageUrl, newImageUrl } = req.body;

    if (oldImageUrl) {
      await deleteImage(oldImageUrl);
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      recipeId,
      { image_url: newImageUrl },
      { new: true }
    );

    res.json({ 
      message: 'Recipe image updated successfully',
      recipe: updatedRecipe
    });
  } catch (error) {
    console.error('Error updating recipe image:', error);
    res.status(500).json({ 
      message: 'Error updating recipe image',
      error: error.message 
    });
  }
});

module.exports = router; 