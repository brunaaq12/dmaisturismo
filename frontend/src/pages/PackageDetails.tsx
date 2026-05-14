import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Calendar, Users, Clock, CheckCircle2 } from "lucide-react";
import { formatBRL, formatDate, labelFor } from "@/lib/categories";
import { useCategories } from "@/hooks/useCategories";
import { useCart } from "@/hooks/useCart";

interface FullPackage {
  id: string;
  title: string; description: string; location: string;
  category: string; departure_date: string; duration_days: number;
  price: number; available_spots: number; total_spots: number;
  cover_image: string | null; itinerary: string | null; included: string | null;
  package_type: string | null;
}

const PackageDetails = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const cats = useCategories();
  const { add } = useCart();
  const [pkg, setPkg] = useState<FullPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [passengers, setPassengers] = useState<{ full_name: string; rg: string }[]>([]);
  const [booking, setBooking] = useState(false);
  const [discountPct, setDiscountPct] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<FullPackage>(`/packages/${id}`);
        setPkg(data);
        const ptype = (data as any).package_type;
        if (ptype) {
          // Desconto seria buscado de uma rota específica se necessário
          setDiscountPct(0);
        }
        setLoading(false);
      } catch (err) {
        toast.error("Pacote não encontrado");
        nav("/");
      }
    })();
  }, [id, nav]);

  useEffect(() => {
    const extra = Math.max(0, qty - 1);
    setPassengers((prev) => {
      const next = [...prev];
      while (next.length < extra) next.push({ full_name: "", rg: "" });
      next.length = extra;
      return next;
    });
  }, [qty]);

  const updatePassenger = (i: number, field: "full_name" | "rg", value: string) => {
    const sanitized = field === "rg" ? value.replace(/\D/g, "") : value;
    setPassengers((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: sanitized } : p)));
  };

  const handleBook = async () => {
    if (!user) { toast.info("Entre na sua conta para reservar"); nav("/auth"); return; }
    if (!pkg) return;
    if (qty < 1 || qty > pkg.available_spots) { toast.error("Quantidade inválida"); return; }
    for (const [i, p] of passengers.entries()) {
      const name = p.full_name.trim();
      const rg = p.rg.trim();
      if (!name) { toast.error(`Informe o nome completo do passageiro ${i + 2}`); return; }
      if (name.length < 15) { toast.error(`Nome do passageiro ${i + 2} deve ter no mínimo 15 caracteres`); return; }
      if (!rg) { toast.error(`Informe o RG do passageiro ${i + 2}`); return; }
      if (!/^\d+$/.test(rg)) { toast.error(`RG do passageiro ${i + 2} deve conter apenas números`); return; }
    }
    setBooking(true);
    try {
      const data = await api.post("/bookings", {
        package_id: pkg.id,
        quantity: qty,
        unit_price: pkg.price,
        total_price: pkg.price * qty,
        passengers: passengers.map((p) => ({ full_name: p.full_name.trim(), rg: p.rg.trim() })),
      });
      toast.success("Reserva enviada! Acompanhe em sua conta.");
      nav("/conta?tab=reservas");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading || !pkg) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container py-10"><Skeleton className="h-96 w-full rounded-2xl" /></div>
      </div>
    );
  }

  const soldOut = pkg.available_spots === 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="relative h-[50vh] min-h-[400px] overflow-hidden">
        <img src={pkg.cover_image || "/placeholder.svg"} alt={pkg.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="container relative z-10 flex h-full flex-col justify-end pb-10 text-primary-foreground">
          <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-primary-foreground/80 hover:text-accent w-fit">
            <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
          </Link>
          <Badge className="mb-3 w-fit bg-accent text-accent-foreground">{labelFor(pkg.category, cats)}</Badge>
          <h1 className="font-serif text-4xl font-bold md:text-5xl">{pkg.title}</h1>
          <div className="mt-3 flex flex-wrap gap-5 text-sm">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-accent" />{pkg.location}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-accent" />{formatDate(pkg.departure_date)}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-accent" />{pkg.duration_days} {pkg.duration_days === 1 ? "dia" : "dias"}</span>
          </div>
        </div>
      </div>

      <main className="container grid gap-8 py-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="font-serif text-2xl font-bold mb-3">Sobre essa experiência</h2>
            <p className="text-muted-foreground leading-relaxed">{pkg.description}</p>
          </section>

          {pkg.itinerary && (
            <section>
              <h2 className="font-serif text-2xl font-bold mb-3">Itinerário</h2>
              <div className="rounded-xl border border-border bg-card p-5 text-sm leading-relaxed whitespace-pre-line">
                {pkg.itinerary}
              </div>
            </section>
          )}

          {pkg.included && (
            <section>
              <h2 className="font-serif text-2xl font-bold mb-3">O que está incluso</h2>
              <ul className="space-y-2">
                {pkg.included.split(",").map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-accent mt-0.5 shrink-0" />
                    <span>{item.trim()}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside>
          <Card className="sticky top-24 shadow-elegant">
            <CardHeader>
              <div className="text-xs text-muted-foreground">A partir de</div>
              <CardTitle className="font-serif text-3xl text-primary">{formatBRL(pkg.price)}</CardTitle>
              <div className="text-sm text-muted-foreground">por pessoa</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-accent" />
                {soldOut ? <span className="text-destructive font-semibold">Esgotado</span>
                  : <span><strong>{pkg.available_spots}</strong> de {pkg.total_spots} vagas disponíveis</span>}
              </div>

              <div>
                <Label htmlFor="qty">Quantidade de viajantes</Label>
                <Input id="qty" type="number" min={1} max={pkg.available_spots} value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.min(pkg.available_spots, Number(e.target.value))))}
                  disabled={soldOut} />
              </div>

              {passengers.length > 0 && (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-sm font-semibold">Dados dos demais passageiros</p>
                  <p className="text-xs text-muted-foreground">
                    Você (titular) é o passageiro 1. Informe nome completo (mín. 15 caracteres) e RG (somente números) dos demais.
                  </p>
                  {passengers.map((p, i) => (
                    <div key={i} className="rounded-lg border border-border p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Passageiro {i + 2}</p>
                      <div>
                        <Label htmlFor={`pname-${i}`} className="text-xs">Nome completo *</Label>
                        <Input id={`pname-${i}`} value={p.full_name} required minLength={15}
                          placeholder="Mínimo 15 caracteres"
                          onChange={(e) => updatePassenger(i, "full_name", e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`prg-${i}`} className="text-xs">RG (somente números) *</Label>
                        <Input id={`prg-${i}`} value={p.rg} required inputMode="numeric" pattern="\d*"
                          placeholder="Apenas dígitos"
                          onChange={(e) => updatePassenger(i, "rg", e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {discountPct > 0 && qty > 1 && (
                <div className="flex justify-between text-xs text-emerald-700 border-t border-border pt-3">
                  <span>Desconto aplicado ({discountPct}%)</span>
                  <span>- {formatBRL(pkg.price * qty * (discountPct / 100))}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-4 font-semibold">
                <span>Total</span>
                <span className="font-serif text-xl text-primary">
                  {formatBRL(pkg.price * qty * (qty > 1 ? 1 - discountPct / 100 : 1))}
                </span>
              </div>

              <Button onClick={handleBook} disabled={soldOut || booking} className="w-full bg-gradient-gold text-primary hover:opacity-90 shadow-gold">
                {booking ? "Reservando..." : soldOut ? "Esgotado" : "Reservar agora"}
              </Button>
              <Button variant="outline" disabled={soldOut} className="w-full"
                onClick={() => {
                  add({
                    package_id: pkg.id, title: pkg.title, cover_image: pkg.cover_image,
                    price: Number(pkg.price), available_spots: pkg.available_spots,
                  }, qty);
                  toast.success("Adicionado ao carrinho");
                }}>
                Adicionar ao carrinho
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Sua reserva será enviada automaticamente para a equipe finalizar o pagamento.
              </p>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
};

export default PackageDetails;
