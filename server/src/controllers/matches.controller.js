// Matches controller — runs the match engine and handles sending matches
const { query, pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { findMatches } = require('../services/matchEngine');

// GET /api/customers/:id/matches
// Runs the full engine: hard filters → score → activity decay → sort → return top 20
// Automatically excludes candidates that have already been Sent, are Interested,
// or have reached a Successful Match status — so the matchmaker sees only fresh suggestions.
async function getMatches(req, res, next) {
  try {
    const { id } = req.params;

    // Fetch the customer we're finding matches for
    const custRows = await query(
      'SELECT * FROM customers WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    if (custRows.length === 0) return next(new AppError('Customer not found.', 404));
    const customer = custRows[0];

    // Fetch IDs of candidates already actioned for this customer.
    // We exclude: Sent, Interested, Successful — i.e. anything beyond 'Suggested'.
    // 'Rejected' and 'Suggested' are intentionally NOT excluded so the matchmaker
    // can revisit a previously suggested but unsent profile.
    const alreadyMatched = await query(
      `SELECT customer_b_id AS id FROM matches
       WHERE customer_a_id = $1
         AND status IN ('Sent', 'Interested', 'Successful')`,
      [id]
    );
    const excludeIds = new Set(alreadyMatched.map(r => r.id));

    // Fetch all active candidates (the engine handles gender/preference filtering)
    const candidates = await query(
      'SELECT * FROM customers WHERE is_active = TRUE'
    );

    // Run the engine — passes excludeIds so already-sent profiles never surface
    const matches = findMatches(customer, candidates, 20, excludeIds);

    // Shape the response — include all scoring signals for the UI
    const data = matches.map(({ candidate, score, raw_score, activity_multiplier, breakdown, match_label }) => ({
      id:                  candidate.id,
      first_name:          candidate.first_name,
      last_name:           candidate.last_name,
      gender:              candidate.gender,
      age:                 Math.floor((Date.now() - new Date(candidate.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000)),
      city:                candidate.city,
      state:               candidate.state,
      occupation:          candidate.occupation,
      education:           candidate.education,
      annual_income:       candidate.annual_income,
      religion:            candidate.religion,
      caste:               candidate.caste,
      family_values:       candidate.family_values,
      want_kids:           candidate.want_kids,
      languages:           candidate.languages,
      diet:                candidate.diet,
      photo_url:           candidate.photo_url,
      journey_status:      candidate.journey_status,
      compatibility_score: score,           // decayed ranking score
      raw_score,                            // pure compatibility before decay
      activity_multiplier,                  // UI can show 'Inactive profile' badge if < 1.0
      match_label,                          // "Excellent Match" / "Good Match" etc.
      score_breakdown:     breakdown,
    }));

    res.json({
      success: true,
      customer_name:   `${customer.first_name} ${customer.last_name}`,
      total_matches:   data.length,
      excluded_count:  excludeIds.size, // tells the frontend how many were hidden
      data,
    });
  } catch (err) {
    next(err);
  }
}


// POST /api/customers/:id/matches/:matchId/send
// Saves the match to the DB and marks it as Sent (mock email)
async function sendMatch(req, res, next) {
  const { id: customerAId, matchId: customerBId } = req.params;

  // Verify both customers exist
  const both = await query(
    'SELECT id, first_name, last_name FROM customers WHERE id = ANY($1) AND is_active = TRUE',
    [[customerAId, customerBId]]
  );
  if (both.length < 2) return next(new AppError('One or both customers not found.', 404));

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Upsert into matches table — if already exists, just update status to Sent
    await client.query(
      `INSERT INTO matches (customer_a_id, customer_b_id, score, status, sent_at)
       VALUES ($1, $2, $3, 'Sent', NOW())
       ON CONFLICT (customer_a_id, customer_b_id)
       DO UPDATE SET status = 'Sent', sent_at = NOW()`,
      [customerAId, customerBId, req.body.score || 0]
    );

    // Also update customer journey to 'Matches Shared' if they're still in Searching
    await client.query(
      `UPDATE customers SET journey_status = 'Matches Shared', last_updated = NOW()
       WHERE id = $1 AND journey_status = 'Searching'`,
      [customerAId]
    );

    await client.query('COMMIT');

    const customerA = both.find(c => c.id === customerAId);
    const customerB = both.find(c => c.id === customerBId);

    res.json({
      success: true,
      message: 'Match sent successfully!',
      data: {
        sent_to: `${customerA.first_name} ${customerA.last_name}`,
        matched_with: `${customerB.first_name} ${customerB.last_name}`,
        // Mock email preview
        email_preview: `Hi ${customerA.first_name}, we found a great match for you — ${customerB.first_name} ${customerB.last_name}! Check your MatchMaker portal for details.`,
      },
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    next(err);
  } finally {
    if (client) client.release();
  }
}

// GET /api/customers/:id/sent-matches — previously sent matches for a customer
async function getSentMatches(req, res, next) {
  try {
    const { id } = req.params;

    const rows = await query(
      `SELECT m.*, 
        c.first_name, c.last_name, c.city, c.occupation, c.photo_url,
        c.annual_income, c.religion, c.education
       FROM matches m
       JOIN customers c ON c.id = m.customer_b_id
       WHERE m.customer_a_id = $1
       ORDER BY m.created_at DESC`,
      [id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMatches, sendMatch, getSentMatches };
