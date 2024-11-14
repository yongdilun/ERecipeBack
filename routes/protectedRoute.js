// routes/protectedRoute.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

router.get("/dashboard", auth, (req, res) => {
  res.send("Welcome to the protected route!");
});

module.exports = router;
