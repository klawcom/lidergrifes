import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SizeQty } from "./format";

export type CartItem = {
  key: string;
  produtoId: string;
  slug: string;
  nome: string;
  imagem: string;
  kit: number;
  preco: number;
  tamanhos: SizeQty;
  observacao?: string;
};

type Ctx = {
  items: CartItem[];
  add: (i: Omit<CartItem, "key">) => void;
  remove: (key: string) => void;
  clear: () => void;
  total: number;
  pecas: number;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "lg-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {}
  }, []);
  const save = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };
  const value: Ctx = {
    items,
    add: (i) => save([...items, { ...i, key: crypto.randomUUID() }]),
    remove: (key) => save(items.filter((i) => i.key !== key)),
    clear: () => save([]),
    total: items.reduce((s, i) => s + i.preco, 0),
    pecas: items.reduce((s, i) => s + i.kit, 0),
  };
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
