import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, User, LogOut, Shield, ShoppingCart, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { bookingsApi, type Booking } from "@/lib/api";

const statusLabels: Record<string, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
  aguardando_pagamento: { label: "Aguardando pagamento", cls: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30" },
  pago: { label: "Pago", cls: "bg-green-500/15 text-green-700 border-green-500/30" },
  confirmado: { label: "Confirmado", cls: "bg-blue-500/15 text-blue-700 border-blue-500/30" },
  pagamento_finalizado: { label: "Pagamento finalizado", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  concluido: { label: "Concluído", cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  cancelado: { label: "Cancelado", cls: "bg-red-500/15 text-red-700 border-red-500/30" },
};

export const MobileMenu = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) { setBookings(null); return; }
    setLoading(true);
    bookingsApi.mine()
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, [open, user]);

  const go = (path: string) => { setOpen(false); nav(path); };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden" aria-label="Menu"><Menu className="h-5 w-5" /></Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto p-0">
        <SheetHeader className="p-4 border-b"><SheetTitle className="font-serif">Menu</SheetTitle></SheetHeader>
        <nav className="flex flex-col p-2 text-sm">
          <SheetClose asChild><Link to="/" className="px-3 py-2 rounded-md hover:bg-accent/10">Pacotes</Link></SheetClose>
          <SheetClose asChild><a href="#sobre" className="px-3 py-2 rounded-md hover:bg-accent/10">Sobre</a></SheetClose>
          <SheetClose asChild><a href="#contato" className="px-3 py-2 rounded-md hover:bg-accent/10">Contato</a></SheetClose>
          <Separator className="my-2" />
          <button onClick={() => go("/carrinho")} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/10">
            <span className="flex items-center gap-2"><ShoppingCart className="h-4 w-4" />Carrinho</span>
            {count > 0 && <Badge className="bg-accent text-accent-foreground">{count}</Badge>}
          </button>
          {user ? (
            <>
              <button onClick={() => go("/conta")} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/10"><User className="h-4 w-4" />Meus dados</button>
              {isAdmin && <button onClick={() => go("/admin")} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/10"><Shield className="h-4 w-4" />Painel Admin</button>}
            </>
          ) : (
            <button onClick={() => go("/auth")} className="px-3 py-2 rounded-md hover:bg-accent/10 text-left">Entrar</button>
          )}
        </nav>
        {user && (
          <div className="px-4 pb-4">
            <div className="flex items-center gap-2 mt-2 mb-3"><Ticket className="h-4 w-4 text-accent" /><h3 className="font-semibold text-sm">Minhas reservas</h3></div>
            {loading && <p className="text-xs text-muted-foreground">Carregando...</p>}
            {!loading && bookings && bookings.length === 0 && <p className="text-xs text-muted-foreground">Você ainda não tem reservas.</p>}
            {!loading && bookings && bookings.length > 0 && (
              <ul className="space-y-2">
                {bookings.map((b) => {
                  const st = statusLabels[b.status] || { label: b.status, cls: "bg-muted text-foreground" };
                  return (
                    <li key={b.id} className="rounded-lg border p-3 text-xs space-y-1">
                      <div className="font-medium text-sm truncate">{b.packages?.title || "Pacote"}</div>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] ${st.cls}`}>{st.label}</span>
                        <span className="text-muted-foreground">{new Date(b.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>{b.quantity} viajante(s)</span>
                        <span className="font-semibold text-foreground">{Number(b.total_price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                      </div>
                      {b.voucher_code && <div className="text-[10px] text-muted-foreground">Voucher: {b.voucher_code}</div>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
        {user && (
          <div className="p-4 border-t mt-2">
            <Button variant="outline" className="w-full" onClick={() => { signOut(); setOpen(false); nav("/"); }}>
              <LogOut className="mr-2 h-4 w-4" />Sair
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
