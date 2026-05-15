import jsPDF from "jspdf";
import { formatBRL, formatDate } from "./categories";

export interface VoucherData {
  voucher_code: string;
  quantity: number;
  total_price: number;
  unit_price?: number;
  created_at?: string;
  customer: { full_name?: string | null; email?: string | null; phone?: string | null };
  package: {
    title?: string; location?: string; departure_date?: string; duration_days?: number;
  };
}

export const generateVoucherPDF = (v: VoucherData) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(15, 27, 61);
  doc.rect(0, 0, W, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("D+ TURISMO", 15, 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Voucher de Viagem", W - 15, 19, { align: "right" });

  // Voucher code box
  doc.setTextColor(15, 27, 61);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Código do voucher", 15, 45);
  doc.setFontSize(18);
  doc.setTextColor(201, 168, 76);
  doc.text(v.voucher_code, 15, 54);

  let y = 70;
  const section = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 27, 61);
    doc.text(title, 15, y);
    doc.setDrawColor(220);
    doc.line(15, y + 1.5, W - 15, y + 1.5);
    y += 8;
  };
  const row = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(label, 15, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text(value || "—", 15, y + 5);
    y += 12;
  };

  section("Dados do cliente");
  row("Nome", v.customer.full_name || "—");
  row("E-mail", v.customer.email || "—");
  row("Contato", v.customer.phone || "—");

  y += 2;
  section("Pacote");
  row("Título", v.package.title || "—");
  row("Destino", v.package.location || "—");
  row("Data de partida", v.package.departure_date ? formatDate(v.package.departure_date) : "—");
  if (v.package.duration_days) row("Duração", `${v.package.duration_days} ${v.package.duration_days === 1 ? "dia" : "dias"}`);

  y += 2;
  section("Reserva");
  row("Quantidade de viajantes", String(v.quantity));
  if (v.unit_price) row("Valor unitário", formatBRL(Number(v.unit_price)));
  row("Valor total", formatBRL(Number(v.total_price)));
  if (v.created_at) row("Data da reserva", formatDate(v.created_at));

  // Footer
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Apresente este voucher no embarque. Em caso de dúvidas, entre em contato com a D+ Turismo.", 15, 280);

  doc.save(`voucher-${v.voucher_code}.pdf`);
};
