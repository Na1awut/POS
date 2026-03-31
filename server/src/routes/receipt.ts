import { Router } from 'express';
import { query } from '../config/database';

const router = Router();

// Default template with all block types
const DEFAULT_TEMPLATE = {
  blocks: [
    { id: 'header-1', type: 'text', content: '☕ Coffee View', align: 'center', bold: true, fontSize: 'large' },
    { id: 'header-2', type: 'text', content: '123 ถนนสุขุมวิท กรุงเทพฯ', align: 'center', fontSize: 'small' },
    { id: 'header-3', type: 'text', content: 'Tel: 02-123-4567', align: 'center', fontSize: 'small' },
    { id: 'div-1', type: 'divider', style: 'dashed' },
    { id: 'order-info', type: 'order-info', showDate: true, showTime: true, showOrderNumber: true, showCashier: false, dateFormat: 'DD/MM/YYYY' },
    { id: 'div-2', type: 'divider', style: 'dashed' },
    { id: 'items', type: 'items-table', showQuantity: true, showUnitPrice: true, showSubtotal: true },
    { id: 'div-3', type: 'divider', style: 'double' },
    { id: 'totals', type: 'totals', showSubtotal: true, showDiscount: true, showTip: true, showVAT: false, showTotal: true },
    { id: 'div-4', type: 'divider', style: 'dashed' },
    { id: 'qr-1', type: 'qrcode', qrType: 'promptpay', promptpayId: '', url: '', customText: '', size: 'medium', label: 'สแกนจ่ายที่นี่', showAmount: true },
    { id: 'div-5', type: 'divider', style: 'dashed' },
    { id: 'footer-1', type: 'text', content: 'ขอบคุณที่ใช้บริการ ♥', align: 'center', fontSize: 'normal' },
    { id: 'spacer-1', type: 'spacer', lines: 3 },
  ]
};

// GET all templates
router.get('/templates', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM receipt_templates ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET active template
router.get('/templates/active', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM receipt_templates WHERE is_active = true LIMIT 1');
    if (result.rows.length === 0) {
      // Return default template structure if none exists
      return res.json({ id: null, name: 'Default', is_active: true, paper_width: '58', template_data: DEFAULT_TEMPLATE });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET template by id
router.get('/templates/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM receipt_templates WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create template  
router.post('/templates', async (req, res) => {
  try {
    const { name, paper_width, template_data } = req.body;
    const data = template_data || DEFAULT_TEMPLATE;
    const result = await query(
      'INSERT INTO receipt_templates (name, paper_width, template_data) VALUES ($1, $2, $3) RETURNING *',
      [name || 'New Receipt', paper_width || '58', JSON.stringify(data)]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update template
router.put('/templates/:id', async (req, res) => {
  try {
    const { name, paper_width, template_data } = req.body;
    const result = await query(
      `UPDATE receipt_templates SET name = COALESCE($1, name), paper_width = COALESCE($2, paper_width), 
       template_data = COALESCE($3, template_data), updated_at = NOW() WHERE id = $4 RETURNING *`,
      [name, paper_width, template_data ? JSON.stringify(template_data) : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT activate template (deactivate all others first)
router.put('/templates/:id/activate', async (req, res) => {
  try {
    await query('UPDATE receipt_templates SET is_active = false');
    const result = await query(
      'UPDATE receipt_templates SET is_active = true, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE template
router.delete('/templates/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM receipt_templates WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
