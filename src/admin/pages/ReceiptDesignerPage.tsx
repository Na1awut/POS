/**
 * ReceiptDesignerPage — Full receipt template designer with drag-and-drop blocks
 * Located at /admin/receipt-designer
 */
import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '../api/adminClient';
import ReceiptPreview from '../components/ReceiptPreview';
import type { ReceiptBlock } from '../../utils/receiptPrinter';

interface ReceiptTemplateData {
  id: number | null;
  name: string;
  is_active: boolean;
  paper_width: string;
  template_data: { blocks: ReceiptBlock[] };
}

// ── Block palette (what can be added) ──
const BLOCK_PALETTE: { type: ReceiptBlock['type']; label: string; icon: string; defaultBlock: Partial<ReceiptBlock> }[] = [
  { type: 'text', label: 'ข้อความ', icon: '📝', defaultBlock: { content: 'ข้อความใหม่', align: 'center', bold: false, fontSize: 'normal' } },
  { type: 'divider', label: 'เส้นคั่น', icon: '➖', defaultBlock: { style: 'dashed' } },
  { type: 'order-info', label: 'ข้อมูลออเดอร์', icon: '📋', defaultBlock: { showDate: true, showTime: true, showOrderNumber: true, showCashier: false } },
  { type: 'items-table', label: 'ตารางรายการ', icon: '📦', defaultBlock: { showQuantity: true, showUnitPrice: true, showSubtotal: true } },
  { type: 'totals', label: 'สรุปยอดเงิน', icon: '💰', defaultBlock: { showSubtotal: true, showDiscount: true, showTip: true, showVAT: false, showTotal: true } },
  { type: 'qrcode', label: 'QR Code', icon: '▣', defaultBlock: { qrType: 'promptpay', promptpayId: '', url: '', customText: '', size: 'medium', label: 'สแกนจ่ายที่นี่', showAmount: true } },
  { type: 'spacer', label: 'เว้นบรรทัด', icon: '↕️', defaultBlock: { lines: 2 } },
];

function generateId() {
  return `block-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

export default function ReceiptDesignerPage() {
  const [templates, setTemplates] = useState<ReceiptTemplateData[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<ReceiptTemplateData | null>(null);
  const [blocks, setBlocks] = useState<ReceiptBlock[]>([]);
  const [name, setName] = useState('');
  const [paperWidth, setPaperWidth] = useState('58');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load templates on mount
  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    try {
      const data = await adminFetch('/receipt/templates');
      setTemplates(data);
      // Load active or first template
      if (data.length > 0) {
        const active = data.find((t: ReceiptTemplateData) => t.is_active) || data[0];
        selectTemplate(active);
      } else {
        // Create new with defaults
        newTemplate();
      }
    } catch {
      newTemplate();
    }
  };

  const selectTemplate = (tmpl: ReceiptTemplateData) => {
    setCurrentTemplate(tmpl);
    setName(tmpl.name);
    setPaperWidth(tmpl.paper_width || '58');
    const data = typeof tmpl.template_data === 'string' ? JSON.parse(tmpl.template_data) : tmpl.template_data;
    setBlocks(data?.blocks || []);
    setSelectedBlockId(null);
  };

  const newTemplate = () => {
    // Default blocks
    const defaultBlocks: ReceiptBlock[] = [
      { id: generateId(), type: 'text', content: '☕ Coffee View', align: 'center', bold: true, fontSize: 'large' },
      { id: generateId(), type: 'text', content: 'ที่อยู่ร้านค้า', align: 'center', fontSize: 'small' },
      { id: generateId(), type: 'divider', style: 'dashed' },
      { id: generateId(), type: 'order-info', showDate: true, showTime: true, showOrderNumber: true, showCashier: false },
      { id: generateId(), type: 'divider', style: 'dashed' },
      { id: generateId(), type: 'items-table', showQuantity: true, showUnitPrice: true, showSubtotal: true },
      { id: generateId(), type: 'divider', style: 'double' },
      { id: generateId(), type: 'totals', showSubtotal: true, showDiscount: true, showTip: true, showVAT: false, showTotal: true },
      { id: generateId(), type: 'divider', style: 'dashed' },
      { id: generateId(), type: 'text', content: 'ขอบคุณที่ใช้บริการ ♥', align: 'center', fontSize: 'normal' },
      { id: generateId(), type: 'spacer', lines: 3 },
    ];
    setCurrentTemplate(null);
    setName('ใบเสร็จใหม่');
    setPaperWidth('58');
    setBlocks(defaultBlocks);
    setSelectedBlockId(null);
  };

  // ── Save / Activate ──
  const saveTemplate = async () => {
    setSaving(true);
    try {
      const body = { name, paper_width: paperWidth, template_data: { blocks } };
      let result;
      if (currentTemplate?.id) {
        result = await adminFetch(`/receipt/templates/${currentTemplate.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        result = await adminFetch('/receipt/templates', { method: 'POST', body: JSON.stringify(body) });
      }
      setCurrentTemplate(result);
      showMessage('💾 บันทึกสำเร็จ!', 'success');
      loadTemplates();
    } catch (err: any) {
      showMessage('❌ บันทึกไม่สำเร็จ: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const activateTemplate = async () => {
    if (!currentTemplate?.id) {
      await saveTemplate();
      return;
    }
    try {
      await adminFetch(`/receipt/templates/${currentTemplate.id}/activate`, { method: 'PUT' });
      showMessage('✅ ตั้งเป็น Template หลักแล้ว!', 'success');
      loadTemplates();
    } catch (err: any) {
      showMessage('❌ ' + err.message, 'error');
    }
  };

  const deleteTemplate = async (id: number) => {
    if (!confirm('ลบ template นี้?')) return;
    try {
      await adminFetch(`/receipt/templates/${id}`, { method: 'DELETE' });
      showMessage('🗑️ ลบสำเร็จ', 'success');
      loadTemplates();
    } catch (err: any) {
      showMessage('❌ ' + err.message, 'error');
    }
  };

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // ── Block operations ──
  const addBlock = (type: ReceiptBlock['type']) => {
    const palette = BLOCK_PALETTE.find(b => b.type === type);
    if (!palette) return;
    const newBlock: ReceiptBlock = { id: generateId(), type, ...palette.defaultBlock } as ReceiptBlock;
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = useCallback((id: string, updates: Partial<ReceiptBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (fromIdx: number, toIdx: number) => {
    setBlocks(prev => {
      const arr = [...prev];
      const [item] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, item);
      return arr;
    });
  };

  const duplicateBlock = (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block) return;
    const newBlock = { ...block, id: generateId() };
    const idx = blocks.findIndex(b => b.id === id);
    setBlocks(prev => [...prev.slice(0, idx + 1), newBlock, ...prev.slice(idx + 1)]);
  };

  // ── Drag handlers ──
  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== idx) {
      moveBlock(dragIndex, idx);
      setDragIndex(idx);
    }
  };
  const handleDragEnd = () => setDragIndex(null);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">🧾 ออกแบบใบเสร็จ</h1>
          <p className="text-sm text-gray-500 mt-1">ลาก block เพื่อจัดเรียง • คลิก block เพื่อแก้ไข • Live Preview ด้านขวา</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={newTemplate} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition">
            ➕ สร้างใหม่
          </button>
          <button onClick={saveTemplate} disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50">
            {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
          </button>
          <button onClick={activateTemplate} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition">
            ✅ ใช้งาน Template นี้
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Template list */}
      {templates.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-xs text-gray-500 flex-shrink-0">Templates:</span>
          {templates.map(t => (
            <div key={t.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => selectTemplate(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${currentTemplate?.id === t.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'}`}
              >
                {t.is_active && '✅ '}{t.name}
              </button>
              {t.id && (
                <button onClick={() => deleteTemplate(t.id!)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main designer area: 3 columns */}
      <div className="grid grid-cols-12 gap-6">
        {/* Column 1: Block Palette + Block List */}
        <div className="col-span-5 space-y-4">
          {/* Template name & paper size */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">ชื่อ Template</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">ขนาดกระดาษ</label>
              <div className="flex gap-2">
                {['58', '80'].map(w => (
                  <button key={w} onClick={() => setPaperWidth(w)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition ${paperWidth === w ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'}`}>
                    {w}mm {w === '58' ? '(32 ตัวอักษร)' : '(48 ตัวอักษร)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Block Palette */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3">➕ เพิ่ม Block</h3>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_PALETTE.map(bp => (
                <button key={bp.type} onClick={() => addBlock(bp.type)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-xs font-medium text-gray-700 transition">
                  <span className="text-base">{bp.icon}</span> {bp.label}
                </button>
              ))}
            </div>
          </div>

          {/* Block List (drag-and-drop) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-3">📑 โครงสร้างใบเสร็จ <span className="text-gray-400 font-normal">({blocks.length} blocks)</span></h3>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {blocks.map((block, idx) => {
                const palette = BLOCK_PALETTE.find(p => p.type === block.type);
                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition group ${
                      selectedBlockId === block.id
                        ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200'
                        : 'bg-gray-50 border-transparent hover:border-gray-300'
                    } ${dragIndex === idx ? 'opacity-50' : ''}`}
                  >
                    <span className="text-gray-400 cursor-grab text-xs">⠿</span>
                    <span className="text-sm">{palette?.icon || '?'}</span>
                    <span className="text-xs font-medium text-gray-700 flex-1 truncate">
                      {palette?.label || block.type}
                      {block.type === 'text' && block.content ? `: ${block.content.substring(0, 20)}` : ''}
                      {block.type === 'divider' ? ` (${block.style})` : ''}
                      {block.type === 'qrcode' ? ` (${block.qrType})` : ''}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(idx, Math.max(0, idx - 1)); }} className="text-gray-400 hover:text-gray-700 text-xs" title="ขึ้น">▲</button>
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(idx, Math.min(blocks.length - 1, idx + 1)); }} className="text-gray-400 hover:text-gray-700 text-xs" title="ลง">▼</button>
                      <button onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }} className="text-gray-400 hover:text-blue-600 text-xs" title="คัดลอก">📋</button>
                      <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="text-gray-400 hover:text-red-600 text-xs" title="ลบ">🗑️</button>
                    </div>
                  </div>
                );
              })}
              {blocks.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">ยังไม่มี block — กดเพิ่มจากด้านบน</p>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Block Properties Editor */}
        <div className="col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm sticky top-20">
            <h3 className="text-sm font-bold text-gray-800 mb-3">⚙️ ตั้งค่า Block</h3>
            {selectedBlock ? (
              <BlockEditor block={selectedBlock} onChange={updateBlock} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-12">เลือก block ด้านซ้ายเพื่อแก้ไข</p>
            )}
          </div>
        </div>

        {/* Column 3: Live Preview */}
        <div className="col-span-4">
          <div className="sticky top-20">
            <ReceiptPreview blocks={blocks} paperWidth={paperWidth} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Block Property Editor ──
function BlockEditor({ block, onChange }: { block: ReceiptBlock; onChange: (id: string, updates: Partial<ReceiptBlock>) => void }) {
  const update = (updates: Partial<ReceiptBlock>) => onChange(block.id, updates);
  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none";
  const labelClass = "text-xs font-medium text-gray-600 block mb-1";
  const selectClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-300 outline-none";

  switch (block.type) {
    case 'text':
      return (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>ข้อความ</label>
            <textarea value={block.content || ''} onChange={e => update({ content: e.target.value })} className={inputClass} rows={2} />
          </div>
          <div>
            <label className={labelClass}>จัดตำแหน่ง</label>
            <div className="flex gap-1">
              {(['left', 'center', 'right'] as const).map(a => (
                <button key={a} onClick={() => update({ align: a })}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${block.align === a ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {a === 'left' ? '◀ ซ้าย' : a === 'center' ? '● กลาง' : 'ขวา ▶'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>ขนาดตัวอักษร</label>
            <div className="flex gap-1">
              {(['small', 'normal', 'large'] as const).map(s => (
                <button key={s} onClick={() => update({ fontSize: s })}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${block.fontSize === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {s === 'small' ? 'เล็ก' : s === 'normal' ? 'ปกติ' : 'ใหญ่'}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={block.bold || false} onChange={e => update({ bold: e.target.checked })} className="rounded border-gray-300 text-indigo-600" />
            <span className="text-xs text-gray-700 font-medium">ตัวหนา</span>
          </label>
        </div>
      );

    case 'divider':
      return (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>รูปแบบเส้น</label>
            <div className="grid grid-cols-2 gap-1">
              {[
                { val: 'dashed', label: '- - เส้นประ' },
                { val: 'solid', label: '── เส้นทึบ' },
                { val: 'double', label: '══ เส้นคู่' },
                { val: 'dotted', label: '·· จุด' },
              ].map(s => (
                <button key={s.val} onClick={() => update({ style: s.val as ReceiptBlock['style'] })}
                  className={`py-1.5 rounded-lg border text-xs font-medium transition ${block.style === s.val ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case 'order-info':
      return (
        <div className="space-y-2">
          {[
            { key: 'showOrderNumber', label: 'เลขออเดอร์' },
            { key: 'showDate', label: 'วันที่' },
            { key: 'showTime', label: 'เวลา' },
            { key: 'showCashier', label: 'ชื่อพนักงาน' },
          ].map(opt => (
            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(block as any)[opt.key] || false}
                onChange={e => update({ [opt.key]: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600" />
              <span className="text-xs text-gray-700 font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case 'items-table':
      return (
        <div className="space-y-2">
          {[
            { key: 'showQuantity', label: 'แสดงจำนวน' },
            { key: 'showUnitPrice', label: 'แสดงราคาต่อชิ้น' },
            { key: 'showSubtotal', label: 'แสดงราคารวม' },
          ].map(opt => (
            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(block as any)[opt.key] !== false}
                onChange={e => update({ [opt.key]: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600" />
              <span className="text-xs text-gray-700 font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case 'totals':
      return (
        <div className="space-y-2">
          {[
            { key: 'showSubtotal', label: 'ยอดรวม (Subtotal)' },
            { key: 'showDiscount', label: 'ส่วนลด' },
            { key: 'showTip', label: 'ทิป' },
            { key: 'showVAT', label: 'VAT 7%' },
            { key: 'showTotal', label: 'รวมทั้งสิ้น (Total)' },
          ].map(opt => (
            <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(block as any)[opt.key] !== false}
                onChange={e => update({ [opt.key]: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600" />
              <span className="text-xs text-gray-700 font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case 'qrcode':
      return (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>ประเภท QR</label>
            <select value={block.qrType || 'promptpay'} onChange={e => update({ qrType: e.target.value as any })} className={selectClass}>
              <option value="promptpay">💳 PromptPay</option>
              <option value="url">🔗 URL / Link</option>
              <option value="text">📝 ข้อความ Custom</option>
            </select>
          </div>
          {block.qrType === 'promptpay' && (
            <>
              <div>
                <label className={labelClass}>เลข PromptPay (เบอร์มือถือ / Tax ID)</label>
                <input value={block.promptpayId || ''} onChange={e => update({ promptpayId: e.target.value })} className={inputClass} placeholder="0812345678" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={block.showAmount !== false} onChange={e => update({ showAmount: e.target.checked })} className="rounded border-gray-300 text-indigo-600" />
                <span className="text-xs text-gray-700 font-medium">แสดงยอดเงินใน QR</span>
              </label>
            </>
          )}
          {block.qrType === 'url' && (
            <div>
              <label className={labelClass}>URL</label>
              <input value={block.url || ''} onChange={e => update({ url: e.target.value })} className={inputClass} placeholder="https://..." />
            </div>
          )}
          {block.qrType === 'text' && (
            <div>
              <label className={labelClass}>ข้อความ</label>
              <textarea value={block.customText || ''} onChange={e => update({ customText: e.target.value })} className={inputClass} rows={3} placeholder="ข้อความที่ต้องการเข้ารหัส QR" />
            </div>
          )}
          <div>
            <label className={labelClass}>ข้อความกำกับ (Label)</label>
            <input value={block.label || ''} onChange={e => update({ label: e.target.value })} className={inputClass} placeholder="สแกนจ่ายที่นี่" />
          </div>
          <div>
            <label className={labelClass}>ขนาด QR</label>
            <div className="flex gap-1">
              {(['small', 'medium', 'large'] as const).map(s => (
                <button key={s} onClick={() => update({ size: s })}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${block.size === s ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {s === 'small' ? 'เล็ก' : s === 'medium' ? 'กลาง' : 'ใหญ่'}
                </button>
              ))}
            </div>
          </div>
        </div>
      );

    case 'spacer':
      return (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>จำนวนบรรทัด</label>
            <input type="number" min={1} max={10} value={block.lines || 1} onChange={e => update({ lines: Number(e.target.value) })} className={inputClass} />
          </div>
        </div>
      );

    default:
      return <p className="text-xs text-gray-400">ไม่มีตัวเลือกสำหรับ block นี้</p>;
  }
}
