import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileDown, Mail, Phone, User as UserIcon, Trash2, MessageCircle, FileSpreadsheet } from "lucide-react";
import { formatBRL, formatDate } from "@/lib/categories";
import { generateVoucherPDF } from "@/lib/voucher";
import * as XLSX from "xlsx";

interface Booking {
  id: string;
  user_id: string;
  package_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: string;
  voucher_code: string | null;
  created_at: string;
  canceled_by?: string | null;
  packages?: { title: string; location: string; departure_date: string; duration_days: number } | null;
  profile?: { full_name: string | null; phone: string | null; email: string | null } | null;
}

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

const buildWhatsappMessage = (b: Booking) =>
  `Olá ${b.profile?.full_name || ""} estamos entrando em contato para confirmar sua reserva ${b.voucher_code || ""} do pacote "${b.packages?.title || ""}". digite 1- para prosseguir com pagamento e 2 - para cancelar reserva.\n\nLembrando que a sua reserva fica pré-agendada por apenas 72 horas. Após esse período, o sistema libera as vagas automaticamente. não perca sua chance de garantir seus dias lazer!!`;

const buildWhatsappUrl = (phone: string | null | undefined, message: string) => {
  const digits = onlyDigits(phone || "");
  if (!digits) return null;
  const intl = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
};

export const BookingsPanel = () => {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [reportFrom, setReportFrom] = useState(monthAgo);
  const [reportTo, setReportTo] = useState(today);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Booking[]>("/bookings/admin");
      setRows(data || []);
    } catch (err) {
      toast.error("Erro ao carregar reservas");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleGenerateVoucher = async (b: Booking) => {
    if (!b.voucher_code) { toast.error("Voucher indisponível"); return; }
    generateVoucherPDF({
      voucher_code: b.voucher_code,
      quantity: b.quantity,
      total_price: Number(b.total_price),
      unit_price: Number(b.unit_price),
      created_at: b.created_at,
      customer: {
        full_name: b.profile?.full_name,
        email: b.profile?.email,
        phone: b.profile?.phone,
      },
      package: {
        title: b.packages?.title,
        location: b.packages?.location,
        departure_date: b.packages?.departure_date,
        duration_days: b.packages?.duration_days,
      },
    });

    if (b.status !== "pagamento_finalizado") {
      try {
        await api.put(`/bookings/${b.id}`, { status: "pagamento_finalizado" });
      } catch (err: any) {
        toast.error(err.message);
        return;
      }
    }

    const url = buildWhatsappUrl(
      b.profile?.phone,
      `Olá ${b.profile?.full_name || ""}! Segue em anexo o voucher da sua reserva ${b.voucher_code} - pacote "${b.packages?.title || ""}". Boa viagem! 🌴✈️`
    );
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Voucher baixado. Anexe o PDF no WhatsApp aberto.");
    } else {
      toast.success("Voucher gerado (cliente sem telefone)");
    }
    load();
  };

  const handleDelete = async (b: Booking) => {
    if (!confirm(`Apagar a reserva ${b.voucher_code || ""}? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/bookings/${b.id}`);
      toast.success("Reserva apagada");
      load();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleContact = (b: Booking) => {
    const url = buildWhatsappUrl(b.profile?.phone, buildWhatsappMessage(b));
    if (!url) { toast.error("Cliente sem telefone cadastrado"); return; }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const exportReport = async () => {
    const fromIso = new Date(reportFrom + "T00:00:00").toISOString();
    const toIso = new Date(reportTo + "T23:59:59").toISOString();
    try {
      const data = await api.get<Booking[]>(`/bookings/report?from=${fromIso}&to=${toIso}`);
      const list = data || [];
      const sheetData = list.map((b) => {
        return {
          "Voucher": b.voucher_code || "",
          "Cliente": b.profile?.full_name || "",
          "Email": b.profile?.email || "",
          "Telefone": b.profile?.phone || "",
          "Pacote": b.packages?.title || "",
          "Destino": b.packages?.location || "",
          "Data partida": b.packages?.departure_date ? formatDate(b.packages.departure_date) : "",
          "Viajantes": b.quantity,
          "Valor unitário": Number(b.unit_price),
          "Valor total": Number(b.total_price),
          "Status": b.status,
          "Data reserva": formatDate(b.created_at),
        };
      });
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Reservas");
      XLSX.writeFile(wb, `relatorio-reservas-${reportFrom}-a-${reportTo}.xlsx`);
      toast.success(`${list.length} reserva(s) exportada(s)`);
      setReportOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const pendentes = useMemo(() => rows.filter((r) => r.status === "aguardando_pagamento"), [rows]);
  const finalizadas = useMemo(() => rows.filter((r) => r.status === "pagamento_finalizado"), [rows]);
  const canceladasUsuario = useMemo(() => rows.filter((r) => r.status === "cancelado" && (r as any).canceled_by === "user"), [rows]);

  const renderCard = (b: Booking) => (
    <Card key={b.id} className="shadow-card-soft">
      <CardContent className="p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="font-serif text-lg font-bold">{b.packages?.title || "Pacote"}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {b.packages?.location} · {b.packages?.departure_date && formatDate(b.packages.departure_date)}
            </div>
          </div>
          <Badge className={
            b.status === "pagamento_finalizado" ? "bg-emerald-100 text-emerald-900 hover:bg-emerald-100"
            : b.status === "cancelado" ? "bg-red-100 text-red-900 hover:bg-red-100"
            : "bg-sky-100 text-sky-900 hover:bg-sky-100"}>
            {b.status === "pagamento_finalizado" ? "Pagamento finalizado"
              : b.status === "cancelado" ? "Cancelado pelo usuário"
              : "Aguardando pagamento"}
          </Badge>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 text-sm rounded-lg bg-muted/40 p-3">
          <div className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-accent" /> {b.profile?.full_name || "—"}</div>
          <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-accent" /> {b.profile?.phone || "—"}</div>
          <div className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 text-accent" /> <span className="truncate">{b.profile?.email || "—"}</span></div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="text-muted-foreground">
            Viajantes: <strong className="text-foreground">{b.quantity}</strong> · Total:{" "}
            <strong className="text-primary">{formatBRL(Number(b.total_price))}</strong> ·{" "}
            <span className="font-mono text-xs">{b.voucher_code}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {b.status !== "cancelado" && (
              <>
                <Button size="sm" variant="outline" onClick={() => handleContact(b)}
                  title="Contatar via WhatsApp"
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                  <MessageCircle className="mr-1.5 h-4 w-4" /> Contatar
                </Button>
                <Button size="sm" onClick={() => handleGenerateVoucher(b)}
                  className="bg-gradient-gold text-primary hover:opacity-90 shadow-gold">
                  <FileDown className="mr-1.5 h-4 w-4" />
                  {b.status === "pagamento_finalizado" ? "Reenviar voucher" : "Gerar voucher"}
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={() => handleDelete(b)} title="Apagar reserva">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-muted-foreground">
          Reservas com mais de 72h aguardando pagamento são canceladas automaticamente.
        </p>
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Relatório
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Exportar relatório de reservas</DialogTitle></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="from">De</Label>
                <Input id="from" type="date" value={reportFrom} onChange={(e) => setReportFrom(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="to">Até</Label>
                <Input id="to" type="date" value={reportTo} onChange={(e) => setReportTo(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={exportReport} className="bg-gradient-gold text-primary hover:opacity-90">
                <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Baixar Excel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <section>
        <h3 className="font-serif text-xl font-bold mb-3">Aguardando pagamento</h3>
        {loading ? <p className="text-muted-foreground text-sm">Carregando...</p> :
          pendentes.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">
              Nenhuma reserva aguardando pagamento.
            </CardContent></Card>
          ) : (
            <div className="space-y-3">{pendentes.map(renderCard)}</div>
          )}
      </section>

      <section>
        <h3 className="font-serif text-xl font-bold mb-3">Pagamento finalizado</h3>
        {finalizadas.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma reserva com pagamento finalizado ainda.
          </CardContent></Card>
        ) : (
          <div className="space-y-3">{finalizadas.map(renderCard)}</div>
        )}
      </section>

      <section>
        <h3 className="font-serif text-xl font-bold mb-3">Cancelados pelo usuário</h3>
        {canceladasUsuario.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            Nenhum cancelamento de usuário registrado.
          </CardContent></Card>
        ) : (
          <div className="space-y-3">{canceladasUsuario.map(renderCard)}</div>
        )}
      </section>
    </div>
  );
};
