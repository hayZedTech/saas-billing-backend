// server/controllers/billingController.js
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const pool = require("../config/db");

/**
 * Create a Checkout Session for a tenant (subscription mode).
 * Expects { priceId, plan } in body.
 */
const createCheckoutSession = async (req, res) => {
  try {
    const { priceId, plan } = req.body;
    const tenantId = req.user.tenant_id;
    if (!priceId) return res.status(400).json({ error: "priceId is required" });

    // Validate tenant exists
    const tRes = await pool.query("SELECT * FROM tenants WHERE id = $1", [tenantId]);
    if (!tRes.rows.length) return res.status(404).json({ error: "Tenant not found" });
    const tenant = tRes.rows[0];

    let customerId = tenant.stripe_customer_id;

    // Create a Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        metadata: { tenant_id: tenantId.toString() },
      });
      customerId = customer.id;
      await pool.query("UPDATE tenants SET stripe_customer_id = $1 WHERE id = $2", [
        customerId,
        tenantId,
      ]);
    }

    // ✅ Validate that priceId is a recurring price
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    if (!price.recurring) {
      return res.status(400).json({
        error: `Price ${priceId} is not a recurring subscription price. Please create one in Stripe.`,
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { tenant_id: tenantId.toString(), plan: plan || priceId },
      },
      metadata: { tenant_id: tenantId.toString(), plan: plan || priceId },
      success_url:
        process.env.CHECKOUT_SUCCESS_URL || "http://localhost:5173/success",
      cancel_url:
        process.env.CHECKOUT_CANCEL_URL || "http://localhost:5173/cancel",
    });

    return res.json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("❌ Checkout error:", err);
    const message =
      err?.raw?.message || err.message || "Server error creating checkout session";
    return res.status(500).json({ error: message });
  }
};

/**
 * Return tenant subscription info (from DB + Stripe if possible)
 */
const getUserSubscriptions = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const tRes = await pool.query(
      "SELECT stripe_customer_id, subscription_id, plan, subscription_status FROM tenants WHERE id = $1",
      [tenantId]
    );
    if (!tRes.rows.length)
      return res.status(404).json({ error: "Tenant not found" });

    const tenant = tRes.rows[0];
    let subscription = null;

    if (tenant.subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(tenant.subscription_id);
        subscription = {
          id: sub.id,
          status: sub.status,
          current_period_end: sub.current_period_end,
          items: sub.items,
        };
      } catch (e) {
        console.warn("⚠️ Could not retrieve subscription from Stripe:", e.message);
      }
    }

    return res.json({
      subscription: {
        plan: tenant.plan,
        subscription_status: tenant.subscription_status,
        subscription_id: tenant.subscription_id,
        stripe_customer_id: tenant.stripe_customer_id,
        stripe_subscription: subscription,
      },
    });
  } catch (err) {
    console.error("❌ getUserSubscriptions error:", err);
    return res.status(500).json({ error: "Server error fetching subscriptions" });
  }
};

/**
 * List active Stripe Prices so frontend can fetch price IDs dynamically.
 */
const listPrices = async (req, res) => {
  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 50,
      expand: ["data.product"],
    });

    const out = prices.data.map((p) => ({
      id: p.id,
      unit_amount: p.unit_amount,
      currency: p.currency,
      recurring: p.recurring || null,
      nickname: p.nickname || (p.product && p.product.name) || "Price",
      product: p.product ? { id: p.product.id, name: p.product.name } : null,
    }));

    return res.json({ prices: out });
  } catch (err) {
    console.error("❌ listPrices error:", err);
    return res.status(500).json({ error: "Server error listing prices" });
  }
};

module.exports = { createCheckoutSession, getUserSubscriptions, listPrices };
