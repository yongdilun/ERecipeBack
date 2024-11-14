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

// Updated CORS configuration for both development and production
app.use(cors({
  origin: [
    'http://localhost:3000',           // Development frontend
    'https://erecipehub.netlify.app', // Production frontend
    process.env.CLIENT_URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Connect to MongoDB with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// API health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    mode: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Basic API route
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Handle all other routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Not found' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`CORS enabled for: ${process.env.CLIENT_URL}`);
});
