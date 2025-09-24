// server/controllers/tenantController.js
const pool = require("../config/db");

exports.getTenantInfo = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const q = await pool.query("SELECT id, name, stripe_customer_id, plan, subscription_status FROM tenants WHERE id = $1", [tenantId]);
    if (!q.rows.length) return res.status(404).json({ error: "Tenant not found" });
    res.json({ tenant: q.rows[0] });
  } catch (err) {
    console.error("❌ Tenant info error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
};
