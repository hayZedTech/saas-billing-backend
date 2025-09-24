const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const { createUserForTenant } = require("../controllers/userController");




router.get("/admin-only", authMiddleware(["admin"]), (req, res) => {
  res.json({ message: `Hello Admin ${req.user.name}` });
});

// add create user route (admin only)
router.post("/", authMiddleware(["admin"]), createUserForTenant);

router.get("/manager-or-admin", authMiddleware(["admin", "manager"]), (req, res) => {
  res.json({ message: `Hello ${req.user.role}` });
});

router.get("/everyone", authMiddleware(), (req, res) => {
  res.json({ message: `Hello ${req.user.name}` });
});

module.exports = router;
