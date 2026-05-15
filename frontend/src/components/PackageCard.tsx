import { Link } from "react-router-dom";
import { MapPin, Calendar, Users, Star, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatBRL, formatDate, labelFor } from "@/lib/categories";
import { useCategories } from "@/hooks/useCategories";
import { useCart } from "@/hooks/useCart";

export interface PackageItem {
  id: string;
  title: string;
  location: string;
  category: string;
  departure_date: string;
  duration_days: number;
  price: number;
  available_spots: number;
  total_spots: number;
  cover_image: string | null;
  is_featured?: boolean;
}

export const PackageCard = ({ pkg }: { pkg: PackageItem }) => {
  const cats = useCategories();
  const { add } = useCart();
  const soldOut = pkg.available_spots === 0;
  const lowSpots = !soldOut && pkg.available_spots <= 5;

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant">
      <div className="relative h-56 overflow-hidden">
        <img
          src={pkg.cover_image || "/placeholder.svg"}
          alt={pkg.title}
          loading="lazy"
          className="h-full w-full object-cover transition-smooth group-hover:scale-110"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
        <Badge className="absolute left-3 top-3 bg-background/95 text-foreground hover:bg-background">
          {labelFor(pkg.category, cats)}
        </Badge>
        {pkg.is_featured && (
          <Badge className="absolute left-3 top-12 bg-accent text-accent-foreground gap-1">
            <Star className="h-3 w-3 fill-current" /> Destaque
          </Badge>
        )}
        {soldOut && <Badge variant="destructive" className="absolute right-3 top-3">Esgotado</Badge>}
        {lowSpots && <Badge className="absolute right-3 top-3 bg-accent text-accent-foreground">Últimas {pkg.available_spots} vagas</Badge>}
      </div>

      <div className="p-5">
        <h3 className="mb-2 line-clamp-1 font-serif text-xl font-bold">{pkg.title}</h3>

        <div className="mb-4 space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-accent" />{pkg.location}</div>
          <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-accent" />{formatDate(pkg.departure_date)} • {pkg.duration_days} {pkg.duration_days === 1 ? "dia" : "dias"}</div>
          <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-accent" />{pkg.available_spots}/{pkg.total_spots} vagas</div>
        </div>

        <div className="flex items-end justify-between border-t border-border pt-4 gap-2">
          <div>
            <div className="text-xs text-muted-foreground">A partir de</div>
            <div className="font-serif text-2xl font-bold text-primary">{formatBRL(pkg.price)}</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={soldOut} title="Adicionar ao carrinho"
              onClick={() => {
                add({
                  package_id: pkg.id, title: pkg.title, cover_image: pkg.cover_image,
                  price: Number(pkg.price), available_spots: pkg.available_spots,
                });
                toast.success("Adicionado ao carrinho");
              }}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button asChild size="sm" disabled={soldOut} className="bg-primary hover:bg-primary-glow">
              <Link to={`/pacote/${pkg.id}`}>{soldOut ? "Esgotado" : "Detalhes"}</Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};
