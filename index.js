// index.js (fixed ordering)
require("dotenv").config(); // load env first

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const { handleStripeWebhook } = require("./controllers/webhookController");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const billingRoutes = require("./routes/billingRoutes");
const projectRoutes = require("./routes/projectRoutes");
const tenantRoutes = require("./routes/tenantRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

console.log("STRIPE_SECRET_KEY loaded:", !!process.env.STRIPE_SECRET_KEY);
console.log("STRIPE_WEBHOOK_SECRET loaded:", !!process.env.STRIPE_WEBHOOK_SECRET);

// Allow CORS early
app.use(cors());

// IMPORTANT: register the webhook route with express.raw BEFORE express.json()
// This ensures Stripe events come through as raw bytes for signature verification.
app.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// Now register JSON body parser for all other routes
app.use(express.json());

// DB test (optional)
pool.query("SELECT NOW()", (err, res) => {
  if (err) console.error("❌ DB Connection Error:", err.message);
  else console.log("✅ DB Connected at:", res.rows[0].now);
});

// App routes (normal routes which want parsed JSON)
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/analytics", analyticsRoutes);

app.get("/", (req, res) => res.send("🚀 SaaS Backend is running..."));

app.listen(PORT, () => console.log(`⚡ Server running on http://localhost:${PORT}`));
