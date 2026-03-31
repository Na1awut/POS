/**
 * QR Code Generator for Receipt Printing
 * Supports: PromptPay (EMVCo), URL, Custom Text
 */

// CRC16-CCITT for PromptPay
function crc16(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function tlv(tag: string, value: string): string {
  return tag + value.length.toString().padStart(2, '0') + value;
}

/**
 * Generate PromptPay QR code payload (EMVCo standard)
 * @param targetId - Phone number (0812345678) or National ID (1234567890123) or Tax ID
 * @param amount - Amount in THB (optional, 0 = no amount)
 */
export function generatePromptPayPayload(targetId: string, amount: number = 0): string {
  // Clean the ID
  const cleanId = targetId.replace(/[^0-9]/g, '');
  
  let aidTag: string;
  let formattedId: string;
  
  if (cleanId.length >= 13) {
    // National ID or Tax ID (13 digits)
    aidTag = '02'; // National/Tax ID
    formattedId = cleanId.substring(0, 13);
  } else {
    // Phone number - convert to international format
    aidTag = '01'; // Phone number  
    if (cleanId.startsWith('0')) {
      formattedId = '0066' + cleanId.substring(1); // +66 format with leading 00
    } else if (cleanId.startsWith('66')) {
      formattedId = '00' + cleanId;
    } else {
      formattedId = '0066' + cleanId;
    }
  }

  // Build merchant info (tag 29 for PromptPay)
  const merchantAID = tlv('00', 'A000000677010111'); // PromptPay AID
  const merchantId = tlv(aidTag, formattedId);
  const merchantInfo = tlv('29', merchantAID + merchantId);

  // Build the payload without CRC
  let payload = '';
  payload += tlv('00', '01');           // Payload Format Indicator
  payload += tlv('01', '11');           // Point of Initiation (11 = Static, 12 = Dynamic)
  payload += merchantInfo;              // Merchant Account Info
  payload += tlv('52', '0000');         // Merchant Category Code
  payload += tlv('53', '764');          // Currency (764 = THB)
  
  if (amount > 0) {
    payload += tlv('54', amount.toFixed(2)); // Transaction Amount
  }
  
  payload += tlv('58', 'TH');           // Country Code

  // Build final payload with CRC
  let rawPayload = '';
  rawPayload += tlv('00', '01');
  rawPayload += tlv('01', '11');
  rawPayload += merchantInfo;
  rawPayload += tlv('52', '0000');
  rawPayload += tlv('53', '764');
  if (amount > 0) {
    rawPayload += tlv('54', amount.toFixed(2));
  }
  rawPayload += tlv('58', 'TH');
  rawPayload += '6304'; // CRC tag + length, value will be appended
  
  const crcResult = crc16(rawPayload);
  return rawPayload + crcResult;
}

export type QRType = 'promptpay' | 'url' | 'text';

export interface QRCodeConfig {
  qrType: QRType;
  promptpayId?: string;
  url?: string;
  customText?: string;
  showAmount?: boolean;
}

/**
 * Get the QR code content string based on config
 */
export function getQRContent(config: QRCodeConfig, amount: number = 0): string {
  switch (config.qrType) {
    case 'promptpay':
      if (!config.promptpayId) return '';
      return generatePromptPayPayload(
        config.promptpayId,
        config.showAmount ? amount : 0
      );
    case 'url':
      return config.url || '';
    case 'text':
      return config.customText || '';
    default:
      return '';
  }
}
