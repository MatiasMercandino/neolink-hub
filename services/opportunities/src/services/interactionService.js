'use strict';

const { pool } = require('../db');

/**
 * Records a new interaction (access or proposal).
 */
async function createInteraction({ opportunity_id, user_id, type, message }) {
  const sql = `
    INSERT INTO interactions (opportunity_id, user_id, type, message)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const { rows } = await pool.query(sql, [opportunity_id, user_id, type, message]);
  return rows[0];
}

/**
 * Retrieves interactions with full details.
 * Supports filtering by user_id (who performed the action) 
 * or seller_id (who owns the opportunity).
 */
async function getInteractions(filters = {}) {
  let query = `
    SELECT i.*, u.full_name as user_name, u.email as user_email, 
           o.title as opportunity_title, o.vendor_id as seller_id
    FROM interactions i
    JOIN users u ON i.user_id = u.id
    JOIN opportunities o ON i.opportunity_id = o.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.user_id) {
    params.push(filters.user_id);
    query += ` AND i.user_id = $${params.length}`;
  }

  if (filters.seller_id) {
    params.push(filters.seller_id);
    query += ` AND o.vendor_id = $${params.length}`;
  }

  query += ' ORDER BY i.created_at DESC';

  const { rows } = await pool.query(query, params);
  return rows;
}

module.exports = {
  createInteraction,
  getInteractions
};
