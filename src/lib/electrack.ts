import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const todayStr = () => new Date().toISOString().split("T")[0];

export const fmtMoney = (n: number | string | null | undefined) =>
  Number(n || 0).toLocaleString("th-TH", { minimumFractionDigits: 0 });

export const fmtDate = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
};

export const fmtShort = (d?: string | null) => {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
};

export const TH_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัส", "ศุกร์", "เสาร์"];
export const TH_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
export const TH_MONTHS_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

export const STATUSES = ["กำลังทำ", "เสร็จแล้ว", "รอเริ่ม"] as const;
export type Status = (typeof STATUSES)[number];

export const WORK_CATS = ["เดินสาย", "เดินท่อ", "ติดตั้ง", "ทดสอบ", "รื้อถอน", "อื่นๆ"];
export const WORK_UNITS = ["m", "จุด", "ชุด", "อัน", "แผง", "วงจร", "ชั่วโมง"];
export const EXP_CATS = [
  { label: "อุปกรณ์ไฟฟ้า", color: "#f5c518" },
  { label: "ค่าเดินทาง", color: "#29d97a" },
  { label: "ค่าแรงช่วย", color: "#4db8ff" },
  { label: "อื่นๆ", color: "#94a3b8" },
];

export const STATUS_COLOR: Record<string, string> = {
  "กำลังทำ": "text-yellow-400",
  "เสร็จแล้ว": "text-emerald-400",
  "รอเริ่ม": "text-sky-400",
};

export const STATUS_BG: Record<string, string> = {
  "กำลังทำ": "bg-yellow-400/10 text-yellow-400 border-yellow-400/30",
  "เสร็จแล้ว": "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
  "รอเริ่ม": "bg-sky-400/10 text-sky-400 border-sky-400/30",
};

export const STATUS_DOT: Record<string, string> = {
  "กำลังทำ": "#f5c518",
  "เสร็จแล้ว": "#29d97a",
  "รอเริ่ม": "#4db8ff",
};

export type Site = {
  id: string;
  name: string;
  address: string | null;
  client: string | null;
  status: string;
  income: number;
  dates: string[];
  created_at: string;
};

export type WorkLog = {
  id: string;
  site_id: string | null;
  date: string;
  category: string;
  detail: string;
  qty: number;
  unit: string;
  note: string | null;
  photos: string[];
  created_at: string;
};

export type Expense = {
  id: string;
  site_id: string | null;
  date: string;
  category: string;
  name: string | null;
  amount: number;
  note: string | null;
  created_at: string;
};
