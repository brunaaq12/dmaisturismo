import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatBRL } from "@/lib/categories";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useState } from "react";

const Cart = () => {
  const { items, remove, setQty, clear, total } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);

  const reservar = async () => {
    if (!user) { toast.info("Entre na sua conta para reservar"); nav("/auth"); return; }
    if (items.length === 0) return;
    setBusy(true);
    const rows = items.map((i) => ({
      user_id: user.id,
      package_id: i.package_id,
      quantity: i.quantity,
      unit_price: i.price,
      total_price: i.price * i.quantity,
    }));
    try {
      const data = await api.post("/bookings", { bookings: rows });
      toast.success(`${rows.length} reserva(s) criada(s)! Acompanhe em "Minha conta".`);
    } catch (err: any) {
      toast.error(err.message);
      setBusy(false);
      return;
    }
    setBusy(false);
    clear();
    nav("/conta");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-10">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent">
          <ArrowLeft className="h-4 w-4" /> Continuar comprando
        </Link>
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8">Seu carrinho</h1>

        {items.length === 0 ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto mb-3 h-10 w-10 opacity-40" />
            Seu carrinho está vazio.
            <div className="mt-4"><Button onClick={() => nav("/")}>Ver pacotes</Button></div>
          </CardContent></Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {items.map((i) => (
                <Card key={i.package_id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                      <img src={i.cover_image || "/placeholder.svg"} alt={i.title}
                        className="h-32 w-full rounded-lg object-cover sm:h-20 sm:w-28" />
                      <div className="flex-1 min-w-0">
                        <Link to={`/pacote/${i.package_id}`} className="font-serif text-lg font-bold line-clamp-1 hover:text-accent">{i.title}</Link>
                        <div className="text-sm text-muted-foreground mt-1">{formatBRL(i.price)} · {i.available_spots} vagas disp.</div>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <Input type="number" min={1} max={i.available_spots} value={i.quantity}
                          onChange={(e) => setQty(i.package_id, Number(e.target.value))}
                          className="w-20 text-center" />
                        <div className="font-serif text-lg font-bold text-primary text-right sm:w-28">{formatBRL(i.price * i.quantity)}</div>
                        <Button variant="ghost" size="icon" onClick={() => remove(i.package_id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <aside>
              <Card className="sticky top-24 shadow-elegant">
                <CardContent className="space-y-4 p-6">
                  <h3 className="font-serif text-xl font-bold">Resumo</h3>
                  <div className="flex justify-between text-sm"><span>Itens</span><span>{items.length}</span></div>
                  <div className="flex justify-between border-t border-border pt-3 font-semibold">
                    <span>Total</span>
                    <span className="font-serif text-2xl text-primary">{formatBRL(total)}</span>
                  </div>
                  <Button onClick={reservar} disabled={busy}
                    className="w-full bg-gradient-gold text-primary hover:opacity-90 shadow-gold">
                    {busy ? "Reservando..." : "Reservar pacotes"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    As reservas ficarão como <strong>pendentes</strong>. Em "Minha conta" você poderá enviá-las para pagamento ou cancelar.
                  </p>
                </CardContent>
              </Card>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
};

export default Cart;
