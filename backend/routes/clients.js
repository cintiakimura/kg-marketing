/**
 * Clients API — CRUD
 */
import { Router } from 'express';
import { query, formatClient } from '../db.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT * FROM clients ORDER BY created_at DESC'
    );
    res.json({ success: true, data: rows.map(formatClient), meta: { count: rows.length } });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Client not found' });
    res.json({ success: true, data: formatClient(rows[0]) });
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
      `INSERT INTO clients (name, industry, status, notes, contact_name, deal_value, last_contact_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        b.name.trim(),
        b.industry || null,
        b.status || 'prospect',
        b.notes || null,
        b.contact_name || null,
        b.deal_value != null ? Number(b.deal_value) : null,
        b.last_contact_at || null,
      ]
    );
    res.status(201).json({ success: true, data: formatClient(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const b = req.body;
    const allowed = [
      'name', 'industry', 'status', 'notes', 'contact_name', 'deal_value', 'last_contact_at',
    ];
    const sets = [];
    const vals = [];
    for (const key of allowed) {
      if (b[key] !== undefined) {
        vals.push(key === 'deal_value' && b[key] !== null ? Number(b[key]) : b[key]);
        sets.push(`${key} = $${vals.length}`);
      }
    }
    if (!sets.length) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE clients SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
    );
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Client not found' });
    res.json({ success: true, data: formatClient(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await query('DELETE FROM clients WHERE id = $1 RETURNING id', [
      req.params.id,
    ]);
    if (!rows[0]) return res.status(404).json({ success: false, error: 'Client not found' });
    res.json({ success: true, data: { id: rows[0].id } });
  } catch (err) {
    next(err);
  }
});

export default router;
