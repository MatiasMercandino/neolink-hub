'use strict';

const crypto = require('node:crypto');
const { pool } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

/**
 * Native password hashing using crypto (No external deps needed)
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === checkHash;
}

/**
 * Simple JWT-like implementation (Base64Url) using native Hmac
 */
function generateToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now() })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

/**
 * Registers a new user.
 */
async function register({ email, password, full_name, role = 'buyer' }) {
  const password_hash = hashPassword(password);
  
  const sql = `
    INSERT INTO users (email, password_hash, full_name, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, full_name, role, created_at;
  `;
  
  const { rows } = await pool.query(sql, [email.toLowerCase(), password_hash, full_name, role]);
  return rows[0];
}

/**
 * Authenticates a user.
 */
async function login(email, password) {
  const sql = 'SELECT * FROM users WHERE email = $1';
  const { rows } = await pool.query(sql, [email.toLowerCase()]);
  const user = rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }

  const token = generateToken({ id: user.id, email: user.email, role: user.role });

  return {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    },
    token
  };
}

module.exports = { register, login };
