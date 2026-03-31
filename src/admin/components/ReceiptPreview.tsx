/**
 * ReceiptPreview — Live thermal receipt preview in the admin panel
 * Shows how the receipt will look when printed on Sunmi
 */
import type { ReceiptBlock } from '../../utils/receiptPrinter';
import { formatCurrency } from '../../helpers';

interface ReceiptPreviewProps {
  blocks: ReceiptBlock[];
  paperWidth: string;
}

// Sample data for preview
const SAMPLE_ORDER = {
  orderNumber: '#0042',
  items: [
    { name: 'ลาเต้เย็น', quantity: 2, price: 60 },
    { name: 'มอคค่าร้อน', quantity: 1, price: 75 },
    { name: 'ครัวซองต์', quantity: 1, price: 65 },
  ],
  subtotal: 260,
  discount: 10,
  discountAmount: 26,
  tipPercent: 5,
  tipAmount: 11.70,
  total: 245.70,
  cashier: 'Admin',
};

function getCharWidth(pw: string) { return pw === '80' ? 48 : 32; }

export default function ReceiptPreview({ blocks, paperWidth }: ReceiptPreviewProps) {
  const receiptWidth = paperWidth === '80' ? '320px' : '220px';

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
          📐 {paperWidth}mm
        </span>
        <span className="text-xs text-gray-400">Live Preview</span>
      </div>
      <div
        className="bg-white border border-gray-300 shadow-xl rounded-sm overflow-hidden"
        style={{ width: receiptWidth, fontFamily: "'Courier New', Courier, monospace" }}
      >
        <div className="p-4 space-y-0">
          {blocks.map((block) => (
            <PreviewBlock key={block.id} block={block} paperWidth={paperWidth} />
          ))}
        </div>
        {/* Paper tear effect */}
        <div className="h-4 bg-gradient-to-b from-white to-gray-100" style={{
          borderTop: '2px dashed #ddd',
          backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 4px, #e5e7eb 4px, #e5e7eb 8px)',
          backgroundSize: '8px 4px',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'bottom'
        }} />
      </div>
    </div>
  );
}

function PreviewBlock({ block, paperWidth }: { block: ReceiptBlock; paperWidth: string }) {
  const charWidth = getCharWidth(paperWidth);
  
  switch (block.type) {
    case 'text': return <PreviewText block={block} />;
    case 'divider': return <PreviewDivider block={block} charWidth={charWidth} />;
    case 'order-info': return <PreviewOrderInfo block={block} />;
    case 'items-table': return <PreviewItemsTable block={block} />;
    case 'totals': return <PreviewTotals block={block} />;
    case 'qrcode': return <PreviewQRCode block={block} />;
    case 'spacer': return <PreviewSpacer block={block} />;
    default: return null;
  }
}

function PreviewText({ block }: { block: ReceiptBlock }) {
  const alignClass = block.align === 'right' ? 'text-right' : block.align === 'left' ? 'text-left' : 'text-center';
  const sizeClass = block.fontSize === 'large' ? 'text-base' : block.fontSize === 'small' ? 'text-[10px]' : 'text-xs';
  const weightClass = block.bold ? 'font-bold' : 'font-normal';
  return <p className={`${alignClass} ${sizeClass} ${weightClass} text-gray-900 leading-snug py-0.5`}>{block.content || '(ข้อความว่าง)'}</p>;
}

function PreviewDivider({ block, charWidth }: { block: ReceiptBlock; charWidth: number }) {
  const styleMap: Record<string, string> = {
    solid: '─', dashed: '-', double: '═', dotted: '·'
  };
  const char = styleMap[block.style || 'dashed'] || '-';
  return <p className="text-[10px] text-gray-400 leading-none py-0.5 tracking-tighter overflow-hidden whitespace-nowrap">{char.repeat(charWidth)}</p>;
}

function PreviewOrderInfo({ block }: { block: ReceiptBlock }) {
  const now = new Date();
  return (
    <div className="text-xs text-gray-800 space-y-0.5 py-1">
      {block.showOrderNumber && (
        <div className="flex justify-between"><span>ออเดอร์:</span><span className="font-bold">{SAMPLE_ORDER.orderNumber}</span></div>
      )}
      {block.showDate && (
        <div className="flex justify-between">
          <span>{`${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}/${now.getFullYear()}`}</span>
          {block.showTime && <span>{`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`}</span>}
        </div>
      )}
      {block.showCashier && <div className="flex justify-between"><span>พนักงาน:</span><span>{SAMPLE_ORDER.cashier}</span></div>}
    </div>
  );
}

function PreviewItemsTable({ block }: { block: ReceiptBlock }) {
  return (
    <div className="text-xs text-gray-800 space-y-1 py-1">
      {SAMPLE_ORDER.items.map((item, i) => (
        <div key={i}>
          <div className="font-medium">{item.name}</div>
          <div className="flex justify-between text-gray-600 pl-2">
            {block.showQuantity && block.showUnitPrice ? (
              <span>{item.quantity} x {formatCurrency(item.price)}</span>
            ) : (
              <span>x{item.quantity}</span>
            )}
            {block.showSubtotal !== false && <span>{formatCurrency(item.quantity * item.price)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function PreviewTotals({ block }: { block: ReceiptBlock }) {
  return (
    <div className="text-xs text-gray-800 space-y-0.5 py-1">
      {block.showSubtotal !== false && (
        <div className="flex justify-between"><span>ยอดรวม:</span><span>{formatCurrency(SAMPLE_ORDER.subtotal)}</span></div>
      )}
      {block.showDiscount && SAMPLE_ORDER.discount > 0 && (
        <div className="flex justify-between text-red-600"><span>ส่วนลด ({SAMPLE_ORDER.discount}%):</span><span>-{formatCurrency(SAMPLE_ORDER.discountAmount)}</span></div>
      )}
      {block.showTip && SAMPLE_ORDER.tipPercent > 0 && (
        <div className="flex justify-between text-green-600"><span>ทิป ({SAMPLE_ORDER.tipPercent}%):</span><span>+{formatCurrency(SAMPLE_ORDER.tipAmount)}</span></div>
      )}
      {block.showVAT && (
        <div className="flex justify-between"><span>VAT 7%:</span><span>{formatCurrency(SAMPLE_ORDER.total * 7 / 107)}</span></div>
      )}
      {block.showTotal !== false && (
        <div className="flex justify-between font-bold text-sm border-t border-gray-300 pt-1 mt-1">
          <span>รวมทั้งสิ้น:</span><span>{formatCurrency(SAMPLE_ORDER.total)}</span>
        </div>
      )}
    </div>
  );
}

function PreviewQRCode({ block }: { block: ReceiptBlock }) {
  const sizeMap: Record<string, string> = { small: 'w-16 h-16', medium: 'w-24 h-24', large: 'w-32 h-32' };
  const sizeClass = sizeMap[block.size || 'medium'] || 'w-24 h-24';
  const typeLabel = block.qrType === 'promptpay' ? '💳 PromptPay' : block.qrType === 'url' ? '🔗 URL' : '📝 Text';

  return (
    <div className="flex flex-col items-center py-2">
      {block.label && <p className="text-[10px] text-gray-600 mb-1">{block.label}</p>}
      <div className={`${sizeClass} bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-lg">▣</div>
          <div className="text-[8px] text-gray-500 mt-0.5">{typeLabel}</div>
        </div>
      </div>
      {block.qrType === 'promptpay' && block.promptpayId && (
        <p className="text-[9px] text-gray-400 mt-1">{block.promptpayId}</p>
      )}
    </div>
  );
}

function PreviewSpacer({ block }: { block: ReceiptBlock }) {
  const h = (block.lines || 1) * 14;
  return <div style={{ height: h }} />;
}
