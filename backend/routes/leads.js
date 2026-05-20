/**
 * Leads API — full CRUD (primary resource).
 */
import { Router } from 'express';
import { query, formatLead } from '../db.js';

const router = Router();

export const PIPELINE_STATUSES = new Set([
  'new',
  'contacted',
  'interested',
  'follow_up_later',
  'no_budget',
  'client',
  'archived',
  // legacy (normalized on write)
  'follow_up',
  'follow-up',
  'scheduled',
  'meeting',
  'closed',
  'lost',
]);

const SORT = {
  '-created_date': 'created_at DESC',
  created_date: 'created_at ASC',
  '-created_at': 'created_at DESC',
  next_followup_date: 'next_followup_date ASC NULLS LAST',
};

function normalizeStatus(status) {
  const map = {
    'follow-up': 'follow_up_later',
    follow_up: 'follow_up_later',
    closed: 'client',
    lost: 'archived',
    scheduled: 'interested',
    meeting: 'interested',
  };
  return map[status] || status;
}

function isValidStatus(status) {
  return PIPELINE_STATUSES.has(status);
}

/** GET /api/leads */
router.get('/', async (req, res, next) => {
  try {
    const order = SORT[req.query.sort] || 'created_at DESC';
    const params = [];
    const where = [];

    if (req.query.status) {
      params.push(normalizeStatus(req.query.status));
      where.push(`status = $${params.length}`);
    }

    const sql = `SELECT * FROM leads ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ${order}`;
    const { rows } = await query(sql, params);
    res.json({
      success: true,
      data: rows.map((r) => formatLead({ ...r, status: normalizeStatus(r.status) })),
      meta: { count: rows.length },
    });
  } catch (err) {
    next(err);
  }
});

/** POST /api/leads/bulk-update */
router.post('/bulk-update', async (req, res, next) => {
  try {
    const { ids, updates } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array is required' });
    }
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, error: 'updates object is required' });
    }

    const results = [];
    const allowed = [
      'status',
      'notes',
      'next_followup_date',
      'last_contact_at',
      'last_status_change',
    ];
    const normalized = { ...updates };
    if (normalized.status) {
      normalized.status = normalizeStatus(normalized.status);
      if (!isValidStatus(normalized.status)) {
        return res.status(400).json({ success: false, error: 'Invalid status' });
      }
    }

    for (const id of ids) {
      const sets = [];
      const vals = [];
      for (const key of allowed) {
        if (normalized[key] !== undefined) {
          vals.push(normalized[key]);
          sets.push(`${key} = $${vals.length}`);
        }
      }
      if (normalized.status !== undefined && normalized.last_status_change === undefined) {
        vals.push(new Date().toISOString());
        sets.push(`last_status_change = $${vals.length}`);
      }
      if (!sets.length) continue;
      vals.push(id);
      const { rows } = await query(
        `UPDATE leads SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
        vals
      );
      if (rows[0]) results.push(formatLead({ ...rows[0], status: normalizeStatus(rows[0].status) }));
    }

    res.json({ success: true, data: results, meta: { updated: results.length } });
  } catch (err) {
    next(err);
  }
});

/** POST /api/leads/bulk-delete */
router.post('/bulk-delete', async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array is required' });
    }
    const { rows } = await query(
      'DELETE FROM leads WHERE id = ANY($1::uuid[]) RETURNING id',
      [ids]
    );
    res.json({ success: true, data: { deleted: rows.map((r) => r.id) } });
  } catch (err) {
    next(err);
  }
});

/** GET /api/leads/:id */
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM leads WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Lead not found' });
    const lead = formatLead({ ...rows[0], status: normalizeStatus(rows[0].status) });
    res.json({ success: true, data: lead });
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

    const status = normalizeStatus(b.status || 'new');
    if (!isValidStatus(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const { rows } = await query(
      `INSERT INTO leads (
        full_name, email, company, title, linkedin_url, location,
        client_id, campaign_id, status, language_preference, notes,
        last_status_change, followup_history, fit_score, source,
        next_followup_date, last_contact_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
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
        b.last_status_change || new Date().toISOString(),
        JSON.stringify(b.followup_history || []),
        b.fit_score ?? null,
        b.source || 'manual',
        b.next_followup_date || null,
        b.last_contact_at || null,
      ]
    );

    res.status(201).json({
      success: true,
      data: formatLead({ ...rows[0], status: normalizeStatus(rows[0].status) }),
    });
  } catch (err) {
    next(err);
  }
});

/** PATCH /api/leads/:id */
router.patch('/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const allowed = [
      'full_name',
      'email',
      'company',
      'title',
      'linkedin_url',
      'location',
      'client_id',
      'campaign_id',
      'status',
      'language_preference',
      'notes',
      'last_status_change',
      'followup_history',
      'fit_score',
      'source',
      'next_followup_date',
      'last_contact_at',
    ];

    const sets = [];
    const vals = [];

    for (const key of allowed) {
      if (b[key] !== undefined) {
        let val = b[key];
        if (key === 'status') val = normalizeStatus(val);
        if (key === 'followup_history') val = JSON.stringify(val);
        vals.push(val);
        sets.push(`${key} = $${vals.length}`);
      }
    }

    if (b.status !== undefined && b.last_status_change === undefined) {
      vals.push(new Date().toISOString());
      sets.push(`last_status_change = $${vals.length}`);
      if (normalizeStatus(b.status) === 'contacted' && b.last_contact_at === undefined) {
        vals.push(new Date().toISOString());
        sets.push(`last_contact_at = $${vals.length}`);
      }
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
    res.json({
      success: true,
      data: formatLead({ ...rows[0], status: normalizeStatus(rows[0].status) }),
    });
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
