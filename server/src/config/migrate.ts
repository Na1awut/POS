import fs from 'fs';
import path from 'path';
import { query } from './database';

async function runMigration() {
  try {
    const schemaPath = path.join(__dirname, '../models/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Running database migration...');
    await query(sql);
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
