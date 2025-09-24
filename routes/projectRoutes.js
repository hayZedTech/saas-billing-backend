// routes/projectRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

// GET all projects for tenant
router.get("/", authMiddleware(), getProjects);

// POST new project
router.post("/", authMiddleware(), createProject);

// PUT update project by id
router.put("/:id", authMiddleware(), updateProject);

// DELETE project by id
router.delete("/:id", authMiddleware(), deleteProject);

module.exports = router;
