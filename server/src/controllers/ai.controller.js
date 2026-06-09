/**
 * ai.controller.js
 * ────────────────
 * Fetches both profiles, generates AI insights, caches them in the matches table.
 *
 * POST /api/ai/insights
 * Body: { customer_id, match_customer_id }
 */

const { query, pool } = require('../config/db');
const { AppError }    = require('../middleware/errorHandler');
const { generateInsights } = require('../services/aiInsights');

async function getInsights(req, res, next) {
  try {
    const { customer_id, match_customer_id } = req.body;

    if (!customer_id || !match_customer_id) {
      return next(new AppError('customer_id and match_customer_id are required.', 400));
    }

    // order doesn't cause a redundant OpenAI call. Match insights are symmetric.
    const cached = await query(
      `SELECT ai_insights FROM matches
       WHERE ai_insights IS NOT NULL
         AND (
           (customer_a_id = $1 AND customer_b_id = $2) OR
           (customer_a_id = $2 AND customer_b_id = $1)
         )
       LIMIT 1`,
      [customer_id, match_customer_id]
    );

    if (cached.length > 0) {
      return res.json({
        success: true,
        data: JSON.parse(cached[0].ai_insights),
        cached: true, // frontend can show a "Cached" badge
      });
    }

    const customers = await query(
      'SELECT * FROM customers WHERE id = ANY($1) AND is_active = TRUE',
      [[customer_id, match_customer_id]]
    );

    if (customers.length < 2) {
      return next(new AppError('One or both customers not found.', 404));
    }

    const customerA = customers.find(c => c.id === customer_id);
    const customerB = customers.find(c => c.id === match_customer_id);

    // Calls OpenAI (or mock fallback) — never throws, always returns a valid object
    const insights = await generateInsights(customerA, customerB);

    // row didn't exist yet (e.g., matchmaker previewing before saving).
    // Now uses INSERT ... ON CONFLICT DO UPDATE so insights are always persisted.
    await pool.query(
      `INSERT INTO matches (customer_a_id, customer_b_id, score, ai_insights, status)
       VALUES ($1, $2, $3, $4, 'Suggested')
       ON CONFLICT (customer_a_id, customer_b_id)
       DO UPDATE SET ai_insights = EXCLUDED.ai_insights`,
      [customer_id, match_customer_id, insights.score, JSON.stringify(insights)]
    );

    res.json({ success: true, data: insights, cached: false });
  } catch (err) {
    next(err);
  }
}

module.exports = { getInsights };
