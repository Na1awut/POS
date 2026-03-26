import { useEffect, useState } from 'react';
import { adminFetch } from '../../api/adminClient';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, PieChart, Pie, Cell, Legend,
} from 'recharts';

const formatTHB = (n: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n ?? 0);

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const MEDAL = ['🥇', '🥈', '🥉'];

export default function MenuAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const load = () => {
    setLoading(true);
    adminFetch(`/reports/menu-analytics?days=${days}`)
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(load, [days]);

  const handleAiAnalysis = async () => {
    if (!data) return;
    setAiLoading(true);
    setAiSummary('');
    try {
      const res = await adminFetch('/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({
          period: `${days} วันล่าสุด`,
          reportData: {
            totalRevenue: data.totalMenuRevenue,
            totalExpenses: 0,
            grossProfit: data.totalMenuRevenue,
            vatCollected: 0,
            estimatedIncomeTax: 0,
            topProducts: data.ranking.slice(0, 10).map((r: any) => ({
              name: r.product_name_th,
              qty: Number(r.total_qty),
              revenue: Number(r.total_revenue),
              avgPrice: Number(r.avg_price),
              orderCount: Number(r.order_count),
            })),
            categoryBreakdown: data.categoryBreakdown,
          },
        }),
      });
      setAiSummary(res.summary);
    } catch {
      setAiSummary('❌ ไม่สามารถเชื่อมต่อ AI ได้');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📈 วิเคราะห์เมนู</h1>
        <div className="flex gap-2">
          {[7, 14, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                days === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {d} วัน
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">กำลังโหลด...</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-indigo-500">
              <div className="text-xs text-gray-500">เมนูทั้งหมดที่ขาย</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{data.totalProducts} เมนู</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-green-500">
              <div className="text-xs text-gray-500">ชิ้นที่ขายได้</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{data.totalItemsSold} ชิ้น</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-amber-500">
              <div className="text-xs text-gray-500">รายได้จากเมนู</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{formatTHB(data.totalMenuRevenue)}</div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-purple-500">
              <div className="text-xs text-gray-500">เฉลี่ยต่อเมนู</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {data.totalProducts > 0 ? formatTHB(data.totalMenuRevenue / data.totalProducts) : '฿0'}
              </div>
            </div>
          </div>

          {/* Ranking + Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ranking Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b font-semibold text-gray-700 flex items-center gap-2">
                🏆 อันดับเมนูขายดี ({days} วัน)
              </div>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">เมนู</th>
                      <th className="px-4 py-2 text-right">จำนวน</th>
                      <th className="px-4 py-2 text-right">รายได้</th>
                      <th className="px-4 py-2 text-right">ออเดอร์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.ranking.map((item: any, i: number) => {
                      const pct = data.totalItemsSold > 0
                        ? ((Number(item.total_qty) / data.totalItemsSold) * 100).toFixed(1)
                        : '0';
                      return (
                        <tr key={item.product_name_th} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-bold text-lg">
                            {i < 3 ? MEDAL[i] : <span className="text-gray-400 text-sm">{i + 1}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800">{item.product_name_th}</div>
                            <div className="text-xs text-gray-400">{item.product_name_en}</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-indigo-600">{Number(item.total_qty)}</span>
                            <span className="text-xs text-gray-400 ml-1">({pct}%)</span>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-green-700">
                            {formatTHB(Number(item.total_revenue))}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-500">{Number(item.order_count)}</td>
                        </tr>
                      );
                    })}
                    {data.ranking.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-8 text-gray-400">ยังไม่มีข้อมูลการขาย</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Pie Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">🥧 สัดส่วนรายได้ตามหมวดหมู่</h2>
              {data.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown.map((c: any) => ({
                        name: c.category_name,
                        value: Number(c.total_revenue),
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.categoryBreakdown.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: any) => formatTHB(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16 text-gray-400">ยังไม่มีข้อมูล</div>
              )}
            </div>
          </div>

          {/* Revenue Bar Chart */}
          {data.ranking.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">💰 รายได้แต่ละเมนู (Top 10)</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={data.ranking.slice(0, 10).map((r: any) => ({
                    name: r.product_name_th.length > 12 ? r.product_name_th.slice(0, 12) + '…' : r.product_name_th,
                    revenue: Number(r.total_revenue),
                    qty: Number(r.total_qty),
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => formatTHB(v)} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* AI Analysis */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">🤖 AI วิเคราะห์เมนู</h2>
              <button
                onClick={handleAiAnalysis}
                disabled={aiLoading}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold"
              >
                {aiLoading ? '⏳ กำลังวิเคราะห์...' : '✨ วิเคราะห์เมนูด้วย AI'}
              </button>
            </div>
            {aiSummary ? (
              <div className="prose prose-sm max-w-none bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {aiSummary}
              </div>
            ) : (
              <div className="text-gray-400 text-sm text-center py-6 bg-gray-50 rounded-xl">
                กด "วิเคราะห์เมนูด้วย AI" เพื่อให้ AI แนะนำว่าเมนูไหนควรโปรโมท เมนูไหนควรปรับปรุง
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
