const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Simple health check
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "ok",
      dbTime: result.rows[0].now,
    });
  } catch (err) {
    console.error("❌ Health check DB error:", err.message);
    res.status(500).json({
      status: "error",
      message: "Database unavailable",
    });
  }
});

module.exports = router;
