const express = require("express");
const router = express.Router();
const { handleStripeWebhook } = require("../controllers/webhookController");

// Stripe webhooks require raw body (handled in index.js)
router.post("/stripe", handleStripeWebhook);

module.exports = router;
