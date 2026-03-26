import { useState } from 'react';
import { Navigate, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../api/adminClient';

const NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'ภาพรวม', icon: '📊' },
  { path: '/admin/products', label: 'เมนู/สินค้า', icon: '🍽️' },
  { path: '/admin/categories', label: 'หมวดหมู่', icon: '📁' },
  { path: '/admin/orders', label: 'ออเดอร์', icon: '🧾' },
  { path: '/admin/expenses', label: 'ค่าใช้จ่าย', icon: '💸' },
  { path: '/admin/reports/daily', label: 'รายงานรายวัน', icon: '📅' },
  { path: '/admin/reports/monthly', label: 'รายงานรายเดือน', icon: '📆' },
  { path: '/admin/reports/yearly', label: 'รายงานรายปี', icon: '🗓️' },
  { path: '/admin/tax', label: 'ภาษี/สรรพากร', icon: '🏛️' },
];

export function ProtectedRoute() {
  if (!isAuthenticated()) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('posplus_admin_token');
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} bg-gray-900 text-white flex flex-col transition-all duration-300 flex-shrink-0`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {!collapsed && (
            <div>
              <div className="text-lg font-bold text-white">POS+ Admin</div>
              <div className="text-xs text-gray-400">ระบบจัดการร้านคาเฟ่</div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} className="text-gray-400 hover:text-white p-1 rounded">
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-700 p-4">
          {!collapsed && <div className="text-xs text-gray-500 mb-2">เข้าสู่ระบบแล้ว</div>}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm w-full"
          >
            <span>🚪</span>
            {!collapsed && 'ออกจากระบบ'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar with link to POS */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="text-sm text-gray-500">
            {NAV_ITEMS.find(n => n.path === location.pathname)?.label || 'Admin'}
          </div>
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1">
            ↩ กลับไปที่หน้า POS
          </Link>
        </div>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
