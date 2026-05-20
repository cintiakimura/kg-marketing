/**
 * Campaigns API — basic CRUD.
 */
import { Router } from 'express';
import { query, formatCampaign } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM campaigns ORDER BY created_at DESC');
    res.json({ success: true, data: rows.map(formatCampaign), meta: { count: rows.length } });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM campaigns WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, data: formatCampaign(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.name?.trim()) {
      return res.status(400).json({ success: false, error: 'name is required' });
    }

    const { rows } = await query(
      `INSERT INTO campaigns (
        name, language, target_audience, email_subject, email_body,
        status, media_url, media_type, followup_sequences
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        b.name.trim(),
        b.language || 'English',
        b.target_audience || null,
        b.email_subject || null,
        b.email_body || null,
        b.status || 'draft',
        b.media_url || null,
        b.media_type || null,
        JSON.stringify(b.followup_sequences || []),
      ]
    );

    res.status(201).json({ success: true, data: formatCampaign(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const allowed = [
      'name', 'language', 'target_audience', 'email_subject', 'email_body',
      'status', 'media_url', 'media_type', 'followup_sequences',
    ];
    const sets = [];
    const vals = [];

    for (const key of allowed) {
      if (b[key] !== undefined) {
        vals.push(key === 'followup_sequences' ? JSON.stringify(b[key]) : b[key]);
        sets.push(`${key} = $${vals.length}`);
      }
    }

    if (!sets.length) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE campaigns SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );

    if (!rows[0]) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, data: formatCampaign(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('DELETE FROM campaigns WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Campaign not found' });
    res.json({ success: true, data: { id: rows[0].id } });
  } catch (err) {
    next(err);
  }
});

export default router;
