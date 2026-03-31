/**
 * Receipt Printer Engine — Converts template blocks to Sunmi Printer API calls
 * Supports both 58mm (32 chars) and 80mm (48 chars) paper
 */
import { SunmiPrinter } from '@kduma-autoid/capacitor-sunmi-printer';
import { getQRContent } from './qrGenerator';
import { formatCurrency } from '../helpers';

export interface ReceiptBlock {
  id: string;
  type: 'text' | 'divider' | 'order-info' | 'items-table' | 'totals' | 'qrcode' | 'spacer' | 'image';
  // text
  content?: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  fontSize?: 'small' | 'normal' | 'large';
  // divider
  style?: 'solid' | 'dashed' | 'double' | 'dotted';
  // order-info
  showDate?: boolean;
  showTime?: boolean;
  showOrderNumber?: boolean;
  showCashier?: boolean;
  dateFormat?: string;
  // items-table
  showQuantity?: boolean;
  showUnitPrice?: boolean;
  showSubtotal?: boolean;
  // totals
  showDiscount?: boolean;
  showTip?: boolean;
  showVAT?: boolean;
  showTotal?: boolean;
  // qrcode
  qrType?: 'promptpay' | 'url' | 'text';
  promptpayId?: string;
  url?: string;
  customText?: string;
  size?: 'small' | 'medium' | 'large';
  label?: string;
  showAmount?: boolean;
  // spacer
  lines?: number;
  // image
  imageUrl?: string;
  width?: number;
}

export interface ReceiptTemplate {
  blocks: ReceiptBlock[];
}

export interface OrderData {
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  discountAmount: number;
  tipPercent: number;
  tipAmount: number;
  total: number;
  cashier?: string;
}

function getCharWidth(paperWidth: string): number {
  return paperWidth === '80' ? 48 : 32;
}

function makeLine(char: string, width: number): string {
  return char.repeat(width);
}

function padBetween(left: string, right: string, width: number): string {
  const gap = width - left.length - right.length;
  if (gap <= 0) return left + ' ' + right;
  return left + ' '.repeat(gap) + right;
}

/**
 * Print a receipt using Sunmi Printer API
 */
export async function printReceipt(
  template: ReceiptTemplate,
  order: OrderData,
  paperWidth: string = '58'
): Promise<void> {
  const printer = SunmiPrinter as any;
  const { hasPrinter } = await printer.hasPrinter();
  if (!hasPrinter) {
    console.warn('ไม่พบเครื่องพิมพ์ Sunmi');
    return;
  }

  const charWidth = getCharWidth(paperWidth);
  await printer.printerInit();

  for (const block of template.blocks) {
    switch (block.type) {
      case 'text':
        await printTextBlock(printer, block);
        break;
      case 'divider':
        await printDivider(printer, block, charWidth);
        break;
      case 'order-info':
        await printOrderInfo(printer, block, order, charWidth);
        break;
      case 'items-table':
        await printItemsTable(printer, block, order, charWidth);
        break;
      case 'totals':
        await printTotals(printer, block, order, charWidth);
        break;
      case 'qrcode':
        await printQRCode(printer, block, order);
        break;
      case 'spacer':
        await printSpacer(printer, block);
        break;
    }
  }

  // Feed paper and cut
  try { await printer.openDrawer(); } catch (_e) { /* no drawer */ }
  try { await printer.cutPaper(); } catch (_e) { /* no cutter */ }
}

async function printTextBlock(printer: any, block: ReceiptBlock) {
  const alignMap: Record<string, string> = { left: 'LEFT', center: 'CENTER', right: 'RIGHT' };
  await printer.printText({
    text: (block.content || '') + '\n',
    align: alignMap[block.align || 'center'] || 'CENTER',
    bold: block.bold || false,
  });
}

async function printDivider(printer: any, block: ReceiptBlock, charWidth: number) {
  let line: string;
  switch (block.style) {
    case 'solid': line = makeLine('─', charWidth); break;
    case 'double': line = makeLine('═', charWidth); break;
    case 'dotted': line = makeLine('·', charWidth); break;
    default: line = makeLine('-', charWidth); break;
  }
  await printer.printText({ text: line + '\n' });
}

async function printOrderInfo(printer: any, block: ReceiptBlock, order: OrderData, charWidth: number) {
  const now = new Date();
  if (block.showOrderNumber) {
    await printer.printText({ text: padBetween('ออเดอร์:', order.orderNumber, charWidth) + '\n' });
  }
  if (block.showDate) {
    const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    if (block.showTime) {
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      await printer.printText({ text: padBetween(dateStr, timeStr, charWidth) + '\n' });
    } else {
      await printer.printText({ text: `วันที่: ${dateStr}\n` });
    }
  } else if (block.showTime) {
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    await printer.printText({ text: `เวลา: ${timeStr}\n` });
  }
  if (block.showCashier && order.cashier) {
    await printer.printText({ text: `พนักงาน: ${order.cashier}\n` });
  }
}

async function printItemsTable(printer: any, block: ReceiptBlock, order: OrderData, charWidth: number) {
  for (const item of order.items) {
    // Line 1: Item name
    await printer.printText({ text: item.name + '\n' });
    // Line 2: quantity x price = subtotal
    if (block.showQuantity && block.showUnitPrice && block.showSubtotal) {
      const left = `  ${item.quantity} x ${formatCurrency(item.price)}`;
      const right = formatCurrency(item.quantity * item.price);
      await printer.printText({ text: padBetween(left, right, charWidth) + '\n' });
    } else if (block.showSubtotal) {
      const right = formatCurrency(item.quantity * item.price);
      await printer.printText({ text: padBetween(`  x${item.quantity}`, right, charWidth) + '\n' });
    }
  }
}

async function printTotals(printer: any, block: ReceiptBlock, order: OrderData, charWidth: number) {
  if (block.showSubtotal !== false) {
    await printer.printText({ text: padBetween('ยอดรวม:', formatCurrency(order.subtotal), charWidth) + '\n' });
  }
  if (block.showDiscount && order.discount > 0) {
    await printer.printText({ text: padBetween(`ส่วนลด (${order.discount}%):`, `-${formatCurrency(order.discountAmount)}`, charWidth) + '\n' });
  }
  if (block.showTip && order.tipPercent > 0) {
    await printer.printText({ text: padBetween(`ทิป (${order.tipPercent}%):`, `+${formatCurrency(order.tipAmount)}`, charWidth) + '\n' });
  }
  if (block.showVAT) {
    const vat = order.total * 7 / 107; // VAT included in price
    await printer.printText({ text: padBetween('VAT 7%:', formatCurrency(vat), charWidth) + '\n' });
  }
  if (block.showTotal !== false) {
    await printer.printText({ text: padBetween('รวมทั้งสิ้น:', formatCurrency(order.total), charWidth) + '\n', bold: true });
  }
}

async function printQRCode(printer: any, block: ReceiptBlock, order: OrderData) {
  const content = getQRContent(
    { qrType: block.qrType || 'promptpay', promptpayId: block.promptpayId, url: block.url, customText: block.customText, showAmount: block.showAmount },
    order.total
  );
  if (!content) return;

  if (block.label) {
    await printer.printText({ text: block.label + '\n', align: 'CENTER' });
  }

  const sizeMap: Record<string, number> = { small: 4, medium: 6, large: 8 };
  const moduleSize = sizeMap[block.size || 'medium'] || 6;

  try {
    await printer.printQRCode({ content, moduleSize });
  } catch (_e) {
    // Fallback: just print as text if QR fails
    await printer.printText({ text: `[QR: ${content.substring(0, 30)}...]\n`, align: 'CENTER' });
  }
}

async function printSpacer(printer: any, block: ReceiptBlock) {
  const lines = block.lines || 1;
  await printer.printText({ text: '\n'.repeat(lines) });
}
