import { useEffect, useState } from 'react';
import { adminFetch } from '../api/adminClient';

const formatTHB = (n: number) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(n ?? 0);

const MONTHS_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

export default function TaxPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState<number | ''>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const q = month ? `?year=${year}&month=${month}` : `?year=${year}`;
    adminFetch(`/reports/tax${q}`).then(setData).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const printReport = () => window.print();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🏛️ ภาษีและสรรพากร</h1>
          <p className="text-sm text-gray-400 mt-1">คำนวณภาษีมูลค่าเพิ่ม (VAT 7%) และภาษีเงินได้เพื่อยื่นสรรพากร</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={month} onChange={e => setMonth(e.target.value ? Number(e.target.value) : '')} className="border rounded-lg px-3 py-2 text-sm">
            <option value="">ทั้งปี</option>
            {MONTHS_TH.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded-lg px-3 py-2 text-sm w-24" />
          <button onClick={load} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">คำนวณ</button>
          <button onClick={printReport} className="border border-gray-300 px-4 py-2 rounded-lg text-sm">🖨️ พิมพ์</button>
        </div>
      </div>

      {loading ? <div className="text-center py-10 text-gray-400">กำลังคำนวณ...</div> : data && (
        <div className="space-y-5 print:space-y-4">
          <div className="text-center text-sm text-gray-500 bg-gray-50 rounded-xl py-3">
            รายงานภาษีสำหรับ: <strong>{month ? `${MONTHS_TH[Number(month) - 1]} ${year + 543}` : `ปี ${year + 543}`}</strong>
          </div>

          {/* VAT Section */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-purple-800 mb-4">ส่วนที่ 1: ภาษีมูลค่าเพิ่ม (VAT)</h2>
            <p className="text-sm text-gray-500 mb-4">ใช้สำหรับยื่นแบบ ภ.พ.30 (ถ้าจดทะเบียน VAT)</p>
            <div className="bg-white rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">รายได้รวม (Output: ยอดขายทั้งหมด)</span>
                <span className="font-semibold">{formatTHB(data.grossRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm pl-4 text-gray-500">
                <span>= ฐานภาษี (ราคาก่อน VAT)</span>
                <span>{formatTHB(data.vatBreakdown.output / 0.07 * (1 - 0.07 / 1.07))}</span>
              </div>
              <div className="flex justify-between text-sm pl-4">
                <span className="text-gray-600">+ Output VAT 7%</span>
                <span className="font-semibold text-purple-700">{formatTHB(data.vatBreakdown.output)}</span>
              </div>
              <div className="flex justify-between text-sm pl-4">
                <span className="text-gray-600">- Input VAT (ค่าใช้จ่ายที่มี VAT)</span>
                <span className="font-semibold text-orange-600">{formatTHB(data.vatBreakdown.input)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span className="text-purple-800">VAT ที่ต้องนำส่งสรรพากร</span>
                <span className="text-purple-800 text-xl">{formatTHB(data.vatBreakdown.payable)}</span>
              </div>
            </div>
          </div>

          {/* Income Tax Section */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-amber-800 mb-4">ส่วนที่ 2: ภาษีเงินได้</h2>
            <p className="text-sm text-gray-500 mb-4">ภ.ง.ด.90 หรือ ภ.ง.ด.91 (ยื่นต้นปีสำหรับรายได้ปีที่แล้ว)</p>
            <div className="bg-white rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">รายได้รวมก่อน VAT</span>
                <span className="font-semibold">{formatTHB(data.incomeBreakdown.grossRevenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ค่าใช้จ่ายที่หักได้</span>
                <span className="font-semibold text-orange-600">- {formatTHB(data.incomeBreakdown.deductibleExpenses)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between text-sm font-bold">
                <span>รายได้สุทธิสำหรับคำนวณภาษี</span>
                <span className="text-lg">{formatTHB(data.incomeBreakdown.netIncome)}</span>
              </div>
            </div>

            {/* Tax Brackets */}
            <div className="mt-4 bg-white rounded-xl p-5">
              <div className="text-sm font-semibold text-gray-700 mb-3">อัตราภาษีเงินได้บุคคลธรรมดา (ขั้นบันได)</div>
              <div className="space-y-2">
                {data.incomeBreakdown.taxBrackets?.map((b: any, i: number) => (
                  <div key={i} className={`flex justify-between text-sm py-2 px-3 rounded-lg ${b.taxable > 0 ? 'bg-amber-50' : 'text-gray-400'}`}>
                    <span>{b.label} ({(b.rate * 100).toFixed(0)}%)</span>
                    <span className={b.taxable > 0 ? 'font-semibold text-amber-800' : ''}>{b.taxable > 0 ? formatTHB(b.tax) : '—'}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-3 pt-3 flex justify-between items-center">
                <div>
                  <div className="font-bold text-red-700 text-base">ภาษีเงินได้โดยประมาณ</div>
                  <div className="text-xs text-gray-400">อัตราภาษีที่แท้จริง: {data.incomeBreakdown.effectiveRate}</div>
                </div>
                <div className="text-2xl font-black text-red-700">{formatTHB(data.incomeBreakdown.estimatedIncomeTax)}</div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-800 text-white rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">💰 สรุปภาษีที่ต้องเตรียม</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-gray-300 text-sm">VAT ต้องนำส่ง (รายเดือน/รายไตรมาส)</div>
                <div className="text-2xl font-bold text-purple-300 mt-1">{formatTHB(data.vatBreakdown.payable)}</div>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <div className="text-gray-300 text-sm">ภาษีเงินได้โดยประมาณ</div>
                <div className="text-2xl font-bold text-amber-300 mt-1">{formatTHB(data.incomeBreakdown.estimatedIncomeTax)}</div>
              </div>
            </div>
            <div className="mt-4 bg-white/5 rounded-xl p-4">
              <div className="text-gray-300 text-sm">เงินสำรองภาษีรวมที่ควรเตรียม</div>
              <div className="text-3xl font-black text-yellow-300 mt-1">
                {formatTHB(data.vatBreakdown.payable + data.incomeBreakdown.estimatedIncomeTax)}
              </div>
              <div className="text-xs text-gray-500 mt-1">* ค่าประมาณเบื้องต้น ควรปรึกษานักบัญชีก่อนยื่นจริง</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
