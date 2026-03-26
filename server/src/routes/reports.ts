import { Router, Request, Response } from 'express';
import { query } from '../config/database';

const router = Router();

// Helper: calculate VAT breakdown from VAT-inclusive price
// Thai VAT is 7%, typically included in price (VAT-inclusive)
// Revenue = Price / 1.07 * 1.07 → VAT = total * 7/107
export const calcVAT = (vatInclusiveTotal: number) => {
  const vatRate = 0.07;
  const vatAmount = vatInclusiveTotal * (vatRate / (1 + vatRate));
  const baseAmount = vatInclusiveTotal - vatAmount;
  return { baseAmount, vatAmount, vatRate: 7 };
};

// Estimate income tax (simplified for small business / sole proprietor)
// Thailand progressive rates for natural person:
// 0–150k = 0%, 150k–300k = 5%, 300k–500k = 10%, 500k–750k = 15%,
// 750k–1M = 20%, 1M–2M = 25%, 2M–5M = 30%, >5M = 35%
export const estimateIncomeTax = (netIncome: number): { brackets: any[]; totalTax: number } => {
  const brackets = [
    { min: 0, max: 150000, rate: 0, label: '0–150,000' },
    { min: 150000, max: 300000, rate: 0.05, label: '150,001–300,000' },
    { min: 300000, max: 500000, rate: 0.10, label: '300,001–500,000' },
    { min: 500000, max: 750000, rate: 0.15, label: '500,001–750,000' },
    { min: 750000, max: 1000000, rate: 0.20, label: '750,001–1,000,000' },
    { min: 1000000, max: 2000000, rate: 0.25, label: '1,000,001–2,000,000' },
    { min: 2000000, max: 5000000, rate: 0.30, label: '2,000,001–5,000,000' },
    { min: 5000000, max: Infinity, rate: 0.35, label: '>5,000,000' },
  ];

  let remaining = Math.max(0, netIncome);
  let totalTax = 0;
  const breakdown: any[] = [];

  for (const b of brackets) {
    if (remaining <= 0) break;
    const taxable = Math.min(remaining, b.max - b.min);
    const tax = taxable * b.rate;
    breakdown.push({ ...b, taxable, tax });
    totalTax += tax;
    remaining -= taxable;
  }

  return { brackets: breakdown, totalTax };
};

// GET /api/reports/summary — Dashboard overview (today, week, month)
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const firstDayOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

    const [todayOrders, monthRevenueRes, monthExpenseRes, topProductsRes] = await Promise.all([
      query(`SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue
              FROM orders WHERE DATE(created_at) = $1 AND status != 'cancelled'`, [todayStr]),
      query(`SELECT COALESCE(SUM(total), 0) as revenue FROM orders
              WHERE created_at >= $1 AND status != 'cancelled'`, [firstDayOfMonth]),
      query(`SELECT COALESCE(SUM(amount), 0) as total FROM expenses
              WHERE expense_date >= $1`, [firstDayOfMonth]),
      query(`SELECT oi.product_name_th, SUM(oi.quantity) as total_qty, SUM(oi.subtotal) as total_revenue
              FROM order_items oi
              JOIN orders o ON oi.order_id = o.id
              WHERE DATE(o.created_at) >= DATE_TRUNC('month', NOW())
              GROUP BY oi.product_name_th
              ORDER BY total_qty DESC LIMIT 5`),
    ]);

    const todayRevenue = Number(todayOrders.rows[0].revenue);
    const monthRevenue = Number(monthRevenueRes.rows[0].revenue);
    const monthExpenses = Number(monthExpenseRes.rows[0].total);
    const { vatAmount: todayVAT } = calcVAT(todayRevenue);

    res.json({
      today: {
        orders: Number(todayOrders.rows[0].count),
        revenue: todayRevenue,
        vat: todayVAT,
      },
      month: {
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
        vat: calcVAT(monthRevenue).vatAmount,
      },
      topProducts: topProductsRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

// GET /api/reports/daily?date=YYYY-MM-DD
router.get('/daily', async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

    const [ordersRes, itemsRes, expRes] = await Promise.all([
      query(`SELECT * FROM orders WHERE DATE(created_at) = $1 AND status != 'cancelled' ORDER BY created_at DESC`, [date]),
      query(`SELECT oi.product_name_th, oi.product_name_en, SUM(oi.quantity) as qty, SUM(oi.subtotal) as revenue
              FROM order_items oi JOIN orders o ON oi.order_id = o.id
              WHERE DATE(o.created_at) = $1
              GROUP BY oi.product_name_th, oi.product_name_en ORDER BY qty DESC`, [date]),
      query(`SELECT * FROM expenses WHERE expense_date = $1`, [date]),
    ]);

    const grossRevenue = ordersRes.rows.reduce((s: number, o: any) => s + Number(o.total), 0);
    const totalExpenses = expRes.rows.reduce((s: number, e: any) => s + Number(e.amount), 0);
    const { vatAmount } = calcVAT(grossRevenue);

    res.json({
      date,
      orders: ordersRes.rows,
      itemsSummary: itemsRes.rows,
      expenses: expRes.rows,
      financial: {
        grossRevenue,
        totalExpenses,
        vatAmount,
        netProfit: grossRevenue - totalExpenses,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch daily report' });
  }
});

// GET /api/reports/weekly — last 7 days chart data
router.get('/weekly', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total), 0) as revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '7 days' AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    const expResult = await query(`
      SELECT expense_date as date, COALESCE(SUM(amount), 0) as expenses
      FROM expenses
      WHERE expense_date >= NOW() - INTERVAL '7 days'
      GROUP BY expense_date ORDER BY date ASC
    `);

    // Merge into unified array
    const days: Record<string, any> = {};
    for (let row of result.rows) {
      const d = row.date.toISOString().split('T')[0];
      days[d] = { date: d, revenue: Number(row.revenue), orders: Number(row.orders), expenses: 0 };
    }
    for (let row of expResult.rows) {
      const d = row.date.toISOString().split('T')[0];
      if (!days[d]) days[d] = { date: d, revenue: 0, orders: 0, expenses: 0 };
      days[d].expenses = Number(row.expenses);
    }

    res.json(Object.values(days).sort((a, b) => a.date.localeCompare(b.date)));
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// GET /api/reports/monthly?year=2026&month=3
router.get('/monthly', async (req: Request, res: Response) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const month = req.query.month || (new Date().getMonth() + 1);

    const [revenueRes, expensesRes] = await Promise.all([
      query(`SELECT
               DATE(created_at) as date,
               COUNT(*) as orders,
               SUM(total) as revenue,
               SUM(discount_amount) as discounts,
               SUM(tip_amount) as tips
             FROM orders
             WHERE EXTRACT(YEAR FROM created_at) = $1
               AND EXTRACT(MONTH FROM created_at) = $2
               AND status != 'cancelled'
             GROUP BY DATE(created_at) ORDER BY date`, [year, month]),
      query(`SELECT expense_date as date, SUM(amount) as expenses
             FROM expenses
             WHERE EXTRACT(YEAR FROM expense_date) = $1 AND EXTRACT(MONTH FROM expense_date) = $2
             GROUP BY expense_date ORDER BY date`, [year, month]),
    ]);

    const dailyMap: Record<string, any> = {};
    for (const r of revenueRes.rows) {
      const d = r.date.toISOString().split('T')[0];
      dailyMap[d] = { date: d, revenue: Number(r.revenue), orders: Number(r.orders), expenses: 0 };
    }
    for (const e of expensesRes.rows) {
      const d = e.date.toISOString().split('T')[0];
      if (!dailyMap[d]) dailyMap[d] = { date: d, revenue: 0, orders: 0, expenses: 0 };
      dailyMap[d].expenses = Number(e.expenses);
    }

    const chartData = Object.values(dailyMap).sort((a: any, b: any) => a.date.localeCompare(b.date));
    const totalRevenue = chartData.reduce((s: number, d: any) => s + d.revenue, 0);
    const totalExpenses = chartData.reduce((s: number, d: any) => s + d.expenses, 0);
    const { vatAmount } = calcVAT(totalRevenue);

    res.json({
      year, month,
      chartData,
      summary: {
        totalRevenue,
        totalExpenses,
        grossProfit: totalRevenue - totalExpenses,
        vatAmount,
        netRevenue: totalRevenue - vatAmount, // Revenue before VAT for income tax
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// GET /api/reports/yearly?year=2026
router.get('/yearly', async (req: Request, res: Response) => {
  try {
    const year = req.query.year || new Date().getFullYear();

    const [revenueRes, expensesRes] = await Promise.all([
      query(`SELECT
               EXTRACT(MONTH FROM created_at) as month,
               SUM(total) as revenue,
               COUNT(*) as orders
             FROM orders
             WHERE EXTRACT(YEAR FROM created_at) = $1 AND status != 'cancelled'
             GROUP BY month ORDER BY month`, [year]),
      query(`SELECT
               EXTRACT(MONTH FROM expense_date) as month,
               SUM(amount) as expenses
             FROM expenses
             WHERE EXTRACT(YEAR FROM expense_date) = $1
             GROUP BY month ORDER BY month`, [year]),
    ]);

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      revenue: 0,
      orders: 0,
      expenses: 0,
      vat: 0,
      profit: 0,
    }));

    for (const r of revenueRes.rows) {
      const m = months[Number(r.month) - 1];
      m.revenue = Number(r.revenue);
      m.orders = Number(r.orders);
      m.vat = calcVAT(m.revenue).vatAmount;
    }
    for (const e of expensesRes.rows) {
      months[Number(e.month) - 1].expenses = Number(e.expenses);
    }
    for (const m of months) {
      m.profit = m.revenue - m.expenses;
    }

    const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
    const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);
    const netRevenue = totalRevenue - calcVAT(totalRevenue).vatAmount;
    const { brackets, totalTax } = estimateIncomeTax(netRevenue - totalExpenses);

    res.json({
      year,
      months,
      summary: {
        totalRevenue,
        totalExpenses,
        grossProfit: totalRevenue - totalExpenses,
        vatCollected: calcVAT(totalRevenue).vatAmount,
        netRevenue,
        netIncome: netRevenue - totalExpenses,
        estimatedIncomeTax: totalTax,
        taxBrackets: brackets,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// GET /api/reports/tax?year=2026&month=3 — Tax report for สรรพากร
router.get('/tax', async (req: Request, res: Response) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = req.query.month ? Number(req.query.month) : null;

    let revenueRes, expensesRes;
    if (month) {
      [revenueRes, expensesRes] = await Promise.all([
        query(`SELECT COALESCE(SUM(total), 0) as revenue FROM orders
               WHERE EXTRACT(YEAR FROM created_at) = $1
                 AND EXTRACT(MONTH FROM created_at) = $2 AND status != 'cancelled'`, [year, month]),
        query(`SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses
               WHERE EXTRACT(YEAR FROM expense_date) = $1
                 AND EXTRACT(MONTH FROM expense_date) = $2`, [year, month]),
      ]);
    } else {
      [revenueRes, expensesRes] = await Promise.all([
        query(`SELECT COALESCE(SUM(total), 0) as revenue FROM orders
               WHERE EXTRACT(YEAR FROM created_at) = $1 AND status != 'cancelled'`, [year]),
        query(`SELECT COALESCE(SUM(amount), 0) as expenses FROM expenses
               WHERE EXTRACT(YEAR FROM expense_date) = $1`, [year]),
      ]);
    }

    const grossRevenue = Number(revenueRes.rows[0].revenue);
    const totalExpenses = Number(expensesRes.rows[0].expenses);
    const { vatAmount, baseAmount } = calcVAT(grossRevenue);
    const netIncome = baseAmount - totalExpenses;
    const { brackets, totalTax } = estimateIncomeTax(netIncome);

    res.json({
      period: { year, month: month || 'full-year' },
      grossRevenue,
      totalExpenses,
      vatBreakdown: {
        output: vatAmount,
        input: 0, // TODO: ต้องคำนวณจาก expenses ที่มี VAT
        payable: vatAmount,
      },
      incomeBreakdown: {
        grossRevenue: baseAmount,            // รายได้ก่อน VAT
        deductibleExpenses: totalExpenses,
        netIncome,
        taxBrackets: brackets,
        estimatedIncomeTax: totalTax,
        effectiveRate: netIncome > 0 ? ((totalTax / netIncome) * 100).toFixed(2) + '%' : '0%',
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// GET /api/reports/menu-analytics?days=30 — Menu performance analytics
router.get('/menu-analytics', async (req: Request, res: Response) => {
  try {
    const days = Number(req.query.days) || 30;

    // 1. Overall ranking: which items sell best
    const rankingRes = await query(`
      SELECT 
        oi.product_name_th,
        oi.product_name_en,
        SUM(oi.quantity) as total_qty,
        SUM(oi.subtotal) as total_revenue,
        COUNT(DISTINCT oi.order_id) as order_count,
        ROUND(AVG(oi.unit_price)::numeric, 2) as avg_price
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at >= NOW() - INTERVAL '1 day' * $1
        AND o.status != 'cancelled'
      GROUP BY oi.product_name_th, oi.product_name_en
      ORDER BY total_qty DESC
    `, [days]);

    // 2. Daily trend per product (top 5 products)
    const top5Names = rankingRes.rows.slice(0, 5).map((r: any) => r.product_name_th);
    let dailyTrend: any[] = [];
    if (top5Names.length > 0) {
      const trendRes = await query(`
        SELECT 
          DATE(o.created_at) as date,
          oi.product_name_th,
          SUM(oi.quantity) as qty
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= NOW() - INTERVAL '1 day' * $1
          AND o.status != 'cancelled'
          AND oi.product_name_th = ANY($2)
        GROUP BY DATE(o.created_at), oi.product_name_th
        ORDER BY date ASC
      `, [days, top5Names]);
      dailyTrend = trendRes.rows;
    }

    // 3. Category breakdown
    const categoryRes = await query(`
      SELECT 
        c.name_th as category_name,
        SUM(oi.quantity) as total_qty,
        SUM(oi.subtotal) as total_revenue,
        COUNT(DISTINCT oi.product_name_th) as product_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE o.created_at >= NOW() - INTERVAL '1 day' * $1
        AND o.status != 'cancelled'
      GROUP BY c.name_th
      ORDER BY total_revenue DESC
    `, [days]);

    // 4. Summary stats
    const totalQty = rankingRes.rows.reduce((s: number, r: any) => s + Number(r.total_qty), 0);
    const totalRevenue = rankingRes.rows.reduce((s: number, r: any) => s + Number(r.total_revenue), 0);

    res.json({
      days,
      totalProducts: rankingRes.rows.length,
      totalItemsSold: totalQty,
      totalMenuRevenue: totalRevenue,
      ranking: rankingRes.rows,
      dailyTrend,
      categoryBreakdown: categoryRes.rows,
    });
  } catch (err) {
    console.error('menu-analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch menu analytics' });
  }
});

export default router;
