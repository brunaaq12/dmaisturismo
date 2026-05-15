import { useEffect, useState } from "react";
import { categoriesApi, type Category } from "@/lib/api";

let _cache: Category[] | null = null;
const _listeners = new Set<(cats: Category[]) => void>();

export const fetchCategories = async (force = false): Promise<Category[]> => {
  if (_cache && !force) return _cache;
  const data = await categoriesApi.list();
  _cache = data;
  _listeners.forEach((fn) => fn(_cache!));
  return _cache;
};

export const subscribeCategories = (fn: (cats: Category[]) => void) => {
  _listeners.add(fn);
  if (_cache) fn(_cache);
  return () => _listeners.delete(fn);
};

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    fetchCategories();
    const unsub = subscribeCategories(setCategories);
    return () => { unsub(); };
  }, []);
  return categories;
};
