import { useEffect, useState } from 'react';
import {
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Line, Legend, ComposedChart,
} from 'recharts';
import { adminFetch } from '../../api/adminClient';

const formatTHB = (n: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n ?? 0);

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function MonthlyReport() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  const load = () => {
    setLoading(true);
    adminFetch(`/reports/monthly?year=${year}&month=${month}`)
      .then(d => setData(d))
      .finally(() => setLoading(false));
  };

  useEffect(load, [year, month]);

  const handleAiSummary = async () => {
    if (!data) return;
    setAiLoading(true);
    setAiSummary('');
    try {
      const res = await adminFetch('/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({
          period: `เดือน ${MONTHS_TH[month - 1]} ${year + 543}`,
          reportData: {
            ...data.summary,
            topProducts: [],
            chartData: data.chartData,
          },
        }),
      });
      setAiSummary(res.summary);
    } catch (e: any) {
      setAiSummary('❌ ไม่สามารถเชื่อมต่อ Groq AI ได้ กรุณาตรวจสอบ GROQ_API_KEY');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📆 รายงานรายเดือน</h1>
        <div className="flex gap-3 items-center">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm">
            {MONTHS_TH.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm w-24" />
          <button onClick={load} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">แสดง</button>
        </div>
      </div>

      {loading ? <div className="text-gray-400 text-center py-20">กำลังโหลด...</div> : data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'รายได้รวม', value: formatTHB(data.summary.totalRevenue), color: 'border-l-4 border-green-500', sub: 'ก่อนหักค่าใช้จ่าย' },
              { label: 'ค่าใช้จ่าย', value: formatTHB(data.summary.totalExpenses), color: 'border-l-4 border-orange-500', sub: 'ต้นทุนวัตถุดิบ' },
              { label: 'กำไรขั้นต้น', value: formatTHB(data.summary.grossProfit), color: `border-l-4 ${data.summary.grossProfit >= 0 ? 'border-emerald-500' : 'border-red-500'}`, sub: data.summary.grossProfit >= 0 ? '✅ กำไร' : '❌ ขาดทุน' },
              { label: 'VAT ต้องส่ง', value: formatTHB(data.summary.vatAmount), color: 'border-l-4 border-purple-500', sub: '7% (ส่งสรรพากร)' },
            ].map(c => (
              <div key={c.label} className={`bg-white rounded-2xl p-5 shadow-sm ${c.color}`}>
                <div className="text-xs text-gray-500 font-medium">{c.label}</div>
                <div className="text-xl font-bold text-gray-800 mt-1">{c.value}</div>
                <div className="text-xs text-gray-400 mt-1">{c.sub}</div>
              </div>
            ))}
          </div>

          {/* Daily chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">รายได้รายวัน — {MONTHS_TH[month - 1]} {year + 543}</h2>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tickFormatter={d => new Date(d).getDate().toString()} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `฿${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any, name: any) => [formatTHB(v), name === 'revenue' ? 'รายได้' : name === 'expenses' ? 'ค่าใช้จ่าย' : 'กำไร']} labelFormatter={(l: any) => `วันที่ ${new Date(l).toLocaleDateString('th-TH')}`} />
                <Legend formatter={v => v === 'revenue' ? 'รายได้' : v === 'expenses' ? 'ค่าใช้จ่าย' : 'กำไร'} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expenses" fill="#f97316" radius={[3, 3, 0, 0]} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* VAT breakdown */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-purple-700 mb-4">🏛️ สรุปภาษีมูลค่าเพิ่ม (VAT) เดือนนี้</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-xl p-4">
                <div className="text-gray-500">รายได้รวม (รวม VAT แล้ว)</div>
                <div className="text-xl font-bold text-gray-800 mt-1">{formatTHB(data.summary.totalRevenue)}</div>
              </div>
              <div className="bg-white rounded-xl p-4">
                <div className="text-gray-500">รายได้ก่อน VAT (ฐานภาษี)</div>
                <div className="text-xl font-bold text-gray-800 mt-1">{formatTHB(data.summary.netRevenue)}</div>
              </div>
              <div className="bg-purple-100 rounded-xl p-4">
                <div className="text-purple-700 font-medium">VAT 7% ที่ต้องนำส่ง</div>
                <div className="text-2xl font-black text-purple-700 mt-1">{formatTHB(data.summary.vatAmount)}</div>
              </div>
            </div>
          </div>

          {/* AI Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-700">🤖 AI วิเคราะห์ธุรกิจ (Groq AI)</h2>
              <button
                onClick={handleAiSummary}
                disabled={aiLoading}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold"
              >
                {aiLoading ? '⏳ กำลังวิเคราะห์...' : '✨ สรุปด้วย AI'}
              </button>
            </div>
            {aiSummary ? (
              <div className="prose prose-sm max-w-none bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {aiSummary}
              </div>
            ) : (
              <div className="text-gray-400 text-sm text-center py-6 bg-gray-50 rounded-xl">
                กด "สรุปด้วย AI" เพื่อให้ AI วิเคราะห์ผลการดำเนินงาน, แนะนำเมนู, จัดการวัตถุดิบ และวางแผนภาษี
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
