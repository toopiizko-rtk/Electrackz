import { useRef } from "react";
import { FileText, FileSpreadsheet, Copy, Share2, X } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, Button,
} from "@/components/electrack/ui";
import { fmtMoney, fmtDate, type Site, type WorkLog, type Expense } from "@/lib/electrack";

type Props = {
  open: boolean;
  onClose: () => void;
  site: Site | null;
  logs: WorkLog[];
  expenses: Expense[];
};

export function ExportShareModal({ open, onClose, site, logs, expenses }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  if (!site) return null;

  const siteLogs = logs.filter((l) => l.site_id === site.id).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const siteExps = expenses.filter((e) => e.site_id === site.id).sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const totalExp = siteExps.reduce((a, e) => a + Number(e.amount || 0), 0);
  const profit = Number(site.income || 0) - totalExp;

  const buildText = () => {
    const lines: string[] = [];
    lines.push(`📋 รายงาน: ${site.name}`);
    if (site.client) lines.push(`👤 ${site.client}`);
    if (site.address) lines.push(`📍 ${site.address}`);
    lines.push(`สถานะ: ${site.status}`);
    lines.push("");
    lines.push(`💰 รายรับ: ฿${fmtMoney(site.income)}`);
    lines.push(`💸 รายจ่าย: ฿${fmtMoney(totalExp)}`);
    lines.push(`📊 กำไร: ฿${fmtMoney(profit)}`);
    if (siteLogs.length) {
      lines.push("");
      lines.push("📋 บันทึกงาน:");
      for (const l of siteLogs) {
        lines.push(`• ${fmtDate(l.date)} [${l.category}] ${l.detail} — ${l.qty} ${l.unit}${l.note ? ` (${l.note})` : ""}`);
      }
    }
    if (siteExps.length) {
      lines.push("");
      lines.push("💸 ค่าใช้จ่าย:");
      for (const e of siteExps) {
        lines.push(`• ${fmtDate(e.date)} [${e.category}] ${e.name || "-"} — ฿${fmtMoney(e.amount)}`);
      }
    }
    return lines.join("\n");
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(buildText());
      alert("คัดลอกแล้ว");
    } catch {
      alert("คัดลอกไม่สำเร็จ");
    }
  };

  const shareLine = () => {
    const text = encodeURIComponent(buildText());
    window.open(`https://line.me/R/share?text=${text}`, "_blank");
  };

  const exportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      const summary = [
        ["ไซต์", site.name],
        ["ผู้ว่าจ้าง", site.client || ""],
        ["ที่อยู่", site.address || ""],
        ["สถานะ", site.status],
        ["รายรับ", Number(site.income || 0)],
        ["รายจ่ายรวม", totalExp],
        ["กำไร", profit],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "สรุป");

      const logsRows = [
        ["วันที่", "หมวด", "รายละเอียด", "จำนวน", "หน่วย", "หมายเหตุ"],
        ...siteLogs.map((l) => [l.date, l.category, l.detail, Number(l.qty), l.unit, l.note || ""]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(logsRows), "บันทึกงาน");

      const expRows = [
        ["วันที่", "หมวด", "รายการ", "จำนวนเงิน", "หมายเหตุ"],
        ...siteExps.map((e) => [e.date, e.category, e.name || "", Number(e.amount), e.note || ""]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expRows), "ค่าใช้จ่าย");

      XLSX.writeFile(wb, `${site.name}.xlsx`);
    } catch (e: any) {
      console.error("Excel export failed", e);
      alert("Export Excel ไม่สำเร็จ: " + (e?.message || e));
    }
  };

  const exportPDF = async () => {
    const node = previewRef.current;
    if (!node) return;
    try {
      const dataUrl = await toJpeg(node, { backgroundColor: "#ffffff", quality: 0.92, pixelRatio: 2, cacheBust: true });
      // measure
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error("img load")); });
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 40;
      const ratio = img.height / img.width;
      const imgH = imgW * ratio;
      if (imgH <= pageH - 40) {
        pdf.addImage(dataUrl, "JPEG", 20, 20, imgW, imgH);
      } else {
        // slice via canvas
        const pxPerPt = img.width / imgW;
        const pageSliceH = (pageH - 40) * pxPerPt;
        let offset = 0;
        while (offset < img.height) {
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = Math.min(pageSliceH, img.height - offset);
          const ctx = c.getContext("2d")!;
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, offset, img.width, c.height, 0, 0, img.width, c.height);
          const slice = c.toDataURL("image/jpeg", 0.92);
          if (offset > 0) pdf.addPage();
          pdf.addImage(slice, "JPEG", 20, 20, imgW, (c.height / img.width) * imgW);
          offset += c.height;
        }
      }
      pdf.save(`${site.name}.pdf`);
    } catch (e: any) {
      console.error("PDF export failed", e);
      alert("Export PDF ไม่สำเร็จ: " + (e?.message || e));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>📤 ส่งออก/แชร์ — {site.name}</DialogTitle>
          <DialogClose />
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button variant="secondary" onClick={exportPDF}><FileText className="h-4 w-4" /> PDF</Button>
          <Button variant="secondary" onClick={exportExcel}><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
          <Button variant="secondary" onClick={copyText}><Copy className="h-4 w-4" /> คัดลอก</Button>
          <Button variant="secondary" onClick={shareLine} className="bg-[#06c755]/10 text-[#06c755] hover:bg-[#06c755]/20"><Share2 className="h-4 w-4" /> LINE</Button>
        </div>

        {/* Hidden-ish PDF source — visible but compact */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div ref={previewRef} style={{ background: "#ffffff", color: "#111", padding: 24, fontFamily: "'Sarabun','Prompt','Helvetica',sans-serif", fontSize: 12 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{site.name}</h2>
            <div style={{ color: "#666", marginTop: 4 }}>
              {site.client && <span>👤 {site.client} &nbsp;</span>}
              {site.address && <span>📍 {site.address}</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 12 }}>
              <Stat label="รายรับ" val={`฿${fmtMoney(site.income)}`} color="#059669" />
              <Stat label="รายจ่าย" val={`฿${fmtMoney(totalExp)}`} color="#dc2626" />
              <Stat label="กำไร" val={`฿${fmtMoney(profit)}`} color={profit >= 0 ? "#059669" : "#dc2626"} />
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 16, marginBottom: 6 }}>บันทึกงาน ({siteLogs.length})</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ background: "#f3f4f6" }}>
                {["วันที่", "หมวด", "รายละเอียด", "จำนวน", "หมายเหตุ"].map((h) => (
                  <th key={h} style={{ border: "1px solid #ddd", padding: 4, textAlign: "left" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {siteLogs.map((l) => (
                  <tr key={l.id}>
                    <td style={cellS}>{fmtDate(l.date)}</td>
                    <td style={cellS}>{l.category}</td>
                    <td style={cellS}>{l.detail}</td>
                    <td style={cellS}>{l.qty} {l.unit}</td>
                    <td style={cellS}>{l.note || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 16, marginBottom: 6 }}>ค่าใช้จ่าย ({siteExps.length})</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead><tr style={{ background: "#f3f4f6" }}>
                {["วันที่", "หมวด", "รายการ", "จำนวนเงิน"].map((h) => (
                  <th key={h} style={{ border: "1px solid #ddd", padding: 4, textAlign: "left" }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {siteExps.map((e) => (
                  <tr key={e.id}>
                    <td style={cellS}>{fmtDate(e.date)}</td>
                    <td style={cellS}>{e.category}</td>
                    <td style={cellS}>{e.name || ""}</td>
                    <td style={cellS}>฿{fmtMoney(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const cellS: React.CSSProperties = { border: "1px solid #ddd", padding: 4 };
function Stat({ label, val, color }: { label: string; val: string; color: string }) {
  return (
    <div style={{ background: "#f9fafb", borderRadius: 8, padding: 8, textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "#666" }}>{label}</div>
      <div style={{ fontWeight: 700, color }}>{val}</div>
    </div>
  );
}
