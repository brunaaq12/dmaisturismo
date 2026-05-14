import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { FilterBar, type Filters } from "@/components/FilterBar";
import { PackageCard, type PackageItem } from "@/components/PackageCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, ChevronLeft, ChevronRight } from "lucide-react";

const FeaturedSlider = ({ packages }: { packages: PackageItem[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 340;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="mt-16">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="font-serif text-2xl font-bold md:text-3xl">Destaques da temporada</h3>
          <p className="mt-1 text-sm text-muted-foreground">Selecionados pela nossa curadoria</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll("left")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-accent hover:text-accent-foreground"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:bg-accent hover:text-accent-foreground"
            aria-label="Próximo"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto scroll-smooth pb-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {packages.map((p) => (
          <div key={p.id} className="w-[280px] shrink-0 md:w-[340px]">
            <PackageCard pkg={p} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Index = () => {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    q: "", category: "all", month: "all", duration: "all",
  });

  useEffect(() => {
    api.get<PackageItem[]>("/packages")
      .then(data => setPackages(data))
      .catch(() => setPackages([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return packages.filter((p) => {
      if (filters.q && !`${p.title} ${p.location}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
      if (filters.category !== "all" && p.category !== filters.category) return false;
      if (filters.month !== "all") {
        const m = new Date(p.departure_date + "T00:00:00").getMonth() + 1;
        if (m !== Number(filters.month)) return false;
      }
      if (filters.duration !== "all") {
        if (filters.duration === "1" && p.duration_days !== 1) return false;
        if (filters.duration === "2-3" && (p.duration_days < 2 || p.duration_days > 3)) return false;
        if (filters.duration === "4+" && p.duration_days < 4) return false;
      }
      return true;
    });
  }, [packages, filters]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />

      <main className="container -mt-20 relative z-20 pb-20">
        <FilterBar filters={filters} onChange={setFilters} />

        <section id="pacotes" className="mt-12">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-serif text-3xl font-bold md:text-4xl">Pacotes em destaque</h2>
              <p className="mt-1 text-muted-foreground">{filtered.length} {filtered.length === 1 ? "experiência encontrada" : "experiências encontradas"}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-96 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
              <p className="text-lg text-muted-foreground">Nenhum pacote encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => <PackageCard key={p.id} pkg={p} />)}
            </div>
          )}

          {!loading && packages.some((p) => p.is_featured) && (
            <FeaturedSlider packages={packages.filter((p) => p.is_featured)} />
          )}
        </section>

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

      <footer id="contato" className="border-t border-border bg-card">
        <div className="container py-12">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Sobre</div>
            <h3 className="font-serif text-2xl font-bold md:text-3xl">Sobre a D+ Turismo</h3>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              A D+ Turismo nasceu da vontade de explorar cada canto e do prazer de compartilhar o que há de mais autêntico, dedicando-se a criar experiências inesquecíveis para quem busca mais do que um simples passeio.
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
              <a href="mailto:suporte@dmaisturismo.com.br" className="inline-flex items-center gap-2 text-base font-medium hover:text-accent">
                <Mail className="h-4 w-4" /> suporte@dmaisturismo.com.br
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
