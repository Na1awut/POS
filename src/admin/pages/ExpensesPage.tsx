import { useEffect, useState } from 'react';
import { adminFetch } from '../api/adminClient';

const formatTHB = (n: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n ?? 0);

const today = () => new Date().toISOString().split('T')[0];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [filter, setFilter] = useState({ start_date: today().replace(/-\d+$/, '-01'), end_date: today() });
  const [form, setForm] = useState({ expense_category_id: '', description: '', amount: '', expense_date: today(), note: '' });

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ start_date: filter.start_date, end_date: filter.end_date });
    Promise.all([
      adminFetch(`/expenses?${params}`),
      adminFetch('/expenses/categories'),
    ]).then(([e, c]) => { setExpenses(e); setCategories(c); })
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const handleOpen = (item?: any) => {
    if (item) {
      setForm({ expense_category_id: item.expense_category_id || '', description: item.description, amount: item.amount, expense_date: item.expense_date.split('T')[0], note: item.note || '' });
      setEditItem(item);
    } else {
      setForm({ expense_category_id: categories[0]?.id || '', description: '', amount: '', expense_date: today(), note: '' });
      setEditItem(null);
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = { ...form, amount: Number(form.amount), expense_category_id: form.expense_category_id || null };
    if (editItem) {
      await adminFetch(`/expenses/${editItem.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await adminFetch('/expenses', { method: 'POST', body: JSON.stringify(payload) });
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ลบรายการนี้?')) return;
    await adminFetch(`/expenses/${id}`, { method: 'DELETE' });
    load();
  };

  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-800">💸 ค่าใช้จ่าย (วัตถุดิบ)</h1>
        <button onClick={() => handleOpen()} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-medium text-sm">+ บันทึกค่าใช้จ่าย</button>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">ตั้งแต่วันที่</label>
          <input type="date" value={filter.start_date} onChange={e => setFilter(f => ({ ...f, start_date: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">ถึงวันที่</label>
          <input type="date" value={filter.end_date} onChange={e => setFilter(f => ({ ...f, end_date: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs text-gray-400">รวมทั้งหมด</div>
          <div className="text-xl font-bold text-orange-600">{formatTHB(totalAmount)}</div>
        </div>
      </div>

      {loading ? <div className="text-gray-400 text-center py-10">กำลังโหลด...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">วันที่</th>
                <th className="px-4 py-3 text-left">หมวดหมู่</th>
                <th className="px-4 py-3 text-left">รายการ</th>
                <th className="px-4 py-3 text-right">จำนวนเงิน</th>
                <th className="px-4 py-3 text-left">หมายเหตุ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(e.expense_date).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: e.category_color + '20', color: e.category_color }}>
                      {e.category_name || 'ทั่วไป'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">{e.description}</td>
                  <td className="px-4 py-3 text-right font-bold text-orange-600">{formatTHB(Number(e.amount))}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{e.note || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleOpen(e)} className="text-indigo-600 hover:text-indigo-800 text-xs">✏️</button>
                      <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 text-xs">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">ไม่มีรายการ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b flex justify-between"><h2 className="text-lg font-bold">{editItem ? 'แก้ไขค่าใช้จ่าย' : 'บันทึกค่าใช้จ่าย'}</h2><button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700">✕</button></div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                <select value={form.expense_category_id} onChange={e => setForm(f => ({ ...f, expense_category_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                <input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="เช่น ซื้อเมล็ดกาแฟ 5 กก." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนเงิน (฿)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ</label>
                <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">ยกเลิก</button>
              <button onClick={handleSave} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
