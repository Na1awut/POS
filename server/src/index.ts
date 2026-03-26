import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import menuRoutes from './routes/menu';
import authRoutes from './routes/auth';
import productsRoutes from './routes/products';
import ordersRoutes from './routes/orders';
import reportsRoutes from './routes/reports';
import expensesRoutes from './routes/expenses';
import categoriesRoutes from './routes/categories';
import aiRoutes from './routes/ai';
import uploadRoutes from './routes/upload';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// Expose the 'img' directory as a static endpoint so the frontend can load images from /img/filename.jpg
app.use('/img', express.static(path.join(process.cwd(), 'img')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'POS+ API', version: '2.0.0' });
});

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/upload', uploadRoutes);

app.listen(port, () => {
  console.log(`[POS+ Server]: Running at http://localhost:${port}`);
});
