import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
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
  package_title: string;
  pax: number;
  accommodation_type: string;
  obs: string;
  purchase_type: string;
  is_manual: boolean;
  dirty?: boolean;
}

export const AccommodationsReport = () => {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [hotel, setHotel] = useState("");
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<EntryRow[]>(`/accommodations?from=${from}&to=${to}`);
      setRows(data || []);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = (idx: number, patch: Partial<EntryRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch, dirty: true } : r)));
  };

  const saveRow = async (idx: number) => {
    const r = rows[idx];
    const payload = {
      booking_id: r.booking_id,
      client_name: r.client_name,
      package_title: r.package_title,
      pax: r.pax,
      accommodation_type: r.accommodation_type || null,
      obs: r.obs || null,
      purchase_type: r.purchase_type,
      is_manual: r.is_manual,
    };
    try {
      if (r.id) {
        await api.put(`/accommodations/${r.id}`, payload);
      } else {
        const data = await api.post<{ id: string }>("/accommodations", payload);
        update(idx, { id: data.id, dirty: false });
      }
      toast.success("Salvo");
      update(idx, { dirty: false });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteRow = async (idx: number) => {
    const r = rows[idx];
    if (!confirm("Excluir este registro?")) return;
    if (r.id) {
      try {
        await api.delete(`/accommodations/${r.id}`);
        toast.success("Excluído");
      } catch (err: any) {
        toast.error(err.message);
        return;
      }
    }
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const addManual = () => {
    setRows((prev) => [...prev, {
      booking_id: null,
      client_name: "",
      package_title: "",
      pax: 1,
      accommodation_type: "",
      obs: "",
      purchase_type: "whatsapp",
      is_manual: true,
      dirty: true,
    }]);
  };

  const totalPax = useMemo(() => rows.reduce((s, r) => s + (r.pax || 0), 0), [rows]);

  const exportXlsx = () => {
    if (rows.length === 0) { toast.info("Sem registros para exportar"); return; }
    const aoa: any[][] = [
      ["ROOM LIST - GRUPO D+ TURISMO"],
      [`Hotel: ${hotel || "-"}`],
      [`Período: ${from} a ${to}`],
      [],
      ["QTD PAX", "QTD APT", "HOSPEDAGEM", "OBSERVAÇÃO", "TIPO DE COMPRA"],
    ];
    let paxCounter = 0;
    let aptCounter = 0;
    rows.forEach((r) => {
      aptCounter += 1;
      paxCounter += r.pax || 0;
      const acc = ACC_OPTIONS.find((a) => a.value === r.accommodation_type)?.label || "";
      const purchase = PURCHASE_OPTIONS.find((p) => p.value === r.purchase_type)?.label || "";
      const observ = r.obs || `${r.client_name} • ${r.package_title}`;
      aoa.push([paxCounter, aptCounter, acc, observ, purchase]);
    });
    aoa.push([]);
    aoa.push(["TOTAL PAX", totalPax, "TOTAL APT", rows.length]);
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = [{ wch: 10 }, { wch: 10 }, { wch: 22 }, { wch: 50 }, { wch: 15 }];
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Room List");
    XLSX.writeFile(wb, `room-list-${from}_a_${to}.xlsx`);
    toast.success("Relatório exportado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-xl">Acomodações</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Reservas com pagamento finalizado e registros manuais. Exporte em Excel.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <Label>De</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>Até</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Hotel</Label>
            <Input value={hotel} onChange={(e) => setHotel(e.target.value)} placeholder="Nome do hotel" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>{loading ? "Carregando..." : "Filtrar"}</Button>
          <Button variant="outline" onClick={addManual}>
            <Plus className="mr-1.5 h-4 w-4" /> Novo registro
          </Button>
          <Button onClick={exportXlsx} className="bg-gradient-gold text-primary hover:opacity-90">
            <Download className="mr-1.5 h-4 w-4" /> Exportar Excel
          </Button>
        </div>

        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-left">Cliente</th>
                <th className="p-2 text-left">Pacote</th>
                <th className="p-2 text-left">PAX</th>
                <th className="p-2 text-left">Acomodação</th>
                <th className="p-2 text-left">Obs</th>
                <th className="p-2 text-left">Tipo de compra</th>
                <th className="p-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">Nenhum registro no período.</td></tr>
              )}
              {rows.map((r, i) => (
                <tr key={r.id || `new-${i}`} className="border-t border-border align-top">
                  <td className="p-2">
                    <Input className="h-8" value={r.client_name} onChange={(e) => update(i, { client_name: e.target.value })} />
                  </td>
                  <td className="p-2">
                    <Input className="h-8" value={r.package_title} onChange={(e) => update(i, { package_title: e.target.value })} />
                  </td>
                  <td className="p-2 w-20">
                    <Input type="number" min={1} className="h-8" value={r.pax}
                      onChange={(e) => update(i, { pax: Math.max(1, Number(e.target.value) || 1) })} />
                  </td>
                  <td className="p-2 w-44">
                    <Select value={r.accommodation_type} onValueChange={(v) => update(i, { accommodation_type: v })}>
                      <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {ACC_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input className="h-8" value={r.obs} onChange={(e) => update(i, { obs: e.target.value })} />
                  </td>
                  <td className="p-2 w-36">
                    <Select value={r.purchase_type} onValueChange={(v) => update(i, { purchase_type: v })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PURCHASE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <Button size="sm" variant="outline" onClick={() => saveRow(i)} disabled={!r.dirty}>
                      <Save className="h-3.5 w-3.5 mr-1" /> Salvar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteRow(i)} className="ml-1 text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
