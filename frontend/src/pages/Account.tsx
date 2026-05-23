import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi, bookingsApi, type Booking } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Ticket, XCircle, User as UserIcon } from "lucide-react";

const statusLabels: Record<string, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
  aguardando_pagamento: { label: "Aguardando pagamento", cls: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
  pago: { label: "Pago", cls: "bg-green-500/15 text-green-700 border-green-500/30" },
  confirmado: { label: "Confirmado", cls: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  pagamento_finalizado: { label: "Pagamento finalizado", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  concluido: { label: "Concluído", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  cancelado: { label: "Cancelado", cls: "bg-red-500/15 text-red-700 border-red-500/30" },
};
const ACTIVE_STATUSES = ["pendente", "aguardando_pagamento", "pago", "confirmado", "pagamento_finalizado", "concluido"];
const CANCELABLE_STATUSES = ["pendente", "aguardando_pagamento"];

const BookingsList = ({ rows, emptyMsg, onCancel }: { rows: Booking[]; emptyMsg: string; onCancel?: (id: string) => void }) => {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{emptyMsg}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((b) => {
        const st = statusLabels[b.status] || { label: b.status, cls: "bg-muted text-foreground" };
        return (
          <li key={b.id} className="rounded-lg border p-4 text-sm space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="font-semibold truncate">{b.packages?.title || "Pacote"}</div>
                {b.packages?.location && <div className="text-xs text-muted-foreground">{b.packages.location}</div>}
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs whitespace-nowrap ${st.cls}`}>{st.label}</span>
            </div>
            {/* Titular da reserva */}
            {(b.user_full_name || b.user_rg) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground rounded bg-muted/40 px-3 py-2">
                {b.user_full_name && (
                  <span><span className="font-medium text-foreground">Titular:</span> {b.user_full_name}</span>
                )}
                {b.user_rg && (
                  <span><span className="font-medium text-foreground">RG:</span> <span className="font-mono">{b.user_rg}</span></span>
                )}
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2">
              <span>Reservado em {new Date(b.created_at).toLocaleDateString("pt-BR")}</span>
              <span>{b.quantity} viajante(s)</span>
              <span className="font-semibold text-foreground">{Number(b.total_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
            {b.voucher_code && (
              <div className="text-xs text-muted-foreground">Voucher: <span className="font-mono">{b.voucher_code}</span></div>
            )}
            {CANCELABLE_STATUSES.includes(b.status) && onCancel && (
              <div className="pt-2">
                <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => onCancel(b.id)}>
                  Cancelar reserva
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

const Account = () => {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "dados";
  const [profile, setProfile] = useState<{ full_name: string; phone: string }>({ full_name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { nav("/auth"); return; }
    if (!user) return;
    setProfile({ full_name: user.full_name || "", phone: user.phone || "" });
    bookingsApi.mine()
      .then(setBookings)
      .catch(() => toast.error("Erro ao carregar reservas"))
      .finally(() => setLoadingBookings(false));
  }, [user, authLoading, nav]);

  const active = useMemo(() => bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)), [bookings]);
  const canceled = useMemo(() => bookings.filter((b) => b.status === "cancelado"), [bookings]);

  const saveProfile = async () => {
    if (!profile.phone || !/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(profile.phone.trim())) {
      toast.error("Contato inválido. Ex: (11) 91234-5678"); return;
    }
    setSavingProfile(true);
    try {
      await authApi.updateProfile({ full_name: profile.full_name, phone: profile.phone });
      toast.success("Dados atualizados");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setSavingProfile(false); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta reserva?")) return;
    try {
      await bookingsApi.cancel(id);
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: "cancelado" } : b));
      toast.success("Reserva cancelada");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Erro ao cancelar"); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10 space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-bold md:text-4xl">Minha conta</h1>
          <p className="mt-1 text-muted-foreground">Gerencie seus dados e visualize suas reservas</p>
        </div>
        <Tabs value={tab} onValueChange={(v) => setParams(v === "dados" ? {} : { tab: v })}>
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="dados"><UserIcon className="mr-1.5 h-4 w-4" />Meus dados</TabsTrigger>
            <TabsTrigger value="reservas"><Ticket className="mr-1.5 h-4 w-4" />Minhas reservas</TabsTrigger>
            <TabsTrigger value="canceladas"><XCircle className="mr-1.5 h-4 w-4" />Canceladas</TabsTrigger>
          </TabsList>
          <TabsContent value="dados">
            <Card>
              <CardHeader><CardTitle className="font-serif text-xl">Meus dados</CardTitle></CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div><Label>Nome completo</Label>
                  <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
                <div><Label>Contato (telefone com DDD)</Label>
                  <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="(11) 91234-5678" /></div>
                <div className="md:col-span-2">
                  <Button onClick={saveProfile} disabled={savingProfile} className="bg-primary hover:bg-primary-glow">
                    <Save className="mr-1.5 h-4 w-4" />{savingProfile ? "Salvando..." : "Salvar dados"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reservas">
            <Card>
              <CardHeader><CardTitle className="font-serif text-xl">Minhas reservas</CardTitle></CardHeader>
              <CardContent>
                {loadingBookings ? <p className="text-sm text-muted-foreground">Carregando...</p>
                  : <BookingsList rows={active} emptyMsg="Você ainda não possui reservas." onCancel={handleCancel} />}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="canceladas">
            <Card>
              <CardHeader><CardTitle className="font-serif text-xl">Reservas canceladas</CardTitle></CardHeader>
              <CardContent>
                {loadingBookings ? <p className="text-sm text-muted-foreground">Carregando...</p>
                  : <BookingsList rows={canceled} emptyMsg="Nenhuma reserva cancelada." />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Account;
