## ความเข้าใจโปรเจกต์ (สรุปจาก zip ที่อัปโหลด)

**ElecTrack v2** — แอปจัดการงานช่างไฟ (Thai) ดีไซน์ dark / yellow accent
- โครงสร้าง: Vite + React 18 + Tailwind 3 + Supabase
- 5 หน้า: หน้าหลัก / ไซต์ / ปฏิทิน / บันทึก / สรุป + Bottom Nav มีปุ่ม `+` กลาง (Quick Add)
- ตารางใน Supabase: `sites` (มี `dates: string[]`), `work_logs`, `expenses`
- Modals: AddSite, EditSite, AddLog, AddExpense (มี OCR สลิปด้วย Claude API), SiteDetail, Export
- รูปจอ: หน้า "ไซต์งาน" แต่ละการ์ดมี badge สถานะ + อยากให้มีปุ่ม **+Add Date** ตรงข้างชื่อไซต์

## เป้าหมายการแก้/เพิ่ม

### UI/UX
1. ลบปุ่ม `+` กลาง bottom bar (Quick Add) ออก — bottom bar เหลือแค่ 5 แท็บปกติ
2. ย้ายฟังก์ชัน "เพิ่มวันทำงาน" มาเป็นปุ่ม **+Add Date** บน card ไซต์ (หน้า Sites) ติดข้างชื่อไซต์ — กดแล้วเปิด date picker เพิ่มวันให้ไซต์นั้นทันที (อัปเดต `sites.dates`)
3. ทำให้ responsive จริง: mobile / tablet / desktop (ปัจจุบันถูก lock ที่ `max-w-[430px]`) — เปลี่ยนเป็น layout ยืดได้, bottom nav บน mobile / side หรือ top nav บน desktop

### Features
4. แก้ไข + บันทึกบันทึกงาน (work logs): เปิด `EditLogModal`, เพิ่ม `updateLog` ใน hook + ปุ่ม edit ในหน้า Logs และใน SiteDetail
5. Sync ปฏิทิน ↔ ไซต์: เวลาเพิ่ม/บันทึกวันใน site → แสดงในปฏิทินทันที (ทำงานอยู่แล้วผ่าน `sites.dates` แต่ต้องมั่นใจว่า `+Add Date` เรียก `updateSite` แล้ว state รีเฟรช)
6. อัปโหลดรูปรายงานความคืบหน้าหน้างาน:
   - เพิ่มฟิลด์ `photos: text[]` (URL) ใน `work_logs` (migration)
   - สร้าง storage bucket `work-photos` (public) + RLS
   - UI อัปโหลดหลายรูปใน AddLog/EditLog + แสดง gallery ใน SiteDetail
7. Image compression ก่อนอัป: client-side resize → max 1600px, JPEG quality ~0.75 ผ่าน `<canvas>` (ไม่ต้องพึ่ง lib ภายนอก)

## Technical plan

**Stack mapping (zip → template):**
- โปรเจกต์ template เป็น TanStack Start + TS + Tailwind v4 + shadcn-style tokens
- จะ port โค้ด JSX → TSX, ใช้ semantic tokens ใน `src/styles.css` (ไม่ฮาร์ดโค้ด `bg-zinc-950` ตรงๆ — สร้าง dark theme ใน `:root`)
- ใช้ Lovable Cloud (Supabase) แทน Supabase ตรงๆ; เปิด integration → migrate schema:
  ```sql
  create table sites (id uuid pk, name text, address text, client text,
    status text, income numeric, dates text[] default '{}', created_at timestamptz default now());
  create table work_logs (id uuid pk, site_id uuid fk sites, date date,
    category text, detail text, qty numeric, unit text, note text,
    photos text[] default '{}', created_at timestamptz default now());
  create table expenses (id uuid pk, site_id uuid fk sites, date date,
    category text, name text, amount numeric, note text, created_at timestamptz default now());
  -- RLS: open for now (no auth in original); can tighten later
  ```
- Storage: bucket `work-photos` public, policy ให้ insert/select ได้
- Routes: หน้าเดียว `src/routes/index.tsx` ทำเป็น app shell + ใช้ tab state (เหมือน original) — ไม่ต้อง split route เพราะเป็น app, ไม่ใช่ landing
- AI OCR: เก็บ feature ไว้ แต่เปลี่ยนไปเรียกผ่าน Lovable AI Gateway (server function) แทน Anthropic API ตรงๆ ที่จะโดน CORS

**Files to create:**
- `src/styles.css` — เพิ่ม dark theme tokens (yellow primary, zinc surfaces)
- `src/lib/supabase.ts`, `src/lib/utils.ts`, `src/lib/hooks.ts`, `src/lib/image.ts` (compression)
- `src/components/ui.tsx` (port), `src/components/Modals.tsx` (port + EditLog + photo upload)
- `src/components/App.tsx` (port หน้าหลัก) เรียกใน `src/routes/index.tsx`
- Migration SQL สำหรับ tables + storage bucket

**คำถาม:** ใช้ schema ตามนี้ได้เลยไหม และ OCR สลิปจะเปลี่ยนไปใช้ Lovable AI (Gemini) แทน Claude direct โอเคไหม? ถ้าโอเคจะลุยเลยครับ
