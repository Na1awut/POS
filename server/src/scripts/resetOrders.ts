import { query } from '../config/database';

async function resetOrders() {
  try {
    console.log('Clearing all test orders and receipts...');
    
    await query('BEGIN');
    
    // Truncate orders and items
    await query('TRUNCATE TABLE order_items CASCADE');
    await query('TRUNCATE TABLE orders CASCADE');
    
    // Reset the ID sequence back to 1
    await query('ALTER SEQUENCE orders_id_seq RESTART WITH 1');
    await query('ALTER SEQUENCE order_items_id_seq RESTART WITH 1');
    
    await query('COMMIT');
    
    console.log('✅ All test orders cleared! Queue number is back to #0001');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clear orders:', error);
    await query('ROLLBACK');
    process.exit(1);
  }
}

resetOrders();
