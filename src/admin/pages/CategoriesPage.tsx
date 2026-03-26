import { useEffect, useState } from 'react';
import { adminFetch } from '../api/adminClient';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({ key: '', name_th: '', name_en: '', sort_order: 0 });

  const load = () => {
    setLoading(true);
    adminFetch('/categories').then(setCategories).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleOpen = (item?: any) => {
    if (item) { setForm({ key: item.key, name_th: item.name_th, name_en: item.name_en, sort_order: item.sort_order }); setEditItem(item); }
    else { setForm({ key: '', name_th: '', name_en: '', sort_order: 0 }); setEditItem(null); }
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = { ...form, sort_order: Number(form.sort_order) };
    if (editItem) { await adminFetch(`/categories/${editItem.id}`, { method: 'PUT', body: JSON.stringify(payload) }); }
    else { await adminFetch('/categories', { method: 'POST', body: JSON.stringify(payload) }); }
    setShowForm(false); load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ลบหมวดหมู่นี้? (สินค้าในหมวดหมู่นี้จะถูกย้ายออก)')) return;
    await adminFetch(`/categories/${id}`, { method: 'DELETE' }); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">📁 หมวดหมู่</h1>
        <button onClick={() => handleOpen()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm">+ เพิ่มหมวดหมู่</button>
      </div>
      {loading ? <div className="text-gray-400 text-center py-10">กำลังโหลด...</div> : (
        <div className="grid gap-3">
          {categories.map(c => (
            <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-800">{c.name_th}</span>
                <span className="text-gray-400 ml-2 text-sm">/ {c.name_en}</span>
                <span className="ml-3 text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">key: {c.key}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleOpen(c)} className="text-indigo-600 hover:text-indigo-800 text-sm">✏️ แก้ไข</button>
                <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-sm">🗑️ ลบ</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-4 border-b flex justify-between"><h2 className="text-lg font-bold">{editItem ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</h2><button onClick={() => setShowForm(false)} className="text-gray-400">✕</button></div>
            <div className="p-6 space-y-4">
              {!editItem && <div><label className="block text-sm font-medium text-gray-700 mb-1">Key (ไม่ซ้ำ เช่น coffee, food)</label><input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm font-mono" /></div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">ชื่อภาษาไทย</label><input value={form.name_th} onChange={e => setForm(f => ({ ...f, name_th: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">ชื่อภาษาอังกฤษ</label><input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">ลำดับ</label><input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} className="w-full border rounded-lg px-3 py-2 text-sm" /></div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">ยกเลิก</button>
              <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
