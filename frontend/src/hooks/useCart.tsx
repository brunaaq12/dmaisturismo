import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface CartItem {
  package_id: string;
  title: string;
  cover_image: string | null;
  price: number;
  available_spots: number;
  quantity: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (package_id: string) => void;
  setQty: (package_id: string, qty: number) => void;
  clear: () => void;
}

const Ctx = createContext<CartCtx>({
  items: [], count: 0, total: 0,
  add: () => {}, remove: () => {}, setQty: () => {}, clear: () => {},
});

const KEY = "dmais_cart_v1";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  const add: CartCtx["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.package_id === item.package_id);
      if (existing) {
        return prev.map((p) => p.package_id === item.package_id
          ? { ...p, quantity: Math.min(p.available_spots, p.quantity + qty) }
          : p);
      }
      return [...prev, { ...item, quantity: Math.min(item.available_spots, qty) }];
    });
  };

  const remove = (id: string) => setItems((p) => p.filter((x) => x.package_id !== id));
  const setQty = (id: string, qty: number) => setItems((p) =>
    p.map((x) => x.package_id === id
      ? { ...x, quantity: Math.max(1, Math.min(x.available_spots, qty)) }
      : x));
  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);

  return <Ctx.Provider value={{ items, count, total, add, remove, setQty, clear }}>{children}</Ctx.Provider>;
};

export const useCart = () => useContext(Ctx);
