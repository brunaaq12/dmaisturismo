import { useEffect, useMemo, useState } from "react";
import { accommodationsApi, bookingsApi, type Booking } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const ACC_OPTIONS = [
  { value: "casal", label: "Casal" },
  { value: "duplo", label: "Duplo" },
  { value: "tpl_cama_solteiro", label: "TPL CAMA SOLTEIRO" },
  { value: "tpl_cama_casal", label: "TPL CAMA CASAL" },
];
const PURCHASE_OPTIONS = [
  { value: "site", label: "Site" },
  { value: "whatsapp", label: "WhatsApp" },
];

interface EntryRow {
  id?: string;
  booking_id: string | null;
  client_name: string;
  client_rg: string;
  package_title: string;
  pax: number;
  accommodation_type: string;
  obs: string;
  purchase_type: string;
  is_manual: boolean;
  dirty?: boolean;
}

/** Retorna titular + acompanhantes, titular sempre em primeiro */
function allPassengers(b: Booking) {
  const titular = { full_name: b.user_full_name || "", rg: b.user_rg || "", role: "Titular" };
  const extras = (Array.isArray(b.passengers) ? b.passengers : [])
    .filter((p) => p.full_name && p.full_name.trim().toLowerCase() !== (b.user_full_name || "").trim().toLowerCase())
    .map((p) => ({ ...p, role: "Acompanhante" }));
  return [titular, ...extras];
}

export const AccommodationsReport = () => {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // Busca TODAS as reservas pagas (sem filtro de data — a data é só para entradas manuais)
      const bookings = await bookingsApi.all({ status: "pagamento_finalizado" });
      const entries = await accommodationsApi.list({ from, to }) as (Record<string, unknown> & { booking_id?: string | null; is_manual?: number | boolean })[];
      const byBooking: Record<string, Record<string, unknown>> = {};
      const manuals: Record<string, unknown>[] = [];
      entries.forEach((e) => {
        if (e.is_manual || !e.booking_id) manuals.push(e);
        else byBooking[e.booking_id as string] = e;
      });

      // Uma linha por pessoa (titular + acompanhantes)
      // Nota: não replicamos o id da accommodation_entry para evitar conflito de save em múltiplas linhas
      const bookingRows: EntryRow[] = [];
      for (const b of bookings) {
        const e = byBooking[b.id];
        const pessoas = allPassengers(b);
        for (const p of pessoas) {
          bookingRows.push({
            // Só a primeira linha da reserva carrega o id da entrada salva
            // (para edição/save individual de acomodação)
            id: undefined,
            booking_id: b.id,
            client_name: p.full_name,
            client_rg: p.rg || "",
            package_title: (e?.package_title as string) ?? (b.packages?.title ?? ""),
            pax: Number(e?.pax ?? b.quantity),
            accommodation_type: (e?.accommodation_type as string) ?? "casal",
            obs: (e?.obs as string) ?? "",
            purchase_type: (e?.purchase_type as string) ?? "site",
            is_manual: false,
            dirty: false,
          });
        }
      }

      const manualRows: EntryRow[] = manuals.map((e) => ({
        id: e.id as string,
        booking_id: null,
        client_name: (e.client_name as string) ?? "",
        client_rg: (e.client_rg as string) ?? "",
        package_title: (e.package_title as string) ?? "",
        pax: Number(e.pax ?? 1),
        accommodation_type: (e.accommodation_type as string) ?? "casal",
        obs: (e.obs as string) ?? "",
        purchase_type: (e.purchase_type as string) ?? "whatsapp",
        is_manual: true,
        dirty: false,
      }));

      setRows([...bookingRows, ...manualRows]);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateRow = (idx: number, field: keyof EntryRow, value: unknown) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value, dirty: true } : r));
  };

  const saveRow = async (idx: number) => {
    const r = rows[idx];
    const payload = {
      client_name: r.client_name, client_rg: r.client_rg,
      package_title: r.package_title,
      pax: r.pax, accommodation_type: r.accommodation_type,
      obs: r.obs, purchase_type: r.purchase_type,
      is_manual: r.is_manual, booking_id: r.booking_id,
    };
    try {
      if (r.id) {
        await accommodationsApi.update(r.id, payload);
      } else {
        const created = await accommodationsApi.create(payload) as { id: string };
        setRows((prev) => prev.map((row, i) => i === idx ? { ...row, id: created.id, dirty: false } : row));
        return;
      }
      setRows((prev) => prev.map((row, i) => i === idx ? { ...row, dirty: false } : row));
      toast.success("Salvo");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro ao salvar"); }
  };

  const addManual = () => {
    setRows((prev) => [...prev, {
      booking_id: null, client_name: "", client_rg: "", package_title: "",
      pax: 1, accommodation_type: "casal", obs: "",
      purchase_type: "whatsapp", is_manual: true, dirty: true,
    }]);
  };

  const deleteRow = async (idx: number) => {
    const r = rows[idx];
    if (r.id) {
      try { await accommodationsApi.delete(r.id); }
      catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro"); return; }
    }
    setRows((prev) => prev.filter((_, i) => i !== idx));
    toast.success("Removido");
  };

  const exportXLSX = () => {
    const data = rows.map((r) => ({
      "Cliente": r.client_name,
      "RG": r.client_rg,
      "Pacote": r.package_title,
      "Pax": r.pax,
      "Acomodação": r.accommodation_type,
      "Obs": r.obs,
      "Via": r.purchase_type,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Acomodações");
    XLSX.writeFile(wb, `acomodacoes-${from}-a-${to}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="font-serif text-xl">Relatório de acomodações</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={addManual}><Plus className="mr-1.5 h-4 w-4" />Entrada manual</Button>
              <Button variant="outline" size="sm" onClick={exportXLSX}><Download className="mr-1.5 h-4 w-4" />Exportar Excel</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div><Label>De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><Label>Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            <div className="flex items-end"><Button onClick={load} disabled={loading}>{loading ? "Carregando..." : "Filtrar"}</Button></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Cliente</th>
                  <th className="pb-2 pr-3 font-medium">RG</th>
                  <th className="pb-2 pr-3 font-medium">Pacote</th>
                  <th className="pb-2 pr-3 font-medium w-16">Pax</th>
                  <th className="pb-2 pr-3 font-medium">Acomodação</th>
                  <th className="pb-2 pr-3 font-medium">Obs</th>
                  <th className="pb-2 pr-3 font-medium">Via</th>
                  <th className="pb-2 font-medium w-20">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-b border-border/50">
                    <td className="py-2 pr-3"><Input value={r.client_name} onChange={(e) => updateRow(idx, "client_name", e.target.value)} className="h-8 text-xs" /></td>
                    <td className="py-2 pr-3"><Input value={r.client_rg} onChange={(e) => updateRow(idx, "client_rg", e.target.value)} className="h-8 text-xs w-28" placeholder="RG" /></td>
                    <td className="py-2 pr-3"><Input value={r.package_title} onChange={(e) => updateRow(idx, "package_title", e.target.value)} className="h-8 text-xs" /></td>
                    <td className="py-2 pr-3"><Input type="number" min={1} value={r.pax} onChange={(e) => updateRow(idx, "pax", Number(e.target.value))} className="h-8 text-xs w-16" /></td>
                    <td className="py-2 pr-3">
                      <Select value={r.accommodation_type} onValueChange={(v) => updateRow(idx, "accommodation_type", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{ACC_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="py-2 pr-3"><Input value={r.obs} onChange={(e) => updateRow(idx, "obs", e.target.value)} className="h-8 text-xs" /></td>
                    <td className="py-2 pr-3">
                      <Select value={r.purchase_type} onValueChange={(v) => updateRow(idx, "purchase_type", v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{PURCHASE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        {r.dirty && <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => saveRow(idx)}><Save className="h-3 w-3" /></Button>}
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => deleteRow(idx)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && !loading && (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
