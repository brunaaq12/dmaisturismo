import { useEffect, useMemo, useRef, useState } from "react";
import { packagesApi, publicationsApi, type Package } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FilterBar, type Filters } from "@/components/FilterBar";
import { PackageCard, type PackageItem } from "@/components/PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react";

// ── Carrossel de pacotes em destaque ────────────────────────────────────────
const FeaturedSlider = ({ packages }: { packages: PackageItem[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });

  return (
    <div className="mt-16">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="font-serif text-2xl font-bold md:text-3xl">Destaques da temporada</h3>
          <p className="mt-1 text-sm text-muted-foreground">Selecionados pela nossa curadoria</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll("left")} aria-label="Anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-accent hover:text-accent-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll("right")} aria-label="Próximo"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-accent hover:text-accent-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {packages.map((p) => (
          <div key={p.id} className="w-[280px] shrink-0 md:w-[340px]">
            <PackageCard pkg={p} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Carrossel de publicações (fotos dos viajantes) ───────────────────────────
// ⚠️  Esta seção é SEPARADA do Hero — renderiza abaixo dos pacotes,
//     nunca como fundo ou sobreposta ao topo da página.
const PublicationsCarousel = () => {
  const [items, setItems] = useState<{ id: string; title: string | null; image_url: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    publicationsApi.list().then(setItems).catch(() => {});
  }, []);

  const scroll = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });

  if (items.length === 0) return null;

  return (
    // Seção própria — completamente separada da section#pacotes e do Hero
    <section className="mt-20 border-t border-border pt-16">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="font-serif text-2xl font-bold md:text-3xl">Onde Nossas Histórias Ganham Vida</h3>
          <p className="mt-1 text-sm text-muted-foreground">Momentos capturados pelos nossos viajantes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll("left")} aria-label="Anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-accent hover:text-accent-foreground">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => scroll("right")} aria-label="Próximo"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-accent hover:text-accent-foreground">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {items.map((it) => (
          <div key={it.id} className="w-[300px] shrink-0 md:w-[360px]">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <img
                src={it.image_url}
                alt={it.title || "Publicação"}
                className="h-64 w-full object-cover"
                loading="lazy"
              />
              {it.title && (
                <div className="p-3 text-sm font-medium">{it.title}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ── Mapeia Package da API para PackageItem do card ───────────────────────────
const toItem = (p: Package): PackageItem => ({
  ...p,
  is_featured: Boolean(p.is_featured),
});

// ── Página principal ─────────────────────────────────────────────────────────
const Index = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    q: "", category: "all", month: "all", duration: "all",
  });

  useEffect(() => {
    packagesApi.list()
      .then(setPackages)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return packages.filter((p) => {
      if (filters.q && !`${p.title} ${p.location}`.toLowerCase().includes(filters.q.toLowerCase()))
        return false;
      if (filters.category !== "all" && p.category !== filters.category)
        return false;
      if (filters.month !== "all") {
        const m = new Date(p.departure_date + "T00:00:00").getMonth() + 1;
        if (m !== Number(filters.month)) return false;
      }
      if (filters.duration !== "all") {
        const d = p.duration_days;
        if (filters.duration === "1"   && d !== 1)           return false;
        if (filters.duration === "2-3" && (d < 2 || d > 3)) return false;
        if (filters.duration === "4+"  && d < 4)             return false;
      }
      return true;
    });
  }, [packages, filters]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero — imagem fixa, nunca mostra publicações */}
      <Hero />

      <main className="container -mt-20 relative z-20 pb-20">
        <FilterBar filters={filters} onChange={setFilters} />

        {/* ── Listagem de pacotes ── */}
        <section id="pacotes" className="mt-12">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-bold md:text-4xl">Pacotes em destaque</h2>
              <p className="mt-1 text-muted-foreground">
                {filtered.length}{" "}
                {filtered.length === 1 ? "experiência encontrada" : "experiências encontradas"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-96 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
              <p className="text-lg text-muted-foreground">
                Nenhum pacote encontrado com esses filtros.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <PackageCard key={p.id} pkg={toItem(p)} />
              ))}
            </div>
          )}

          {/* Carrossel de destaques — apenas se houver pacotes marcados */}
          {!loading && packages.some((p) => p.is_featured) && (
            <FeaturedSlider packages={packages.filter((p) => p.is_featured).map(toItem)} />
          )}
        </section>

        {/* ── Publicações — seção PRÓPRIA, abaixo dos pacotes ── */}
        <PublicationsCarousel />

        {/* ── Sobre ── */}
        <section id="sobre" className="mt-24 grid gap-10 rounded-3xl bg-gradient-deep p-10 text-primary-foreground md:grid-cols-3 md:p-14">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Curadoria</div>
            <h3 className="font-serif text-2xl font-bold">Roteiros selecionados</h3>
            <p className="mt-3 text-sm text-primary-foreground/75">Cada destino é visitado e aprovado pela nossa equipe antes de entrar no catálogo.</p>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Confiança</div>
            <h3 className="font-serif text-2xl font-bold">Pagamento seguro</h3>
            <p className="mt-3 text-sm text-primary-foreground/75">Pix, boleto ou cartão de crédito — proteção em todas as etapas.</p>
          </div>
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Suporte</div>
            <h3 className="font-serif text-2xl font-bold">Atendimento humano</h3>
            <p className="mt-3 text-sm text-primary-foreground/75">Equipe disponível antes, durante e depois da sua viagem para o que precisar.</p>
          </div>
        </section>
      </main>

      {/* ── Rodapé ── */}
      <footer id="contato" className="border-t border-border bg-card">
        <div className="container py-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Sobre</div>
            <h3 className="font-serif text-2xl font-bold md:text-3xl">Sobre a D+ Turismo</h3>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              A D+ Turismo nasceu da vontade de explorar cada canto e do prazer de compartilhar o que há de mais
              autêntico, dedicando-se a criar experiências inesquecíveis para quem busca mais do que um simples passeio.
            </p>
          </div>
          <div className="mt-10 grid gap-6 border-t border-border pt-8 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Contato</div>
              <a href="tel:+5571934260280" className="inline-flex items-center gap-2 text-base font-medium hover:text-accent">
                <Phone className="h-4 w-4" /> +55 71 9342-6028
              </a>
            </div>
            <div className="sm:text-right">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Suporte</div>
              <a href="mailto:ddtur.excursoes@outlook.com" className="inline-flex items-center gap-2 text-base font-medium hover:text-accent">
                <Mail className="h-4 w-4" /> ddtur.excursoes@outlook.com
              </a>
            </div>
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} D+ TURISMO · Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
