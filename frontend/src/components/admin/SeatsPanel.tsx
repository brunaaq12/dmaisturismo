import { useEffect, useState } from "react";
import { packagesApi, bookingsApi, type Package, type Booking } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Download, Armchair } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface PassengerRow {
  passageiro: string;
  rg: string;
  voucher: string;
  assentoNum: string;
  confirmado: boolean;
}

export const SeatsPanel = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPkgId, setSelectedPkgId] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingPkgs, setLoadingPkgs] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [rows, setRows] = useState<PassengerRow[]>([]);

  // Load all packages
  useEffect(() => {
    packagesApi.all()
      .then((pkgs) => setPackages(pkgs))
      .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Erro ao carregar pacotes"))
      .finally(() => setLoadingPkgs(false));
  }, []);

  // When package is selected, load bookings with pagamento_finalizado
  const handlePkgChange = async (pkgId: string) => {
    setSelectedPkgId(pkgId);
    setRows([]);
    setBookings([]);
    if (!pkgId || pkgId === "__none__") return;

    setLoadingBookings(true);
    try {
      const all = await bookingsApi.all({ status: "pagamento_finalizado" });
      const filtered = all.filter((b) => b.package_id === pkgId);
      setBookings(filtered);

      // Expand passengers
      const expanded: PassengerRow[] = [];
      let seatCounter = 1;
      for (const b of filtered) {
        const passengers: { full_name: string; rg: string }[] =
          Array.isArray(b.passengers) && b.passengers.length > 0
            ? b.passengers
            : [{ full_name: b.user_full_name ?? "", rg: "" }];

        for (const p of passengers) {
          expanded.push({
            passageiro: p.full_name,
            rg: p.rg || "",
            voucher: b.voucher_code || "",
            assentoNum: String(seatCounter++),
            confirmado: false,
          });
        }
      }
      setRows(expanded);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar reservas");
    } finally {
      setLoadingBookings(false);
    }
  };

  const updateRow = (idx: number, field: keyof PassengerRow, value: unknown) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const selectedPkg = packages.find((p) => p.id === selectedPkgId);

  const exportXLSX = () => {
    if (!rows.length) { toast.error("Nenhum passageiro para exportar"); return; }

    const data = rows.map((r) => ({
      "Nº Assento": r.assentoNum,
      "Passageiro": r.passageiro,
      "RG": r.rg,
      "Voucher": r.voucher,
      "Confirmado": r.confirmado ? "Sim" : "Não",
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // Column widths
    ws["!cols"] = [
      { wch: 12 },
      { wch: 30 },
      { wch: 16 },
      { wch: 18 },
      { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    const pkgTitle = selectedPkg?.title?.replace(/[^a-zA-Z0-9]/g, "-").slice(0, 30) || "pacote";
    XLSX.utils.book_append_sheet(wb, ws, "Assentos");
    XLSX.writeFile(wb, `assentos-${pkgTitle}.xlsx`);
    toast.success(`${rows.length} assento(s) exportado(s)`);
  };

  const confirmedCount = rows.filter((r) => r.confirmado).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            <Armchair className="h-5 w-5 text-accent" />
            Definir assentos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Selecione um pacote para visualizar todos os passageiros com pagamento finalizado e atribuir assentos.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Package selector */}
          <div className="max-w-sm">
            <Label>Pacote</Label>
            <Select value={selectedPkgId || "__none__"} onValueChange={handlePkgChange} disabled={loadingPkgs}>
              <SelectTrigger>
                <SelectValue placeholder={loadingPkgs ? "Carregando..." : "Selecione um pacote"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Selecione —</SelectItem>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                    {p.departure_date && (
                      <span className="ml-1 text-muted-foreground text-xs">
                        · {new Date(p.departure_date + "T12:00:00").toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary badges */}
          {selectedPkgId && selectedPkgId !== "__none__" && !loadingBookings && (
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                {bookings.length} reserva(s) pagas
              </Badge>
              <Badge variant="outline" className="text-sky-700 border-sky-300 bg-sky-50">
                {rows.length} passageiro(s)
              </Badge>
              <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                {confirmedCount} confirmado(s)
              </Badge>
            </div>
          )}

          {/* Loading state */}
          {loadingBookings && (
            <p className="text-sm text-muted-foreground animate-pulse">Carregando passageiros...</p>
          )}

          {/* Empty state */}
          {!loadingBookings && selectedPkgId && selectedPkgId !== "__none__" && rows.length === 0 && (
            <div className="rounded-lg border border-border py-10 text-center text-muted-foreground text-sm">
              Nenhum passageiro com pagamento finalizado para este pacote.
            </div>
          )}

          {/* Seats table */}
          {rows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-left text-xs text-muted-foreground border-b border-border">
                    <th className="px-4 py-3 font-medium w-28">Nº Assento</th>
                    <th className="px-4 py-3 font-medium">Passageiro</th>
                    <th className="px-4 py-3 font-medium w-36">RG</th>
                    <th className="px-4 py-3 font-medium w-36">Voucher</th>
                    <th className="px-4 py-3 font-medium w-28 text-center">Confirmado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-border/50 transition-colors ${r.confirmado ? "bg-emerald-50/50" : "hover:bg-muted/30"}`}
                    >
                      <td className="px-4 py-2">
                        <Input
                          value={r.assentoNum}
                          onChange={(e) => updateRow(idx, "assentoNum", e.target.value)}
                          className="h-8 text-xs w-20 font-mono font-semibold"
                          placeholder="Nº"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-medium">{r.passageiro || <span className="text-muted-foreground italic">—</span>}</div>
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-muted-foreground text-xs font-mono">{r.rg || "—"}</span>
                      </td>
                      <td className="px-4 py-2">
                        <span className="font-mono text-xs text-muted-foreground">{r.voucher || "—"}</span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Checkbox
                          checked={r.confirmado}
                          onCheckedChange={(v) => updateRow(idx, "confirmado", Boolean(v))}
                          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Export button — always at bottom, enabled when rows exist */}
          {rows.length > 0 && (
            <div className="flex justify-end pt-2 border-t border-border">
              <Button onClick={exportXLSX} className="bg-gradient-gold text-primary hover:opacity-90 shadow-gold">
                <Download className="mr-1.5 h-4 w-4" />
                Exportar Excel ({rows.length} assento{rows.length !== 1 ? "s" : ""})
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};
