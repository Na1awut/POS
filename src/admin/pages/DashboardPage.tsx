import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminFetch } from '../api/adminClient';

const formatTHB = (n: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n ?? 0);

const StatCard = ({ icon, label, value, sub, color }: any) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${color}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
      </div>
      <span className="text-3xl">{icon}</span>
    </div>
  </div>
);

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [weekly, setWeekly] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([adminFetch('/reports/summary'), adminFetch('/reports/weekly')])
      .then(([s, w]) => { setSummary(s); setWeekly(w); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">⏳ กำลังโหลด...</div>;
  if (error) return <div className="bg-red-50 text-red-600 p-4 rounded-xl">⚠️ {error}</div>;

  const profit = (summary?.month?.revenue ?? 0) - (summary?.month?.expenses ?? 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📊 ภาพรวมร้าน</h1>
        <span className="text-sm text-gray-400">{new Date().toLocaleDateString('th-TH', { dateStyle: 'full' })}</span>
      </div>

      {/* KPI Cards — Today */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">วันนี้</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="🧾" label="ออเดอร์วันนี้" value={summary?.today?.orders ?? 0} sub="รายการ" color="border-blue-500" />
          <StatCard icon="💰" label="รายได้วันนี้" value={formatTHB(summary?.today?.revenue ?? 0)} color="border-green-500" />
          <StatCard icon="🏛️" label="VAT (วันนี้)" value={formatTHB(summary?.today?.vat ?? 0)} sub="7% รวมในราคาแล้ว" color="border-yellow-500" />
          <StatCard icon="📈" label="รายได้ก่อน VAT" value={formatTHB((summary?.today?.revenue ?? 0) - (summary?.today?.vat ?? 0))} color="border-indigo-500" />
        </div>
      </div>

      {/* KPI Cards — Month */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">เดือนนี้</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="💵" label="รายได้รวม" value={formatTHB(summary?.month?.revenue ?? 0)} color="border-green-400" />
          <StatCard icon="💸" label="ค่าใช้จ่ายรวม" value={formatTHB(summary?.month?.expenses ?? 0)} color="border-red-400" />
          <StatCard icon="📊" label="กำไรขั้นต้น" value={formatTHB(profit)} sub={profit >= 0 ? '✅ กำไร' : '❌ ขาดทุน'} color={profit >= 0 ? 'border-emerald-500' : 'border-red-600'} />
          <StatCard icon="🏛️" label="VAT เดือนนี้" value={formatTHB(summary?.month?.vat ?? 0)} sub="ต้องส่งสรรพากร" color="border-purple-500" />
        </div>
      </div>

      {/* Weekly Revenue Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">📈 รายได้ / ค่าใช้จ่าย 7 วันที่ผ่านมา</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={weekly} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })} tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `฿${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={(v: any, name: any) => [formatTHB(Number(v)), name === 'revenue' ? 'รายได้' : 'ค่าใช้จ่าย']}
              labelFormatter={(l: any) => new Date(l).toLocaleDateString('th-TH', { dateStyle: 'long' })}
            />
            <Legend formatter={(v) => v === 'revenue' ? 'รายได้' : 'ค่าใช้จ่าย'} />
            <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products */}
      {summary?.topProducts?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">🏆 สินค้าขายดีเดือนนี้</h2>
          <div className="space-y-3">
            {summary.topProducts.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-300">#{i + 1}</span>
                  <span className="font-medium text-gray-700">{p.product_name_th}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-indigo-600">{Number(p.total_qty).toLocaleString()} ชิ้น</div>
                  <div className="text-sm text-gray-400">{formatTHB(Number(p.total_revenue))}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { to: '/admin/expenses', label: '➕ บันทึกค่าใช้จ่าย', color: 'bg-orange-50 hover:bg-orange-100 text-orange-700' },
          { to: '/admin/reports/monthly', label: '📆 รายงานเดือนนี้', color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700' },
          { to: '/admin/tax', label: '🏛️ คำนวณภาษี', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
          { to: '/admin/products', label: '🍽️ จัดการเมนู', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
        ].map(l => (
          <Link key={l.to} to={l.to} className={`${l.color} rounded-xl p-4 text-center font-semibold text-sm transition-colors`}>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
