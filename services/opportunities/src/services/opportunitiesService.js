'use strict';

const { pool } = require('../db');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persists a validated opportunity to the database.
 *
 * @param {object} data  — Validated and moderation-approved listing fields.
 * @returns {Promise<object>}  The newly created opportunity row.
 */
async function createOpportunity(data) {
  const {
    title,
    description,
    category,
    price,
    currency       = 'USD',
    billing_cycle,
    is_free        = false,
    vendor_id,
    tags           = [],
  } = data;

  const sql = `
    INSERT INTO opportunities
      (title, description, category, price, currency, billing_cycle,
       is_free, vendor_id, tags, moderation_status)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'approved')
    RETURNING *;
  `;

  const values = [
    title,
    description,
    category,
    price,
    currency.toUpperCase(),
    billing_cycle,
    Boolean(is_free),
    vendor_id,
    tags,
  ];

  const { rows } = await pool.query(sql, values);
  return rows[0];
}

/**
 * Retrieves a single opportunity by its UUID.
 *
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function findOpportunityById(id) {
  const { rows } = await pool.query(
    'SELECT * FROM opportunities WHERE id = $1',
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Retrieves opportunities with optional filters.
 */
async function findOpportunities(filters = {}) {
  let query = 'SELECT * FROM opportunities WHERE 1=1';
  const params = [];

  if (filters.status) {
    params.push(filters.status);
    query += ` AND moderation_status = $${params.length}`;
  }

  if (filters.vendor_id) {
    params.push(filters.vendor_id);
    query += ` AND vendor_id = $${params.length}`;
  }

  query += ' ORDER BY created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows;
}

/**
 * Updates the moderation status.
 */
async function updateOpportunityStatus(id, status, note = null) {
  const sql = `
    UPDATE opportunities
    SET moderation_status = $2, moderation_note = $3, updated_at = NOW()
    WHERE id = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [id, status, note]);
  return rows[0] ?? null;
}

/**
 * Permanently removes an opportunity.
 */
async function deleteOpportunity(id) {
  const sql = 'DELETE FROM opportunities WHERE id = $1 RETURNING id;';
  const { rows } = await pool.query(sql, [id]);
  return rows.length > 0;
}

module.exports = {
  createOpportunity,
  findOpportunityById,
  findOpportunities,
  updateOpportunityStatus,
  deleteOpportunity,
};
