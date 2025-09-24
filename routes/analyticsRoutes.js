// routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getAnalytics } = require("../controllers/analyticsController");

// GET analytics (projects count, active users, subscription status)
router.get("/", authMiddleware(), getAnalytics);

module.exports = router;
