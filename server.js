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
const favoriteRecipesRouter = require('./routes/favoriteRecipes');
const adminDashboardRouter = require('./routes/adminDashboard');
const userOverviewRouter = require('./routes/userOverview');
const recipeOverviewRouter = require('./routes/recipeOverview');
const reportRouter = require('./routes/report');
const manageReportsRouter = require('./routes/manageReports');

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
app.use('/api/favorites', favoriteRecipesRouter);
app.use('/api/admin', adminDashboardRouter);
app.use('/api/admin', userOverviewRouter);
app.use('/api/admin', recipeOverviewRouter);
app.use('/api/reports', reportRouter);
app.use('/api/admin', manageReportsRouter);

// Add this test route after your other routes and before the 404 handlers
app.get('/api/test-db', async (req, res) => {
  try {
    // Test Collection
    const TestModel = mongoose.model('Test', new mongoose.Schema({
      name: String,
      date: { type: Date, default: Date.now }
    }));

    // Create
    const testDoc = await TestModel.create({ name: 'test document' });
    console.log('Created:', testDoc);

    // Read
    const readDoc = await TestModel.findById(testDoc._id);
    console.log('Read:', readDoc);

    // Update
    const updatedDoc = await TestModel.findByIdAndUpdate(
      testDoc._id,
      { name: 'updated test document' },
      { new: true }
    );
    console.log('Updated:', updatedDoc);

    // Delete
    const deletedDoc = await TestModel.findByIdAndDelete(testDoc._id);
    console.log('Deleted:', deletedDoc);

    res.json({
      success: true,
      message: 'All CRUD operations successful',
      dbState: mongoose.connection.readyState,
      collections: await mongoose.connection.db.listCollections().toArray()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      dbState: mongoose.connection.readyState
    });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting"
    };

    // Try to perform a simple database operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    res.json({
      status: 'ok',
      mode: process.env.NODE_ENV,
      mongodb: {
        state: dbStatus[dbState],
        collections: collections.map(c => c.name)
      },
      env: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        clientUrl: process.env.CLIENT_URL
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
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
    console.log('Attempting to connect to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//<credentials>@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority'
    });
    
    console.log("MongoDB connected successfully");
    
    // Test the connection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.error("Full error object:", JSON.stringify(err, null, 2));
    setTimeout(connectDB, 5000);
  }
};

// Enhanced error handlers
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
  console.error('Full error details:', JSON.stringify(err, null, 2));
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  console.log('Current connection state:', mongoose.connection.readyState);
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
  console.log('Current connection state:', mongoose.connection.readyState);
});

connectDB();

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`CORS enabled for: ${process.env.CLIENT_URL}`);
});
