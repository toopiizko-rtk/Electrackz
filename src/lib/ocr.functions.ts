import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageDataUrl: z.string().min(20).max(15_000_000),
  categories: z.array(z.string()).min(1).max(20),
  units: z.array(z.string()).min(1).max(20),
});

const SystemPrompt = `คุณคือผู้ช่วยอ่านบันทึกงานช่างไฟ จะได้รับรูปภาพ (อาจเป็นลายมือบนกระดาษ) ที่จดรายการงาน
หน้าที่: สกัดเป็น JSON array ของรายการงาน โดยแต่ละรายการมีฟิลด์:
- category: หนึ่งใน {CATEGORIES} (เลือกที่ใกล้เคียงที่สุด ถ้าไม่ตรงเลยใช้ "อื่นๆ")
- detail: รายละเอียดงาน (สั้น ๆ เช่น "เดินสายปลั๊ก 2.5mm²")
- qty: จำนวน (number)
- unit: หนึ่งใน {UNITS}
- note: หมายเหตุ (ถ้ามี ไม่มีให้เป็น "")
ตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่น`;

export const ocrWorkLog = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const sys = SystemPrompt
      .replace("{CATEGORIES}", data.categories.join(", "))
      .replace("{UNITS}", data.units.join(", "));

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          {
            role: "user",
            content: [
              { type: "text", text: "อ่านรายการงานในรูปนี้ ตอบเป็น JSON array" },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json = await res.json() as any;
    const content = json?.choices?.[0]?.message?.content ?? "[]";
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = []; }
    // model may return { items: [...] } or [...]
    const items = Array.isArray(parsed) ? parsed : (parsed.items ?? parsed.results ?? []);
    return { items: items as Array<{ category: string; detail: string; qty: number; unit: string; note?: string }> };
  });

// ── Expense OCR ─────────────────────────────────────────────────────────
const ExpenseInputSchema = z.object({
  imageDataUrl: z.string().min(20).max(15_000_000),
  categories: z.array(z.string()).min(1).max(20),
});

const ExpenseSystemPrompt = `คุณคือผู้ช่วยอ่านใบเสร็จ/บิลค่าใช้จ่ายของช่างไฟ จะได้รับรูปภาพ (ใบเสร็จ บิล หรือลายมือบันทึกค่าใช้จ่าย)
หน้าที่: สกัดเป็น JSON array ของรายการค่าใช้จ่ายแต่ละบรรทัด โดยแต่ละรายการมีฟิลด์:
- category: หนึ่งใน {CATEGORIES} (เลือกที่ใกล้เคียงที่สุด ถ้าไม่ตรงเลยใช้ "อื่นๆ")
- name: ชื่อรายการ (เช่น "สายไฟ THW 2.5", "ค่าน้ำมัน", "เบรกเกอร์ 32A")
- amount: จำนวนเงิน (number, บาท)
- note: หมายเหตุ (ถ้ามี เช่น จำนวน/ขนาด ไม่มีให้เป็น "")
แยกแต่ละรายการในใบเสร็จออกเป็นรายการต่างหาก ห้ามรวมเป็นยอดเดียว
ตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่น`;

export const ocrExpense = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ExpenseInputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const sys = ExpenseSystemPrompt.replace("{CATEGORIES}", data.categories.join(", "));

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          {
            role: "user",
            content: [
              { type: "text", text: "อ่านรายการค่าใช้จ่ายในรูปนี้ แยกเป็นรายการ ตอบเป็น JSON array" },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`AI gateway ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json = await res.json() as any;
    const content = json?.choices?.[0]?.message?.content ?? "[]";
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { parsed = []; }
    const items = Array.isArray(parsed) ? parsed : (parsed.items ?? parsed.results ?? parsed.expenses ?? []);
    return { items: items as Array<{ category: string; name: string; amount: number; note?: string }> };
  });
