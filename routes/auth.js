const bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const zxcvbn = require("zxcvbn"); // Import zxcvbn for password strength checking

const JWT_SECRET = process.env.JWT_SECRET || "yourSecretKey";
const SALT_ROUNDS = 10;

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }

    // Check if the username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "This username is already taken. Please choose another one." });
    }

    // Simple password strength check
    const passwordStrength = zxcvbn(password);
    if (passwordStrength.score < 2) {
      return res.status(400).json({
        message: "Password is too weak.",
        reasons: [
          "Use at least 8 characters",
          "Include at least one uppercase letter",
          "Include at least one number",
          "Avoid common words or sequences",
        ],
      });
    }

    // Hash the password and save user
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      message: "User registered successfully!",
      token,
      user: { id: newUser._id, username: newUser.username, email: newUser.email },
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "An error occurred while creating your account. Please try again later." });
  }
});



// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "No account found with this email address." });

    // Compare the hashed password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "The password you entered is incorrect. Please try again." });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

    res.json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ message: "An error occurred while logging in. Please try again later." });
  }
});

// Change password route
router.post("/change-password", async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  try {
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Check new password strength
    const passwordStrength = zxcvbn(newPassword);
    if (passwordStrength.score < 2) {
      return res.status(400).json({
        message: "New password is too weak",
        reasons: [
          "Use at least 8 characters",
          "Include at least one uppercase letter",
          "Include at least one number",
          "Avoid common words or sequences",
        ],
      });
    }

    // Hash new password and update
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "An error occurred while changing password" });
  }
});

module.exports = router;
