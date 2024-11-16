const express = require('express');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs').promises;
const router = express.Router();

// Temporary storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to ensure directory exists
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Helper function to compress and save image
async function compressAndSaveImage(buffer, outputPath, width = 800) {
  await sharp(buffer)
    .resize(width, null, { // null maintains aspect ratio
      withoutEnlargement: true
    })
    .jpeg({ quality: 80 }) // compress to JPEG with 80% quality
    .toFile(outputPath);
}

router.post('/recipe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const outputDir = path.join(__dirname, '../public/images/recipe');
    await ensureDir(outputDir);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '.jpg';
    const outputPath = path.join(outputDir, filename);

    // Compress and save the image
    await compressAndSaveImage(req.file.buffer, outputPath, 1200); // larger size for main recipe images

    const imageUrl = `/images/recipe/${filename}`;
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ message: 'Error processing image' });
  }
});

router.post('/recipestep', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const outputDir = path.join(__dirname, '../public/images/recipestep');
    await ensureDir(outputDir);

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = uniqueSuffix + '.jpg';
    const outputPath = path.join(outputDir, filename);

    // Compress and save the image with smaller dimensions for step images
    await compressAndSaveImage(req.file.buffer, outputPath, 800);

    const imageUrl = `/images/recipestep/${filename}`;
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ message: 'Error processing image' });
  }
});

module.exports = router;
