'use strict';

const { spawn }   = require('node:child_process');
const path        = require('node:path');

// ---------------------------------------------------------------------------
// Resolve the path to validate_listing.py
// ---------------------------------------------------------------------------

// SKILL_VALIDATOR_PATH can be absolute or relative to the monorepo root.
// __dirname = .../neolink-hub/services/opportunities/src/services
// → 4 levels up reaches the repo root: neolink-hub/
const REPO_ROOT      = path.resolve(__dirname, '..', '..', '..', '..');
const VALIDATOR_REL  = process.env.SKILL_VALIDATOR_PATH
  ?? 'agent/skills/marketplace-moderator/scripts/validate_listing.py';

const VALIDATOR_PATH = path.isAbsolute(VALIDATOR_REL)
  ? VALIDATOR_REL
  : path.join(REPO_ROOT, VALIDATOR_REL);

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Runs the marketplace-moderator skill against a listing payload.
 *
 * Calls:
 *   python3 <VALIDATOR_PATH> '<JSON>'
 *
 * @param {object} listing  — Raw listing object from the request body.
 * @returns {Promise<{ valid: boolean, message: string, details: string[] }>}
 */
async function validateListing(listing) {
  return new Promise((resolve, reject) => {
    const jsonArg = JSON.stringify(listing);

    const child = spawn('python3', [VALIDATOR_PATH, jsonArg], {
      // Isolate the child so its CWD doesn't affect path resolution.
      cwd: REPO_ROOT,
      // Inherit only the PATH so python3 is locatable.
      env: { PATH: process.env.PATH },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    child.on('error', (err) => {
      // Spawn failure (e.g. python3 not found).
      reject(
        Object.assign(new Error(`Failed to launch validator skill: ${err.message}`), {
          statusCode: 500,
          code: 'SKILL_SPAWN_ERROR',
        })
      );
    });

    child.on('close', (code) => {
      if (code === 0) {
        return resolve({
          valid:   true,
          message: stdout.trim(),
          details: [],
        });
      }

      // Exit code 1 → validation failure.
      // Parse the structured error from stderr:
      //   "VALIDATION_ERROR: reason1 | reason2 | ..."
      const rawError = stderr.trim() || stdout.trim();
      const details  = _parseValidationErrors(rawError);

      resolve({
        valid:   false,
        message: rawError,
        details,
      });
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Splits a VALIDATION_ERROR string into individual error detail strings.
 *
 * Input:  "VALIDATION_ERROR: 'title' is too short. | 'price' must be > 0."
 * Output: ["'title' is too short.", "'price' must be > 0."]
 *
 * @param {string} raw
 * @returns {string[]}
 */
function _parseValidationErrors(raw) {
  // Strip the "VALIDATION_ERROR: " prefix if present.
  const stripped = raw.replace(/^VALIDATION_ERROR:\s*/i, '').trim();
  if (!stripped) return [raw];

  return stripped
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = { validateListing };
