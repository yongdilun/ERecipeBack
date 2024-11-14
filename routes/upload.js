const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const recipeStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/images/recipe'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const stepStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/images/recipestep'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const uploadRecipe = multer({ storage: recipeStorage });
const uploadStep = multer({ storage: stepStorage });

router.post('/recipe', uploadRecipe.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const imageUrl = `/images/recipe/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

router.post('/recipestep', uploadStep.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  const imageUrl = `/images/recipestep/${req.file.filename}`;
  res.status(200).json({ imageUrl });
});

module.exports = router;
