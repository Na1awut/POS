import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { query } from './database';

async function runMigration() {
  try {
    const schemaPath = path.join(__dirname, '../models/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running database migration...');
    await query(sql);
    
    // Auto-create default admin user if not exists
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('admin123', salt);
    await query(`
      INSERT INTO users (username, password_hash, role) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (username) DO NOTHING
    `, ['admin', hash, 'admin']);

    console.log('Migration and initial setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
