import { api } from "./api";

export interface CategoryRow {
  slug: string;
  label: string;
}

let _cache: CategoryRow[] | null = null;
const _listeners = new Set<(cats: CategoryRow[]) => void>();

export const fetchCategories = async (force = false): Promise<CategoryRow[]> => {
  if (_cache && !force) return _cache;
  try {
    // Como o backend SQLite é simples, as categorias podem ser fixas ou vir de uma rota
    // Por enquanto, vamos usar as categorias padrão do projeto
    const data: CategoryRow[] = [
      { slug: "bate_volta", label: "Bate e Volta" },
      { slug: "casal", label: "Casal" },
      { slug: "excursao", label: "Excursão" }
    ];
    _cache = data;
    _listeners.forEach((fn) => fn(_cache!));
    return _cache;
  } catch (e) {
    return [];
  }
};

export const subscribeCategories = (fn: (cats: CategoryRow[]) => void) => {
  _listeners.add(fn);
  if (_cache) fn(_cache);
  return () => _listeners.delete(fn);
};

export const labelFor = (slug: string, cats: CategoryRow[]) =>
  cats.find((c) => c.slug === slug)?.label ?? slug;

export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

export const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });
