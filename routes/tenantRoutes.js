// server/routes/tenantRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const { getTenantInfo } = require("../controllers/tenantController");

router.get("/", authMiddleware(), getTenantInfo);

module.exports = router;
