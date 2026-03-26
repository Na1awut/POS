import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout, ProtectedRoute } from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import OrdersPage from './pages/OrdersPage';
import ExpensesPage from './pages/ExpensesPage';
import DailyReport from './pages/reports/DailyReport';
import MonthlyReport from './pages/reports/MonthlyReport';
import YearlyReport from './pages/reports/YearlyReport';
import TaxPage from './pages/TaxPage';

export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="reports/daily" element={<DailyReport />} />
          <Route path="reports/monthly" element={<MonthlyReport />} />
          <Route path="reports/yearly" element={<YearlyReport />} />
          <Route path="tax" element={<TaxPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
