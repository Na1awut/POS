import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// GET /api/categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY sort_order');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// POST /api/categories
router.post('/', async (req: Request, res: Response) => {
  const { key, name_th, name_en, sort_order } = req.body;
  try {
    const result = await query(
      'INSERT INTO categories (key, name_th, name_en, sort_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [key, name_th, name_en, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { name_th, name_en, sort_order } = req.body;
  try {
    const result = await query(
      'UPDATE categories SET name_th=$1, name_en=$2, sort_order=$3 WHERE id=$4 RETURNING *',
      [name_th, name_en, sort_order || 0, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// DELETE /api/categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
