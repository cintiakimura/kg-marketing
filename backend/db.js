/**
 * PostgreSQL connection pool + schema initialization.
 */
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  max: 20,
});

pool.on('error', (err) => console.error('[db] Pool error:', err.message));

export async function query(text, params) {
  if (!process.env.DATABASE_URL) {
    const err = new Error('DATABASE_URL is not configured on the server');
    err.status = 503;
    throw err;
  }
  return pool.query(text, params);
}

const USERS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
`;

/** Ensure users table exists (auth) — safe to run on every deploy. */
export async function ensureUsersTable() {
  if (!process.env.DATABASE_URL) {
    console.warn('[db] DATABASE_URL missing — skip users table');
    return false;
  }
  await pool.query(USERS_TABLE_SQL);
  try {
    await pool.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await pool.query('DROP TRIGGER IF EXISTS trg_users_updated ON users');
    await pool.query(`
      CREATE TRIGGER trg_users_updated
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE PROCEDURE set_updated_at();
    `);
  } catch (err) {
    console.warn('[db] users trigger (non-fatal):', err.message);
  }
  return true;
}

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'prospect',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  language VARCHAR(50) DEFAULT 'English',
  target_audience TEXT,
  email_subject VARCHAR(500),
  email_body TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  media_url TEXT,
  media_type VARCHAR(50),
  followup_sequences JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  title VARCHAR(255),
  linkedin_url TEXT,
  location VARCHAR(255),
  client_id UUID REFERENCES clients (id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns (id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  language_preference VARCHAR(50) DEFAULT 'English',
  notes TEXT,
  last_status_change TIMESTAMPTZ,
  followup_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  fit_score SMALLINT,
  source VARCHAR(100) DEFAULT 'manual',
  next_followup_date DATE,
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject VARCHAR(500),
  body TEXT,
  from_email VARCHAR(255),
  to_email VARCHAR(255),
  folder VARCHAR(50) DEFAULT 'inbox',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  date TIMESTAMPTZ,
  lead_id UUID REFERENCES leads (id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads (email);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_created_at ON email_messages (created_at DESC);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients','campaigns','leads','email_messages','users'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %I FOR EACH ROW EXECUTE PROCEDURE set_updated_at()',
      t, t
    );
  END LOOP;
END $$;
`;

/** Create tables if they do not exist. */
export async function initDatabase() {
  try {
    await pool.query(SCHEMA_SQL);
  } catch (err) {
    console.error('[db] Full schema init warning:', err.message);
  }
  try {
    await pool.query(`
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_followup_date DATE;
      ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;
    `);
  } catch (err) {
    console.warn('[db] leads columns:', err.message);
  }
  await ensureUsersTable();
  console.log('[db] Tables ready');
}

/** Health check — verify DB connection. */
export async function ping() {
  const { rows } = await pool.query('SELECT NOW() AS now');
  return rows[0];
}

/** Map DB row → API response (frontend-compatible). */
export function formatLead(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    company: row.company,
    title: row.title,
    linkedin_url: row.linkedin_url,
    location: row.location,
    client_id: row.client_id,
    campaign_id: row.campaign_id,
    status: row.status,
    language_preference: row.language_preference,
    notes: row.notes,
    last_status_change: row.last_status_change,
    followup_history: row.followup_history || [],
    fit_score: row.fit_score,
    source: row.source,
    next_followup_date: row.next_followup_date,
    last_contact_at: row.last_contact_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_date: row.created_at,
  };
}

export function formatCampaign(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    language: row.language,
    target_audience: row.target_audience,
    email_subject: row.email_subject,
    email_body: row.email_body,
    status: row.status,
    media_url: row.media_url,
    media_type: row.media_type,
    followup_sequences: row.followup_sequences || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_date: row.created_at,
  };
}
