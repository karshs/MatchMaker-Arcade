// AI controller — fetches profiles, runs AI, caches result
const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { generateInsights } = require('../services/aiInsights');

// POST /api/ai/insights
async function getInsights(req, res, next) {
  try {
    const { customer_id, match_customer_id } = req.body;

    if (!customer_id || !match_customer_id) {
      return next(new AppError('customer_id and match_customer_id are required.', 400));
    }

    // Check if we already generated and cached insights for this pair
    const cached = await query(
      `SELECT ai_insights FROM matches
       WHERE customer_a_id = $1 AND customer_b_id = $2 AND ai_insights IS NOT NULL`,
      [customer_id, match_customer_id]
    );

    if (cached.length > 0) {
      return res.json({
        success: true,
        data: JSON.parse(cached[0].ai_insights),
        cached: true, // frontend can show "Cached" badge
      });
    }

    // Fetch both full profiles
    const customers = await query(
      'SELECT * FROM customers WHERE id = ANY($1) AND is_active = TRUE',
      [[customer_id, match_customer_id]]
    );

    if (customers.length < 2) {
      return next(new AppError('One or both customers not found.', 404));
    }

    const customerA = customers.find(c => c.id === customer_id);
    const customerB = customers.find(c => c.id === match_customer_id);

    // Generate insights (OpenAI or mock depending on config)
    const insights = await generateInsights(customerA, customerB);

    // Cache in matches table so we don't call OpenAI twice for the same pair
    await query(
      `UPDATE matches SET ai_insights = $1
       WHERE customer_a_id = $2 AND customer_b_id = $3`,
      [JSON.stringify(insights), customer_id, match_customer_id]
    );

    res.json({ success: true, data: insights, cached: false });
  } catch (err) {
    next(err);
  }
}

module.exports = { getInsights };
