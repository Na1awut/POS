import { useEffect, useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { adminFetch } from '../../api/adminClient';

const formatTHB = (n: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n ?? 0);

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function YearlyReport() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const load = () => {
    setLoading(true);
    adminFetch(`/reports/yearly?year=${year}`).then(setData).finally(() => setLoading(false));
  };

  useEffect(load, [year]);

  const chartData = data?.months?.map((m: any) => ({
    name: MONTHS_TH[m.month - 1],
    revenue: m.revenue,
    expenses: m.expenses,
    profit: m.profit,
    vat: m.vat,
  })) || [];

  const handleAiSummary = async () => {
    if (!data) return;
    setAiLoading(true);
    setAiSummary('');
    try {
      const res = await adminFetch('/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({
          period: `ปี ${year + 543}`,
          reportData: {
            ...data.summary,
            topProducts: [],
          },
        }),
      });
      setAiSummary(res.summary);
    } catch {
      setAiSummary('❌ ไม่สามารถเชื่อมต่อ Groq AI ได้');
    } finally {
      setAiLoading(false);
    }
  };

  // Export to CSV
  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ['เดือน', 'รายได้', 'ค่าใช้จ่าย', 'กำไรขั้นต้น', 'VAT'],
      ...data.months.map((m: any) => [MONTHS_TH[m.month - 1], m.revenue, m.expenses, m.profit, m.vat.toFixed(2)]),
      ['รวม', data.summary.totalRevenue, data.summary.totalExpenses, data.summary.grossProfit, data.summary.vatCollected.toFixed(2)],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `report_${year}.csv`; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🗓️ รายงานรายปี</h1>
        <div className="flex gap-3 items-center">
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm w-24" />
          <button onClick={load} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">แสดง</button>
          <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">📥 Export CSV</button>
        </div>
      </div>

      {loading ? <div className="text-center py-20 text-gray-400">กำลังโหลด...</div> : data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'รายได้รวมทั้งปี', value: formatTHB(data.summary.totalRevenue), color: 'border-green-500' },
              { label: 'ค่าใช้จ่ายทั้งปี', value: formatTHB(data.summary.totalExpenses), color: 'border-orange-500' },
              { label: 'กำไรสุทธิ', value: formatTHB(data.summary.grossProfit), color: data.summary.grossProfit >= 0 ? 'border-emerald-500' : 'border-red-500' },
              { label: 'รายได้สุทธิ (ก่อน VAT)', value: formatTHB(data.summary.netRevenue), color: 'border-blue-500' },
            ].map(c => (
              <div key={c.label} className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${c.color}`}>
                <div className="text-xs text-gray-500">{c.label}</div>
                <div className="text-xl font-bold text-gray-800 mt-1">{c.value}</div>
              </div>
            ))}
          </div>

          {/* Annual Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">รายได้รายเดือน ปี {year + 543}</h2>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any, name: any) => [formatTHB(v), { revenue: 'รายได้', expenses: 'ค่าใช้จ่าย', profit: 'กำไร', vat: 'VAT' }[name as string] || name]} />
                <Legend formatter={(v: any) => ({ revenue: 'รายได้', expenses: 'ค่าใช้จ่าย', profit: 'กำไร', vat: 'VAT' }[v as string] || v)} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" fill="#f97316" radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Tax Summary — สรรพากร */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-amber-800 mb-4">🏛️ สรุปภาษี ปี {year + 543} (สำหรับยื่นสรรพากร)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-600">รายได้รวมทั้งปี</span><span className="font-bold">{formatTHB(data.summary.totalRevenue)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">VAT ที่เก็บจากลูกค้า</span><span className="font-bold text-purple-600">- {formatTHB(data.summary.vatCollected)}</span></div>
                <div className="flex justify-between text-sm border-t pt-2"><span className="text-gray-700 font-medium">รายได้ก่อน VAT (ฐานภาษีเงินได้)</span><span className="font-bold">{formatTHB(data.summary.netRevenue)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">ค่าใช้จ่ายที่หักได้</span><span className="font-bold text-orange-600">- {formatTHB(data.summary.totalExpenses)}</span></div>
                <div className="flex justify-between text-sm border-t pt-2"><span className="text-gray-700 font-bold">รายได้สุทธิ (คำนวณภาษี)</span><span className="font-bold text-lg">{formatTHB(data.summary.netIncome)}</span></div>
              </div>
              <div>
                <div className="bg-white rounded-xl p-4">
                  <div className="text-sm font-semibold text-gray-700 mb-3">อัตราภาษีเงินได้บุคคลธรรมดา (ขั้นบันได)</div>
                  {data.summary.taxBrackets?.filter((b: any) => b.taxable > 0).map((b: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs text-gray-600 py-1 border-b border-gray-100 last:border-0">
                      <span>{b.label} ({(b.rate * 100).toFixed(0)}%)</span>
                      <span className="font-medium">{formatTHB(b.tax)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t text-red-700">
                    <span>ภาษีเงินได้โดยประมาณ</span>
                    <span>{formatTHB(data.summary.estimatedIncomeTax)}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">* เป็นค่าประมาณเบื้องต้น ควรปรึกษานักบัญชีก่อนยื่นจริง</div>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly table */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b"><h2 className="font-semibold text-gray-700">ตารางรายเดือน</h2></div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">เดือน</th>
                  <th className="px-4 py-3 text-right">รายได้</th>
                  <th className="px-4 py-3 text-right">ค่าใช้จ่าย</th>
                  <th className="px-4 py-3 text-right">กำไร</th>
                  <th className="px-4 py-3 text-right">VAT</th>
                  <th className="px-4 py-3 text-right">จำนวนออเดอร์</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.months.map((m: any) => (
                  <tr key={m.month} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{MONTHS_TH[m.month - 1]} {year + 543}</td>
                    <td className="px-4 py-3 text-right text-green-700 font-semibold">{formatTHB(m.revenue)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{formatTHB(m.expenses)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${m.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatTHB(m.profit)}</td>
                    <td className="px-4 py-3 text-right text-purple-600">{formatTHB(m.vat)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{m.orders}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">🤖 AI วิเคราะห์ประจำปี</h2>
              <button onClick={handleAiSummary} disabled={aiLoading} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
                {aiLoading ? '⏳ กำลังวิเคราะห์...' : '✨ สรุปด้วย AI'}
              </button>
            </div>
            {aiSummary ? (
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{aiSummary}</div>
            ) : (
              <div className="text-gray-400 text-sm text-center py-6 bg-gray-50 rounded-xl">กด "สรุปด้วย AI" เพื่อรับคำแนะนำประจำปี</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
