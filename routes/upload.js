const express = require('express');
const multer = require('multer');
const path = require('path');
const Jimp = require('jimp');
const fs = require('fs').promises;
const cloudinary = require('cloudinary').v2;
const router = express.Router();

// Configure cloudinary
if (process.env.STORAGE_TYPE === 'cloud') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Temporary storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper function to ensure directory exists (for local storage)
async function ensureDir(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Helper function to compress image using Jimp
async function compressImage(buffer, width = 800) {
  const image = await Jimp.read(buffer);
  return image
    .scaleToFit(width, Jimp.AUTO)
    .quality(80)
    .getBufferAsync(Jimp.MIME_JPEG);
}

// Helper function to handle image storage
async function handleImageStorage(buffer, folder, width) {
  if (process.env.STORAGE_TYPE === 'cloud') {
    // Compress image before uploading to Cloudinary
    const compressedBuffer = await compressImage(buffer, width);
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: width, crop: 'scale' },
            { quality: 80 }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(compressedBuffer);
    });
    return result.secure_url;
  } else {
    // Local storage
    const outputDir = path.join(__dirname, `../public/images/${folder}`);
    await ensureDir(outputDir);
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const outputPath = path.join(outputDir, filename);
    
    // Compress and save image
    const compressedBuffer = await compressImage(buffer, width);
    await fs.writeFile(outputPath, compressedBuffer);
    
    return `/images/${folder}/${filename}`;
  }
}

router.post('/recipe', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imageUrl = await handleImageStorage(req.file.buffer, 'recipe', 1200);
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

    const imageUrl = await handleImageStorage(req.file.buffer, 'recipestep', 800);
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ message: 'Error processing image' });
  }
});

module.exports = router;
