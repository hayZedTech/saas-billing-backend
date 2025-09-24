// server/controllers/userController.js
const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.createUserForTenant = async (req, res) => {
  const { name, email, role } = req.body;
  const createdBy = req.user; // admin
  const tenantId = createdBy.tenant_id;

  if (!name || !email) return res.status(400).json({ error: "name and email required" });

  try {
    // check existing
    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length) return res.status(400).json({ error: "Email already registered" });

    const tempPassword = Math.random().toString(36).slice(2, 10);
    const hashed = await bcrypt.hash(tempPassword, 10);

    const r = await pool.query(
      "INSERT INTO users (name, email, password, role, tenant_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role",
      [name, email, hashed, role || "user", tenantId]
    );

    // For demo: return temp password (production: send invite email instead)
    res.status(201).json({ user: r.rows[0], tempPassword });
  } catch (err) {
    console.error("❌ create user for tenant error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
