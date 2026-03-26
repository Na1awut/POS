import { Router } from 'express';
import { query } from '../config/database';
// @ts-ignore
import jwt from 'jsonwebtoken';

const router = Router();

// Middleware auth mock - should be improved later
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// All product routes require auth (Admin access)
router.use(authenticate);

// GET all products for Admin DataTable
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.*, c.name_th as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// POST to create product
router.post('/', async (req, res) => {
  const { category_id, name_th, name_en, price, description_th, description_en, image_url, is_active } = req.body;
  try {
    const insertQ = `
      INSERT INTO products (category_id, name_th, name_en, price, description_th, description_en, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `;
    const r = await query(insertQ, [
      category_id || null, name_th, name_en, price, description_th || null, description_en || null, image_url || null, is_active ?? true
    ]);
    res.status(201).json(r.rows[0]);
  } catch(e) {
    res.status(500).json({error: 'Failed'});
  }
});

// DEL /:id
router.delete('/:id', async (req, res) => {
  try {
    await query('DELETE FROM products WHERE id = $1', [req.params.id]);
    res.json({success: true});
  } catch(e) {
    res.status(500).json({error: 'Failed to delete' });
  }
});

export default router;
