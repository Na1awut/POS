import { useEffect, useState } from 'react';
import { adminFetch } from '../../api/adminClient';

const formatTHB = (n: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n ?? 0);

const today = () => new Date().toISOString().split('T')[0];

export default function DailyReport() {
  const [date, setDate] = useState(today());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminFetch(`/reports/daily?date=${date}`).then(setData).finally(() => setLoading(false));
  };

  useEffect(load, [date]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📅 รายงานรายวัน</h1>
        <div className="flex gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded-lg px-3 py-2 text-sm" />
          <button onClick={load} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">แสดง</button>
        </div>
      </div>

      {loading ? <div className="text-center py-10 text-gray-400">กำลังโหลด...</div> : data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'จำนวนออเดอร์', value: `${data.orders.length} รายการ`, color: 'border-blue-500' },
              { label: 'รายได้รวม', value: formatTHB(data.financial.grossRevenue), color: 'border-green-500' },
              { label: 'ค่าใช้จ่าย', value: formatTHB(data.financial.totalExpenses), color: 'border-orange-500' },
              { label: 'กำไรสุทธิ', value: formatTHB(data.financial.netProfit), color: data.financial.netProfit >= 0 ? 'border-emerald-500' : 'border-red-500' },
            ].map(c => (
              <div key={c.label} className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${c.color}`}>
                <div className="text-xs text-gray-500">{c.label}</div>
                <div className="text-xl font-bold text-gray-800 mt-1">{c.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center justify-between">
            <span className="text-purple-700 text-sm font-medium">🏛️ VAT วันนี้ (ต้องส่งสรรพากร)</span>
            <span className="text-purple-700 font-bold text-lg">{formatTHB(data.financial.vatAmount)}</span>
          </div>

          {/* Items sold today */}
          {data.itemsSummary.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b font-semibold text-gray-700">สินค้าที่ขายวันนี้</div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-2 text-left">สินค้า</th>
                    <th className="px-4 py-2 text-right">จำนวน</th>
                    <th className="px-4 py-2 text-right">รายได้</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.itemsSummary.map((item: any) => (
                    <tr key={item.product_name_th}><td className="px-4 py-2 font-medium">{item.product_name_th}</td><td className="px-4 py-2 text-right">{item.qty}</td><td className="px-4 py-2 text-right font-semibold text-green-700">{formatTHB(Number(item.revenue))}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Orders list */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold text-gray-700">รายการออเดอร์วันนี้ ({data.orders.length})</div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-2 text-left">เลขที่</th>
                  <th className="px-4 py-2 text-right">ยอดรวม</th>
                  <th className="px-4 py-2 text-right">ส่วนลด</th>
                  <th className="px-4 py-2 text-right">ทิป</th>
                  <th className="px-4 py-2 text-left">เวลา</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.orders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono text-xs text-indigo-600">{o.order_number}</td>
                    <td className="px-4 py-2 text-right font-bold">{formatTHB(Number(o.total))}</td>
                    <td className="px-4 py-2 text-right text-red-500">{o.discount_amount > 0 ? `-${formatTHB(Number(o.discount_amount))}` : '-'}</td>
                    <td className="px-4 py-2 text-right text-green-600">{o.tip_amount > 0 ? `+${formatTHB(Number(o.tip_amount))}` : '-'}</td>
                    <td className="px-4 py-2 text-gray-400">{new Date(o.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
                {data.orders.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-gray-400">ไม่มีออเดอร์วันนี้</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
