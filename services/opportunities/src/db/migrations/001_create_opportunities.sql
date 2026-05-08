-- Migration: 001_create_opportunities
-- Description: Creates the initial opportunities table for the NEOLINK HUB marketplace.
-- Run with: psql $DATABASE_URL -f src/db/migrations/001_create_opportunities.sql

-- Enable the pgcrypto extension for gen_random_uuid() if not already active.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUM types
-- ---------------------------------------------------------------------------

CREATE TYPE billing_cycle_enum AS ENUM (
  'monthly',
  'annual',
  'one-time',
  'usage-based'
);

CREATE TYPE moderation_status_enum AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- ---------------------------------------------------------------------------
-- Table: opportunities
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS opportunities (
  id                UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  title             VARCHAR(100)      NOT NULL,
  description       TEXT              NOT NULL,
  category          VARCHAR(80)       NOT NULL,
  price             NUMERIC(12, 2)    NOT NULL,
  currency          CHAR(3)           NOT NULL DEFAULT 'USD',
  billing_cycle     billing_cycle_enum NOT NULL,
  is_free           BOOLEAN           NOT NULL DEFAULT FALSE,
  vendor_id         VARCHAR(80)       NOT NULL,
  tags              TEXT[]            DEFAULT '{}',
  moderation_status moderation_status_enum NOT NULL DEFAULT 'approved',
  moderation_note   TEXT,
  created_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_opportunities_vendor_id
  ON opportunities (vendor_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_category
  ON opportunities (category);

CREATE INDEX IF NOT EXISTS idx_opportunities_moderation_status
  ON opportunities (moderation_status);

CREATE INDEX IF NOT EXISTS idx_opportunities_created_at
  ON opportunities (created_at DESC);

-- ---------------------------------------------------------------------------
-- Trigger: auto-update updated_at on row modification
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE opportunities IS
  'Digital product opportunities listed on the NEOLINK HUB B2B marketplace.';
