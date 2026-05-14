import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MONTHS } from "@/lib/categories";
import { useCategories } from "@/hooks/useCategories";

export interface Filters {
  q: string;
  category: string;
  month: string;
  duration: string;
}

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export const FilterBar = ({ filters, onChange }: Props) => {
  const cats = useCategories();
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...filters, [k]: v });

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-elegant md:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-4">
          <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buscar local</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ex: Paraty, Maragogi..."
              className="pl-9"
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
            />
          </div>
        </div>

        <div className="md:col-span-3">
          <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoria</Label>
          <Select value={filters.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {cats.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mês de partida</Label>
          <Select value={filters.month} onValueChange={(v) => set("month", v)}>
            <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer mês</SelectItem>
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Período</Label>
          <Select value={filters.duration} onValueChange={(v) => set("duration", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="1">1 dia</SelectItem>
              <SelectItem value="2-3">2 a 3 dias</SelectItem>
              <SelectItem value="4+">4+ dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
