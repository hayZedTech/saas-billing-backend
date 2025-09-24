// controllers/webhookController.js
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const pool = require("../config/db");

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // req.body here MUST be the raw Buffer (provided by express.raw)
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log("✅ Webhook verified:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // handle event...
  try {
    // your switch(event.type) logic
    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handling error:", err);
    res.status(500).send();
  }
};

module.exports = { handleStripeWebhook };
