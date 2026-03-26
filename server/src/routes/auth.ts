import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const userRes = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (userRes.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userRes.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const secret = process.env.JWT_SECRET || 'secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      secret as string,
      { expiresIn: expiresIn as any }
    );

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
