// server/routes/billingRoutes.js
const express = require("express");
const router = express.Router();
const billingController = require("../controllers/billingController");
const authMiddleware = require("../middlewares/authMiddleware");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Protected endpoints
router.post(
  "/create-checkout-session",
  authMiddleware(),
  billingController.createCheckoutSession
);

router.get(
  "/subscriptions",
  authMiddleware(),
  billingController.getUserSubscriptions
);

router.get(
  "/prices",
  authMiddleware(),
  billingController.listPrices
);

// ✅ Admin-only: Create product + price in Stripe
router.post(
  "/create-product",
  authMiddleware(["admin"]), // only allow admins
  async (req, res) => {
    try {
      const { name, amount, interval } = req.body;

      if (!name || !amount || !interval) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create product
      const product = await stripe.products.create({ name });

      // Create recurring price for that product
      const price = await stripe.prices.create({
        unit_amount: Math.round(amount * 100), // convert dollars to cents
        currency: "usd",
        recurring: { interval }, // "month" or "year"
        product: product.id,
      });

      res.json({ product, price });
    } catch (err) {
      console.error("Stripe create product error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
