import { useEffect, useState } from "react";
import { fetchCategories, subscribeCategories, type CategoryRow } from "@/lib/categories";

export const useCategories = () => {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  useEffect(() => {
    fetchCategories();
    const unsub = subscribeCategories(setCategories);
    return () => { unsub(); };
  }, []);
  return categories;
};
