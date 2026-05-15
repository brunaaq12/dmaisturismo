// Local: frontend/src/lib/categories.ts
import { api } from "./api";

export interface CategoryRow {
  slug: string;
  label: string;
}

// --- LISTA DE MESES (Formatada para evitar Erro #31 no Select) ---
export const MONTHS = [
  { value: "01", label: "Janeiro" },
  { value: "02", label: "Fevereiro" },
  { value: "03", label: "Março" },
  { value: "04", label: "Abril" },
  { value: "05", label: "Maio" },
  { value: "06", label: "Junho" },
  { value: "07", label: "Julho" },
  { value: "08", label: "Agosto" },
  { value: "09", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

// --- ESTADO DINÂMICO ---
let _cache: CategoryRow[] = [];
const _listeners = new Set<(cats: CategoryRow[]) => void>();

/**
 * Notifica todos os componentes (hooks) sobre mudanças nas categorias
 */
const notify = () => {
  _listeners.forEach((fn) => fn([..._cache]));
};

/**
 * Busca as categorias REAIS do banco de dados D1
 */
export const fetchCategories = async (force = false): Promise<CategoryRow[]> => {
  if (_cache.length > 0 && !force) return _cache;

  try {
    // Agora busca da sua API dinâmica, não mais da lista fixa
    const data = await api.get<CategoryRow[]>("/packages/categories");
    _cache = data || [];
    notify();
    return _cache;
  } catch (e) {
    console.error("Erro ao buscar categorias do D1:", e);
    return [];
  }
};

/**
 * Permite que o hook useCategories "escute" as atualizações
 */
export const subscribeCategories = (fn: (cats: CategoryRow[]) => void) => {
  _listeners.add(fn);
  if (_cache.length > 0) fn(_cache);
  return () => _listeners.delete(fn);
};

// --- UTILITÁRIOS ---

/**
 * Retorna o nome exibível da categoria (ex: transforma "casal" em "Casal")
 */
export const labelFor = (slug: string, cats: CategoryRow[]) =>
  cats.find((c) => c.slug === slug)?.label ?? slug;

/**
 * Formata moeda para Real Brasileiro
 */
export const formatBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { 
    style: "currency", 
    currency: "BRL" 
  }).format(n);

/**
 * Formata data ISO para o padrão brasileiro
 */
export const formatDate = (iso: string) => {
  if (!iso) return "";
  // Adicionamos o T00:00:00 para evitar que o fuso horário mude o dia
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
