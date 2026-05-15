import { api } from "./api";

export interface CategoryRow {
  slug: string;
  label: string;
}

// Estado interno para os componentes que assinam as mudanças
let currentCategories: CategoryRow[] = [];
const subscribers = new Set<(cats: CategoryRow[]) => void>();

export const subscribeCategories = (callback: (cats: CategoryRow[]) => void) => {
  subscribers.add(callback);
  callback(currentCategories);
  return () => { subscribers.delete(callback); };
};

const notify = () => {
  subscribers.forEach(cb => cb([...currentCategories]));
};

// Esta é a função que o seu hook já chama! 
// Agora ela busca do banco de dados ao invés de usar nomes fixos.
export const fetchCategories = async (force = false) => {
  if (currentCategories.length > 0 && !force) return;
  
  try {
    const data = await api.get<CategoryRow[]>("/packages/categories");
    currentCategories = data || [];
    notify();
  } catch (err) {
    console.error("Falha ao buscar categorias:", err);
    // Em caso de erro, evita que o site quebre enviando uma lista vazia
    currentCategories = [];
    notify();
  }
};

// Utilitário para pegar o nome bonito a partir do slug
export const labelFor = (slug: string, cats: CategoryRow[]) => {
  return cats.find(c => c.slug === slug)?.label || slug;
};
