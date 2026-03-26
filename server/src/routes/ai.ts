import { Router, Request, Response } from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// POST /api/ai/summarize — AI summary of a report period
router.post('/summarize', async (req: Request, res: Response) => {
  const { reportData, period } = req.body;

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'GROQ_API_KEY not configured' });
  }

  const { totalRevenue, totalExpenses, grossProfit, vatCollected, estimatedIncomeTax, topProducts, chartData } = reportData;

  const prompt = `คุณเป็นผู้ช่วยบัญชีและที่ปรึกษาร้านคาเฟ่ผู้เชี่ยวชาญ วิเคราะห์รายงานร้านคาเฟ่ประจำ${period} และตอบเป็นภาษาไทยอย่างละเอียด:

**ข้อมูลทางการเงิน:**
- รายได้รวม: ${totalRevenue?.toLocaleString('th-TH')} บาท
- ค่าใช้จ่ายรวม: ${totalExpenses?.toLocaleString('th-TH')} บาท
- กำไรขั้นต้น: ${grossProfit?.toLocaleString('th-TH')} บาท
- VAT ที่เก็บได้: ${vatCollected?.toLocaleString('th-TH')} บาท
- ภาษีเงินได้โดยประมาณ: ${estimatedIncomeTax?.toLocaleString('th-TH')} บาท

**สินค้าขายดี:** ${JSON.stringify(topProducts || [])}

กรุณาวิเคราะห์และให้คำแนะนำ 4 ด้านต่อไปนี้อย่างละเอียด:

## 1. 📊 สรุปผลการดำเนินงาน
วิเคราะห์ภาพรวม กำไรขาดทุน และ profit margin

## 2. 🍽️ คำแนะนำเมนูและการตลาด
- เมนูไหนควรโปรโมทเพิ่ม เมนูไหนควรปรับราคา
- ควรเพิ่มเมนูประเภทใดเพื่อเพิ่มรายได้

## 3. 📦 การจัดการวัตถุดิบและสต็อก
- วัตถุดิบอะไรที่ควรสั่งซื้อ และปริมาณเท่าไหร่
- วิธีลดต้นทุนวัตถุดิบ

## 4. 💰 ภาษีและการเงิน
- สรุปภาษีที่ต้องเตรียม (VAT + ภาษีเงินได้)
- แนะนำวิธีวางแผนภาษีให้ถูกกฎหมายและประหยัด
- เงินทุนที่ควรสำรองไว้สำหรับภาษี`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
    });

    const summary = completion.choices[0]?.message?.content || 'ไม่สามารถสร้างสรุปได้';
    res.json({ summary, usage: completion.usage });
  } catch (err: any) {
    console.error('Groq error:', err);
    res.status(500).json({ error: 'AI summary failed: ' + err.message });
  }
});

export default router;
