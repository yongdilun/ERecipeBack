const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const RecipeIngredient = require('../models/RecipeIngredient');
const RecipeStep = require('../models/RecipeStep');

// Add Recipe route with logic inside
router.post('/add', async (req, res) => {
  const { user_id, title, description, servings, cookingTime, prepTime, cuisine, image_url, ingredients, instructions } = req.body;

  try {
    const newRecipe = new Recipe({
      user_id,
      title,
      description,
      servings,
      cooking_time: cookingTime,
      prep_time: prepTime,
      cuisine,
      image_url,
    });
    await newRecipe.save();

    // Save Ingredients
    await Promise.all(
      ingredients.map((ingredient, index) =>
        RecipeIngredient.create({
          recipe_id: newRecipe._id,
          ingredient_number: index + 1,
          ingredient_name: ingredient.name,
          quantity: ingredient.quantity,
          image_url: ingredient.image_url,
        })
      )
    );

    // Save Instructions
    await Promise.all(
      instructions.map((instruction, index) =>
        RecipeStep.create({
          recipe_id: newRecipe._id,
          step_number: index + 1,
          description: instruction.step,
          image_url: instruction.image, // Save the image URL for each step
        })
      )
    );

    res.status(201).json({ message: 'Recipe created successfully', recipeId: newRecipe._id });
  } catch (error) {
    console.error('Error creating recipe:', error);
    res.status(500).json({ message: 'Error creating recipe' });
  }
});

module.exports = router;
