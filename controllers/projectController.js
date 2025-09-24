// controllers/projectController.js
const pool = require("../config/db");

// Get all projects for current tenant
exports.getProjects = async (req, res) => {
  try {
    const { tenant_id } = req.user;
    const result = await pool.query(
      "SELECT * FROM projects WHERE tenant_id = $1 ORDER BY created_at DESC",
      [tenant_id]
    );
    res.json({ projects: result.rows });
  } catch (err) {
    console.error("❌ Fetch projects error:", err.message);
    res.status(500).json({ error: "Server error fetching projects" });
  }
};

// Create a new project
exports.createProject = async (req, res) => {
  try {
    const { name, status } = req.body;
    const { tenant_id } = req.user;

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    const result = await pool.query(
      "INSERT INTO projects (name, status, tenant_id) VALUES ($1, $2, $3) RETURNING *",
      [name, status || "pending", tenant_id]
    );

    res.status(201).json({ project: result.rows[0] });
  } catch (err) {
    console.error("❌ Project creation error:", err.message);
    res.status(500).json({ error: "Server error creating project" });
  }
};

// Update a project (name / status) — tenant enforced
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const { tenant_id } = req.user;

    if (!name && !status) {
      return res.status(400).json({ error: "Nothing to update" });
    }

    const result = await pool.query(
      `UPDATE projects
       SET name = COALESCE($1, name),
           status = COALESCE($2, status)
       WHERE id = $3 AND tenant_id = $4
       RETURNING *`,
      [name, status, id, tenant_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Project not found or access denied" });
    }

    res.json({ project: result.rows[0] });
  } catch (err) {
    console.error("❌ Project update error:", err.message);
    res.status(500).json({ error: "Server error updating project" });
  }
};

// Delete a project — tenant enforced
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenant_id } = req.user;

    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [id, tenant_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Project not found or access denied" });
    }

    res.json({ message: "Project deleted" });
  } catch (err) {
    console.error("❌ Project delete error:", err.message);
    res.status(500).json({ error: "Server error deleting project" });
  }
};
