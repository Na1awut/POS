import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// GET /api/expenses
router.get('/', async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, category_id } = req.query;
    let sql = `SELECT e.*, ec.name as category_name, ec.color as category_color
               FROM expenses e LEFT JOIN expense_categories ec ON e.expense_category_id = ec.id
               WHERE 1=1`;
    const params: any[] = [];
    let p = 1;
    if (start_date) { sql += ` AND e.expense_date >= $${p++}`; params.push(start_date); }
    if (end_date) { sql += ` AND e.expense_date <= $${p++}`; params.push(end_date); }
    if (category_id) { sql += ` AND e.expense_category_id = $${p++}`; params.push(category_id); }
    sql += ' ORDER BY e.expense_date DESC, e.created_at DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/expenses/categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM expense_categories ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// POST /api/expenses
router.post('/', async (req: Request, res: Response) => {
  const { expense_category_id, description, amount, expense_date, note } = req.body;
  try {
    const result = await query(
      `INSERT INTO expenses (expense_category_id, description, amount, expense_date, note)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [expense_category_id || null, description, amount, expense_date, note || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req: Request, res: Response) => {
  const { expense_category_id, description, amount, expense_date, note } = req.body;
  try {
    const result = await query(
      `UPDATE expenses SET expense_category_id=$1, description=$2, amount=$3, expense_date=$4, note=$5
       WHERE id=$6 RETURNING *`,
      [expense_category_id || null, description, amount, expense_date, note || null, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await query('DELETE FROM expenses WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
