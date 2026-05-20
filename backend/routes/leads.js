/**
 * Leads API — full CRUD (primary resource).
 */
import { Router } from 'express';
import { query, formatLead } from '../db.js';

const router = Router();

const STATUSES = new Set([
  'new', 'contacted', 'follow_up', 'follow-up', 'interested',
  'scheduled', 'meeting', 'client', 'closed', 'lost',
]);

const SORT = {
  '-created_date': 'created_at DESC',
  created_date: 'created_at ASC',
  '-created_at': 'created_at DESC',
};

/** GET /api/leads */
router.get('/', async (req, res, next) => {
  try {
    const order = SORT[req.query.sort] || 'created_at DESC';
    const params = [];
    const where = [];

    if (req.query.status) {
      params.push(req.query.status);
      where.push(`status = $${params.length}`);
    }

    const sql = `SELECT * FROM leads ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}`;
    const { rows } = await query(sql, params);
    res.json({ success: true, data: rows.map(formatLead), meta: { count: rows.length } });
  } catch (err) {
    next(err);
  }
});

/** GET /api/leads/:id */
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: formatLead(rows[0]) });
  } catch (err) {
    next(err);
  }
});

/** POST /api/leads */
router.post('/', async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.full_name?.trim() || !b.email?.trim()) {
      return res.status(400).json({ success: false, error: 'full_name and email are required' });
    }
    if (b.status && !STATUSES.has(b.status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const status = b.status || 'new';
    const { rows } = await query(
      `INSERT INTO leads (
        full_name, email, company, title, linkedin_url, location,
        client_id, campaign_id, status, language_preference, notes,
        last_status_change, followup_history, fit_score, source
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [
        b.full_name.trim(),
        b.email.trim().toLowerCase(),
        b.company || null,
        b.title || null,
        b.linkedin_url || null,
        b.location || null,
        b.client_id || null,
        b.campaign_id || null,
        status,
        b.language_preference || 'English',
        b.notes || null,
        b.last_status_change || null,
        JSON.stringify(b.followup_history || []),
        b.fit_score ?? null,
        b.source || 'manual',
      ]
    );

    res.status(201).json({ success: true, data: formatLead(rows[0]) });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/leads/:id */
router.patch('/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const allowed = [
      'full_name', 'email', 'company', 'title', 'linkedin_url', 'location',
      'client_id', 'campaign_id', 'status', 'language_preference', 'notes',
      'last_status_change', 'followup_history', 'fit_score', 'source',
    ];

    const sets = [];
    const vals = [];

    for (const key of allowed) {
      if (b[key] !== undefined) {
        vals.push(key === 'followup_history' ? JSON.stringify(b[key]) : b[key]);
        sets.push(`${key} = $${vals.length}`);
      }
    }

    if (b.status !== undefined && b.last_status_change === undefined) {
      vals.push(new Date().toISOString());
      sets.push(`last_status_change = $${vals.length}`);
    }

    if (!sets.length) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE leads SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );

    if (!rows[0]) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: formatLead(rows[0]) });
  } catch (err) {
    next(err);
  }
});

/** DELETE /api/leads/:id */
router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('DELETE FROM leads WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: { id: rows[0].id } });
  } catch (err) {
    next(err);
  }
});

export default router;
