'use strict';

const authService = require('../services/authService');

async function registerHandler(req, res, next) {
  try {
    const { email, password, full_name, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required.'
      });
    }

    const user = await authService.register({ email, password, full_name, role });
    
    res.status(201).json({
      status: 'success',
      data: user
    });
  } catch (err) {
    if (err.code === '23505') { // Duplicate email
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered.'
      });
    }
    next(err);
  }
}

async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body;
    
    const result = await authService.login(email, password);
    
    if (!result) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { registerHandler, loginHandler };
