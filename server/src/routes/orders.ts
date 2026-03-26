import { Router } from 'express';
import { query } from '../config/database';

const router = Router();

// POST /api/orders
// Create a new order with items
router.post('/', async (req, res) => {
  const { subtotal, discount_percent, discount_amount, tip_percent, tip_amount, total, items } = req.body;

  try {
    await query('BEGIN'); // Start transaction

    // Generate random 4 digit order number like in the frontend mock
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString().substring(1);
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}-${randomSuffix}`;

    const orderInsert = `
      INSERT INTO orders (order_number, subtotal, discount_percent, discount_amount, tip_percent, tip_amount, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, order_number
    `;
    
    const orderRes = await query(orderInsert, [
      orderNumber, subtotal, discount_percent || 0, discount_amount || 0, tip_percent || 0, tip_amount || 0, total
    ]);
    const orderId = orderRes.rows[0].id;
    const finalOrderNumber = orderRes.rows[0].order_number;

    // Insert items
    const itemInsert = `
      INSERT INTO order_items (order_id, product_id, product_name_th, product_name_en, quantity, unit_price, subtotal)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    for (const item of items) {
      await query(itemInsert, [
        orderId, 
        item.id, 
        item.name_th, 
        item.name_en, 
        item.quantity, 
        item.price, 
        item.price * item.quantity
      ]);
    }

    await query('COMMIT'); // Commit transaction
    res.status(201).json({ success: true, orderNumber: finalOrderNumber, orderId });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Internal server error while creating order' });
  }
});

// GET /api/orders
// Get order history (for Admin)
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 50');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
