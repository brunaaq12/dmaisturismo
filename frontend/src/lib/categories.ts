import { api } from "./api";

// --- LISTA DE MESES (Exigida pelo FilterBar.tsx) ---
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

export interface CategoryRow {
  slug: string;
  label: string;
}

// --- ESTADO DINÂMICO DAS CATEGORIAS ---
let currentCategories: CategoryRow[] = [];
const subscribers = new Set<(cats: CategoryRow[]) => void>();

export const subscribeCategories = (callback: (cats: CategoryRow[]) => void) => {
  subscribers.add(callback);
  callback(currentCategories);
  return () => {
    subscribers.delete(callback);
  };
};

const notify = () => {
  subscribers.forEach((cb) => cb([...currentCategories]));
};

/**
 * Busca as categorias do banco de dados D1 via API
 */
export const fetchCategories = async (force = false) => {
  if (currentCategories.length > 0 && !force) return;

  try {
    const data = await api.get<CategoryRow[]>("/packages/categories");
    currentCategories = data || [];
    notify();
  } catch (err) {
    console.error("Falha ao buscar categorias:", err);
    currentCategories = [];
    notify();
  }
};

// --- FUNÇÕES UTILITÁRIAS (Exigidas pelo Admin.tsx e Listagens) ---

/**
 * Retorna o nome amigável da categoria ou o slug caso não encontre
 */
export const labelFor = (slug: string, cats: CategoryRow[]) => {
  return cats.find((c) => c.slug === slug)?.label || slug;
};

/**
 * Formata valores numéricos para Real Brasileiro (R$)
 */
export const formatBRL = (val: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

/**
 * Formata datas do padrão YYYY-MM-DD para DD/MM/YYYY
 */
export const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};
