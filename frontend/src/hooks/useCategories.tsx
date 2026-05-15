// Local: frontend/src/hooks/useCategories.ts
import { useEffect, useState } from "react";
// Importamos as funções que conectam com o banco de dados via lib/categories
import { fetchCategories, subscribeCategories, type CategoryRow } from "@/lib/categories";

/**
 * Hook personalizado para fornecer categorias dinâmicas do banco D1
 * para qualquer componente do site.
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  useEffect(() => {
    // 1. Dispara a busca inicial no banco de dados
    fetchCategories();

    // 2. Se inscreve para receber atualizações automáticas 
    // (ex: se você cadastrar uma categoria no Admin, ela aparece aqui sem refresh)
    const unsub = subscribeCategories((newCats) => {
      setCategories(newCats);
    });

    // 3. Limpeza: remove o ouvinte quando o componente é destruído
    return () => { 
      unsub(); 
    };
  }, []);

  return categories;
};
