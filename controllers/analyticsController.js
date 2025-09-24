// controllers/analyticsController.js
const pool = require("../config/db");

exports.getAnalytics = async (req, res) => {
  try {
    const { tenant_id } = req.user;

    // 1. Count projects by status
    const projectStats = await pool.query(
      "SELECT status, COUNT(*) FROM projects WHERE tenant_id = $1 GROUP BY status",
      [tenant_id]
    );

    // 2. Count active users in tenant
    const activeUsers = await pool.query(
      "SELECT COUNT(*) FROM users WHERE tenant_id = $1",
      [tenant_id]
    );

    // 3. Subscription status (from tenants table)
    const subscription = await pool.query(
      "SELECT subscription_id, plan, status FROM tenants WHERE id = $1",
      [tenant_id]
    );

    res.json({
      projects: projectStats.rows,
      activeUsers: parseInt(activeUsers.rows[0].count, 10),
      subscription: subscription.rows[0] || {},
    });
  } catch (err) {
    console.error("❌ Analytics error:", err.message);
    res.status(500).json({ error: "Server error fetching analytics" });
  }
};
