'use strict';

const { Router } = require('express');
const { 
  createOpportunityHandler, 
  listOpportunitiesHandler,
  updateStatusHandler,
  deleteOpportunityHandler
} = require('../../controllers/opportunitiesController');

const router = Router();

/**
 * GET /api/v1/opportunities
 * Retrieves digital product listings (supports ?status and ?vendor_id).
 */
router.get('/', listOpportunitiesHandler);

/**
 * POST /api/v1/opportunities
 * Creates and moderates a new digital product listing.
 */
router.post('/', createOpportunityHandler);

/**
 * PATCH /api/v1/opportunities/:id/status
 * Manually update the moderation status (Admin only).
 */
router.patch('/:id/status', updateStatusHandler);

/**
 * DELETE /api/v1/opportunities/:id
 * Permanently delete an opportunity.
 */
router.delete('/:id', deleteOpportunityHandler);

module.exports = router;
