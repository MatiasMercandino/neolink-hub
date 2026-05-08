'use strict';

const { validateListing }    = require('../services/moderatorService');
const {
  createOpportunity,
  findOpportunities,
  updateOpportunityStatus,
  deleteOpportunity,
} = require('../services/opportunitiesService');

// ---------------------------------------------------------------------------
// GET /api/v1/opportunities
// ---------------------------------------------------------------------------

/**
 * Handles the retrieval of opportunities.
 */
async function listOpportunitiesHandler(req, res, next) {
  try {
    const status = req.query.status === 'all' ? null : (req.query.status ?? 'approved');
    const vendor_id = req.query.vendor_id ?? null;

    const list = await findOpportunities({ status, vendor_id });

    return res.status(200).json({
      status: 'success',
      count:  list.length,
      data:   list,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/opportunities/:id/status
// ---------------------------------------------------------------------------

/**
 * Handles manual moderation status updates by an admin.
 */
async function updateStatusHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be one of: approved, rejected, pending.'
      });
    }

    const updated = await updateOpportunityStatus(id, status, note);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Opportunity not found.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Opportunity status updated to ${status}.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/opportunities/:id
// ---------------------------------------------------------------------------

/**
 * Handles the permanent deletion of an opportunity.
 */
async function deleteOpportunityHandler(req, res, next) {
  try {
    const { id } = req.params;
    const success = await deleteOpportunity(id);

    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: 'Opportunity not found.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Opportunity permanently deleted.'
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/opportunities
// ---------------------------------------------------------------------------

/**
 * Handles the creation of a new digital product opportunity.
 */
async function createOpportunityHandler(req, res, next) {
  try {
    const requiredFields = [
      'title', 'description', 'category',
      'price', 'currency', 'billing_cycle', 'vendor_id',
    ];

    const missingFields = requiredFields.filter(
      (f) => req.body[f] === undefined || req.body[f] === null
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        status:  'error',
        code:    'MISSING_REQUIRED_FIELDS',
        message: 'One or more required fields are missing.',
        details: missingFields.map((f) => `'${f}' is required.`),
      });
    }

    const moderation = await validateListing(req.body);

    if (!moderation.valid) {
      return res.status(400).json({
        status:  'error',
        code:    'MODERATION_FAILED',
        message: 'The listing did not pass marketplace moderation.',
        details: moderation.details,
      });
    }

    const opportunity = await createOpportunity(req.body);

    return res.status(201).json({
      status:  'success',
      message: 'Opportunity created and approved by the marketplace moderator.',
      data:    opportunity,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOpportunityHandler,
  listOpportunitiesHandler,
  updateStatusHandler,
  deleteOpportunityHandler,
};
