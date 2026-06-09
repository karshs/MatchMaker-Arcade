// Customers controller — handles all customer profile operations
const { query, pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

// Valid sort columns — whitelist to prevent SQL injection
const SORT_MAP = {
  name: 'first_name ASC',
  age: 'date_of_birth DESC',
  last_updated: 'last_updated DESC',
  journey_status: 'journey_status ASC',
};

// Valid journey statuses
const JOURNEY_STATUSES = [
  'Profile Verified', 'Searching', 'Matches Shared',
  'Interested', 'Call Scheduled', 'Meeting Scheduled',
  'Successful Match', 'Paused', 'Inactive',
];

// ── GET /api/customers ─────────────────────────────────────────
// Returns a paginated, filtered, searchable list of customers
async function getCustomers(req, res, next) {
  try {
    const {
      search, gender, city, religion,
      journey_status, marital_status,
      page = 1, limit = 20, sort = 'last_updated',
    } = req.query;

    const conditions = ['is_active = TRUE'];
    const params = [];
    let i = 1; // tracks the $1, $2... parameter index

    // Full-text search across name, city, occupation
    if (search) {
      conditions.push(`(
        first_name ILIKE $${i} OR last_name ILIKE $${i} OR
        city ILIKE $${i} OR occupation ILIKE $${i}
      )`);
      params.push(`%${search}%`);
      i++;
    }

    // Exact match filters
    if (gender)         { conditions.push(`gender = $${i++}`);          params.push(gender); }
    if (city)           { conditions.push(`city ILIKE $${i++}`);        params.push(`%${city}%`); }
    if (religion)       { conditions.push(`religion = $${i++}`);        params.push(religion); }
    if (journey_status) { conditions.push(`journey_status = $${i++}`);  params.push(journey_status); }
    if (marital_status) { conditions.push(`marital_status = $${i++}`);  params.push(marital_status); }

    const where = conditions.join(' AND ');
    const orderBy = SORT_MAP[sort] || SORT_MAP.last_updated;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Run count and data queries in parallel for speed
    const [countResult, customers] = await Promise.all([
      query(`SELECT COUNT(*) FROM customers WHERE ${where}`, params),
      query(
        `SELECT
          id, first_name, last_name, gender,
          date_of_birth,
          EXTRACT(YEAR FROM AGE(NOW(), date_of_birth))::INTEGER AS age,
          city, state, marital_status, journey_status,
          occupation, photo_url, last_updated
        FROM customers
        WHERE ${where}
        ORDER BY ${orderBy}
        LIMIT $${i} OFFSET $${i + 1}`,
        [...params, parseInt(limit), offset]
      ),
    ]);

    const total = parseInt(countResult[0].count);

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/customers/:id ─────────────────────────────────────
// Returns the full profile of a single customer
async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;

    const rows = await query(
      `SELECT *,
        EXTRACT(YEAR FROM AGE(NOW(), date_of_birth))::INTEGER AS age
       FROM customers
       WHERE id = $1 AND is_active = TRUE`,
      [id]
    );

    if (rows.length === 0) {
      return next(new AppError('Customer not found.', 404));
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── PUT /api/customers/:id ─────────────────────────────────────
// Updates editable profile fields (not journey_status — use PATCH for that)
async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;

    // Build SET clause dynamically — only update fields that were sent
    const allowedFields = [
      'first_name', 'last_name', 'date_of_birth', 'city', 'state', 'photo_url',
      'education', 'college', 'occupation', 'company', 'annual_income', 'employed_in',
      'religion', 'caste', 'sub_caste', 'mother_tongue', 'family_type', 'family_values',
      'father_occupation', 'mother_occupation', 'num_siblings', 'manglik_status',
      'languages', 'diet', 'smoking', 'drinking', 'open_to_pets', 'physical_activity',
      'personality_type', 'interests', 'height_cm', 'complexion', 'body_type',
      'want_kids', 'open_to_relocate', 'marriage_timeline',
      'pref_age_min', 'pref_age_max', 'pref_education', 'pref_income_min', 'pref_income_max',
      'pref_religion', 'pref_caste', 'pref_location', 'pref_diet', 'pref_family_type',
      'pref_manglik', 'deal_breakers',
    ];

    const updates = [];
    const params = [];
    let i = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${i++}`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return next(new AppError('No valid fields provided to update.', 400));
    }

    // Always update last_updated timestamp
    updates.push(`last_updated = NOW()`);
    params.push(id);

    const rows = await query(
      `UPDATE customers SET ${updates.join(', ')} WHERE id = $${i} AND is_active = TRUE RETURNING *`,
      params
    );

    if (rows.length === 0) {
      return next(new AppError('Customer not found.', 404));
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/customers/:id/journey ──────────────────────────
// Updates journey status AND logs the change to journey_events (atomic)
async function updateJourneyStatus(req, res, next) {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status || !JOURNEY_STATUSES.includes(status)) {
    return next(new AppError(`Invalid journey status. Must be one of: ${JOURNEY_STATUSES.join(', ')}`, 400));
  }

  // Use a transaction so both updates succeed or both fail together
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Get current status before changing it
    const current = await client.query(
      'SELECT journey_status FROM customers WHERE id = $1 AND is_active = TRUE',
      [id]
    );
    if (current.rows.length === 0) throw new AppError('Customer not found.', 404);

    const fromStatus = current.rows[0].journey_status;

    // Update the snapshot status on the customer
    await client.query(
      'UPDATE customers SET journey_status = $1, last_updated = NOW() WHERE id = $2',
      [status, id]
    );

    // Append to the history log
    await client.query(
      'INSERT INTO journey_events (customer_id, from_status, to_status, note) VALUES ($1, $2, $3, $4)',
      [id, fromStatus, status, note || null]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Journey updated: ${fromStatus} → ${status}`,
      data: { from: fromStatus, to: status },
    });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    next(err);
  } finally {
    if (client) client.release();
  }
}

// ── GET /api/customers/:id/journey-events ─────────────────────
// Returns the full journey timeline for a customer
async function getJourneyEvents(req, res, next) {
  try {
    const { id } = req.params;

    const events = await query(
      'SELECT * FROM journey_events WHERE customer_id = $1 ORDER BY changed_at ASC',
      [id]
    );

    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomer,
  updateJourneyStatus,
  getJourneyEvents,
};
