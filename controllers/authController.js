// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("../config/db"); // 👈 use wrapper
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Helper: Generate JWT
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// REGISTER USER + TENANT
const registerUser = async (req, res) => {
  const { name, email, password, tenantName } = req.body;

  if (!name || !email || !password || !tenantName) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Check if email already exists
    const existingUser = await query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Stripe customer for tenant
    const stripeCustomer = await stripe.customers.create({
      name: tenantName,
      email,
      description: `Tenant account for ${tenantName}`,
    });

    // 2. Create tenant in DB
    const tenantResult = await query(
      "INSERT INTO tenants (name, stripe_customer_id) VALUES ($1, $2) RETURNING id",
      [tenantName, stripeCustomer.id]
    );
    const tenantId = tenantResult.rows[0].id;

    // 3. Create user (first user = admin)
    const userResult = await query(
      "INSERT INTO users (name, email, password, role, tenant_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, email, hashedPassword, "admin", tenantId]
    );
    const user = userResult.rows[0];

    // 4. Issue JWT
    const token = generateToken(user);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    });
  } catch (error) {
    console.error("❌ Register error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // 1. Find user
    const result = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 3. Create JWT
    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { registerUser, loginUser };
