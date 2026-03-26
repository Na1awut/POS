import { useEffect, useState } from 'react';
import { adminFetch } from '../api/adminClient';

const formatTHB = (n: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n ?? 0);

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [form, setForm] = useState({ category_id: '', name_th: '', name_en: '', price: '', cost: '', description_th: '', description_en: '', image_url: '', is_active: true });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', e.target.files[0]);
    try {
      const token = localStorage.getItem('posplus_admin_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setForm(f => ({ ...f, image_url: data.imageUrl }));
    } catch (err) {
      alert('อัปโหลดล้มเหลว กรุณาลองใหม่');
    } finally {
      setUploading(false);
    }
  };

  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('/img')) return `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${url}`;
    return url;
  };

  const load = () => {
    setLoading(true);
    Promise.all([adminFetch('/products'), adminFetch('/categories')])
      .then(([p, c]) => { setProducts(p); setCategories(c); })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleOpen = (item?: any) => {
    if (item) {
      setForm({ category_id: item.category_id || '', name_th: item.name_th, name_en: item.name_en, price: item.price, cost: item.cost || '0', description_th: item.description_th || '', description_en: item.description_en || '', image_url: item.image_url || '', is_active: item.is_active });
      setEditItem(item);
    } else {
      setForm({ category_id: '', name_th: '', name_en: '', price: '', cost: '0', description_th: '', description_en: '', image_url: '', is_active: true });
      setEditItem(null);
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = { ...form, price: Number(form.price), cost: Number(form.cost), category_id: form.category_id ? Number(form.category_id) : null };
    if (editItem) {
      await adminFetch(`/products/${editItem.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await adminFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ลบสินค้านี้?')) return;
    await adminFetch(`/products/${id}`, { method: 'DELETE' });
    load();
  };

  const handleToggle = async (item: any) => {
    await adminFetch(`/products/${item.id}`, { method: 'PUT', body: JSON.stringify({ ...item, is_active: !item.is_active, category_id: item.category_id }) });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">🍽️ เมนู/สินค้า</h1>
        <button onClick={() => handleOpen()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium text-sm">+ เพิ่มสินค้า</button>
      </div>

      {loading ? <div className="text-gray-400 text-center py-10">กำลังโหลด...</div> : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">สินค้า</th>
                <th className="px-4 py-3 text-left">หมวดหมู่</th>
                <th className="px-4 py-3 text-right">ราคา</th>
                <th className="px-4 py-3 text-right">ต้นทุน</th>
                <th className="px-4 py-3 text-right">Margin</th>
                <th className="px-4 py-3 text-center">สถานะ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => {
                const margin = p.price > 0 ? ((p.price - p.cost) / p.price * 100).toFixed(1) : '—';
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.image_url && <img src={getImageUrl(p.image_url)} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                        <div>
                          <div className="font-medium text-gray-800">{p.name_th}</div>
                          <div className="text-xs text-gray-400">{p.name_en}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category_name || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatTHB(p.price)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{formatTHB(p.cost)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${Number(margin) >= 60 ? 'text-green-600' : Number(margin) >= 30 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {margin}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggle(p)} className={`px-2 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'เปิดขาย' : 'ปิด'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleOpen(p)} className="text-indigo-600 hover:text-indigo-800 text-xs">✏️ แก้ไข</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700 text-xs">🗑️ ลบ</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-bold">{editItem ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-indigo-400 focus:outline-none">
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name_th}</option>)}
                </select>
              </div>
              {[
                { key: 'name_th', label: 'ชื่อ (ภาษาไทย)' },
                { key: 'name_en', label: 'ชื่อ (English)' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-indigo-400 focus:outline-none" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย (฿)</label>
                  <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ต้นทุน (฿)</label>
                  <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              {form.price && form.cost && (
                <div className="bg-green-50 rounded-lg p-3 text-sm">
                  <span className="text-gray-600">Margin: </span>
                  <span className="font-bold text-green-700">{((Number(form.price) - Number(form.cost)) / Number(form.price) * 100).toFixed(1)}%</span>
                  <span className="text-gray-500 ml-2">(กำไร {formatTHB(Number(form.price) - Number(form.cost))} / ชิ้น)</span>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL / อัปโหลดรูปภาพ</label>
                <div className="flex gap-2">
                  <input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://... หรืออัปโหลดไฟล์" />
                  <label className={`bg-gray-100 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium flex items-center justify-center whitespace-nowrap ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-200'}`}>
                    {uploading ? 'กำลังอัปโหลด...' : '📁 อัปโหลด'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>
              </div>
              {[
                { key: 'description_th', label: 'คำอธิบาย (ไทย)' },
                { key: 'description_en', label: 'คำอธิบาย (English)' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <textarea value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 text-indigo-600" />
                <label htmlFor="is_active" className="text-sm text-gray-700">เปิดขาย</label>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">ยกเลิก</button>
              <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
