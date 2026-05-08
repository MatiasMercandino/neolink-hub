'use strict';

const { Router } = require('express');
const { 
  createInteraction, 
  getInteractions 
} = require('../../services/interactionService');

const router = Router();

/**
 * POST /api/v1/interactions
 */
router.post('/', async (req, res) => {
  try {
    const interaction = await createInteraction(req.body);
    res.status(201).json({ status: 'success', data: interaction });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * GET /api/v1/interactions
 * Query params: ?user_id=... or ?seller_id=...
 */
router.get('/', async (req, res) => {
  try {
    const { user_id, seller_id } = req.query;
    const list = await getInteractions({ user_id, seller_id });
    res.status(200).json({ status: 'success', data: list });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
