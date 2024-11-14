const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

const authRoute = require('./routes/auth'); 
const addRecipesRouter = require('./routes/addRecipes');
const uploadRouter = require('./routes/upload'); 
const recipesRouter = require('./routes/recipes'); 
const homeRoutes = require('./routes/home');
const myRecipesRouter = require('./routes/myRecipes');
const editRecipeRouter = require('./routes/editRecipe');

dotenv.config();

const app = express();

// Updated CORS configuration for production
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Serve static files
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// API Routes
app.use('/api/home', homeRoutes);
app.use('/api/auth', authRoute);
app.use('/api/addrecipes', addRecipesRouter);
app.use('/api/uploads', uploadRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/myrecipes', myRecipesRouter);
app.use('/api/edit-recipe', editRecipeRouter);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("MongoDB connection error:", err));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React build directory
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
} else {
  // Development route
  app.get('/', (req, res) => {
    res.send('Hello, MERN!');
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
