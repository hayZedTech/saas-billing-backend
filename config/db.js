const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Catch global errors (like idle termination)
pool.on("error", (err) => {
  console.error("❌ Unexpected DB error:", err.message);
});

// Query wrapper with 1 retry
async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.warn("⚠️ Query failed, retrying once...", err.message);
    try {
      return await pool.query(text, params);
    } catch (retryErr) {
      console.error("❌ Query retry also failed:", retryErr.message);
      throw retryErr;
    }
  }
}

module.exports = { pool, query };
