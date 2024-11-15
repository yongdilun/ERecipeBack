const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

// Load environment variables based on the environment
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

const authRoute = require('./routes/auth');
const addRecipesRouter = require('./routes/addRecipes');
const uploadRouter = require('./routes/upload');
const recipesRouter = require('./routes/recipes');
const homeRoutes = require('./routes/home');
const myRecipesRouter = require('./routes/myRecipes');
const editRecipeRouter = require('./routes/editRecipe');

const app = express();

app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Handle API 404s
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Handle all other routes for client-side routing
app.get('*', (req, res) => {
  // For API requests, return 404
  if (req.url.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // For all other requests, redirect to the frontend
  res.redirect(process.env.CLIENT_URL);
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority'
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    setTimeout(connectDB, 5000);
  }
};
connectDB();

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`CORS enabled for: ${process.env.CLIENT_URL}`);
});
