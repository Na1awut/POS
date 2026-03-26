import { Router } from 'express';
import { query } from '../config/database';

const router = Router();

// GET /api/categories
router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY sort_order ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/menu
// Fetches products mapped by category key, like the old mock structure
router.get('/', async (req, res) => {
  try {
    const categoriesResult = await query('SELECT * FROM categories ORDER BY sort_order ASC');
    const productsResult = await query('SELECT p.*, c.key as cat_key FROM products p JOIN categories c ON p.category_id = c.id WHERE p.is_active = true ORDER BY p.sort_order ASC');
    
    // Group products by category key
    const menuInfo: Record<string, any[]> = {};
    
    // Initialize empty arrays
    for (let cat of categoriesResult.rows) {
      menuInfo[cat.key] = [];
    }

    // Populate
    for (let prod of productsResult.rows) {
      if (menuInfo[prod.cat_key]) {
        menuInfo[prod.cat_key].push({
          id: prod.id,
          name_th: prod.name_th,
          name_en: prod.name_en,
          description_th: prod.description_th || '',
          description_en: prod.description_en || '',
          price: Number(prod.price), // Ensure it's passed as number
          image: prod.image_url || '/images/logo.png', // Fallback image
        });
      }
    }

    res.json({ categories: categoriesResult.rows, menu: menuInfo });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
