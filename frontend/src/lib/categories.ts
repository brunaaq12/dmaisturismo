import { categoriesApi, type Category } from "@/lib/api";

export type CategoryRow = Category;

let _cache: CategoryRow[] | null = null;
const _listeners = new Set<(cats: CategoryRow[]) => void>();

export const fetchCategories = async (force = false): Promise<CategoryRow[]> => {
  if (_cache && !force) return _cache;
  const data = await categoriesApi.list();
  _cache = data;
  _listeners.forEach((fn) => fn(_cache!));
  return _cache;
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

/**
 * Formata strings de data de forma segura.
 * Lida tanto com o formato simples (YYYY-MM-DD) quanto ISO completo (com hora).
 */
export const formatDate = (iso: string) => {
  if (!iso) return "";

  // Se a string já possuir indicativo de hora (T ou espaço), usamos o formato original.
  // Se for apenas a data YYYY-MM-DD, anexamos o T00:00:00 para evitar quebras de fuso horário.
  const dateStr = iso.includes("T") || iso.includes(" ") ? iso : `${iso}T00:00:00`;
  
  const date = new Date(dateStr);

  // Fallback caso chegue uma string corrompida ou inválida por completo
  if (isNaN(date.getTime())) {
    return "Data inválida";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};
