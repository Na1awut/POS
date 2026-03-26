import { useEffect, useState } from 'react';
import { adminFetch } from '../api/adminClient';

const formatTHB = (n: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n ?? 0);

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    adminFetch('/orders').then(setOrders).finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = filtered.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">🧾 ประวัติออเดอร์</h1>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="ค้นหาเลขที่ออเดอร์..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border rounded-xl px-4 py-2 text-sm focus:ring-indigo-400 focus:outline-none w-56"
          />
          <div className="text-sm text-gray-500 whitespace-nowrap">
            รวม <span className="font-bold text-green-700">{formatTHB(totalRevenue)}</span>
          </div>
        </div>
      </div>

      {loading ? <div className="text-center py-10 text-gray-400">กำลังโหลด...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">เลขที่</th>
                <th className="px-4 py-3 text-right">ยอดรวม</th>
                <th className="px-4 py-3 text-right">ส่วนลด</th>
                <th className="px-4 py-3 text-right">ทิป</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-left">วันที่/เวลา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-600">{o.order_number}</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">{formatTHB(Number(o.total))}</td>
                  <td className="px-4 py-3 text-right text-red-500">{Number(o.discount_amount) > 0 ? `-${formatTHB(Number(o.discount_amount))}` : '-'}</td>
                  <td className="px-4 py-3 text-right text-green-600">{Number(o.tip_amount) > 0 ? `+${formatTHB(Number(o.tip_amount))}` : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{o.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(o.created_at).toLocaleString('th-TH')}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">ไม่พบออเดอร์</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
