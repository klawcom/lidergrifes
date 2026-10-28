import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { SizeQty } from "./format";
import { sumSizes } from "./format";
import {
  getOrderTier,
  getTierUnitPrice,
  getNextTierInfo,
  type PriceTier,
  type TierQty,
  type NextTierInfo,
} from "./pricing";

export type CartItem = {
  key: string;
  produtoId: string;
  slug: string;
  nome: string;
  imagem: string;
  tamanhos: SizeQty;
  faixas: PriceTier[];
  observacao?: string;
};

export type CartCalculatedItem = CartItem & {
  pecas: number;
  precoUnitario: number;
  valorTotal: number;
};

type Ctx = {
  items: CartItem[];
  calculatedItems: CartCalculatedItem[];
  add: (item: Omit<CartItem, "key">) => void;
  updateTamanhos: (key: string, tamanhos: SizeQty) => void;
  updateObservacao: (key: string, obs: string) => void;
  remove: (key: string) => void;
  clear: () => void;
  total: number;
  pecas: number;
  faixa: TierQty;
  minimoAtingido: boolean;
  faltamMinimo: number;
  nextTierInfo: NextTierInfo | null;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "lg-cart-v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY) || localStorage.getItem("lg-cart") || "[]";
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Normalize any legacy format into the new structure
        const normalized: CartItem[] = parsed.map((item: any) => ({
          key: item.key || crypto.randomUUID(),
          produtoId: item.produtoId,
          slug: item.slug || "",
          nome: item.nome || "",
          imagem: item.imagem || "",
          tamanhos: item.tamanhos || { p: 0, m: 0, g: 0, gg: 0 },
          faixas: item.faixas || (item.kit && item.preco ? [{ quantidade: item.kit, preco: item.preco }] : []),
          observacao: item.observacao || "",
        }));
        setItems(normalized);
      }
    } catch {}
  }, []);

  const save = (next: CartItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const add = (i: Omit<CartItem, "key">) => {
    const existingIndex = items.findIndex((x) => x.produtoId === i.produtoId);
    let next: CartItem[];
    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const mergedTamanhos: SizeQty = {
        p: existing.tamanhos.p + (i.tamanhos.p || 0),
        m: existing.tamanhos.m + (i.tamanhos.m || 0),
        g: existing.tamanhos.g + (i.tamanhos.g || 0),
        gg: existing.tamanhos.gg + (i.tamanhos.gg || 0),
      };

      let mergedObs = existing.observacao || "";
      if (i.observacao?.trim()) {
        mergedObs = mergedObs
          ? `${mergedObs} | ${i.observacao.trim()}`
          : i.observacao.trim();
      }

      const updated: CartItem = {
        ...existing,
        tamanhos: mergedTamanhos,
        observacao: mergedObs || undefined,
        faixas: i.faixas && i.faixas.length ? i.faixas : existing.faixas,
      };
      next = [...items];
      next[existingIndex] = updated;
    } else {
      next = [...items, { ...i, key: crypto.randomUUID() }];
    }
    save(next);
  };

  const updateTamanhos = (key: string, tamanhos: SizeQty) => {
    const totalPecas = sumSizes(tamanhos);
    if (totalPecas <= 0) {
      remove(key);
      return;
    }
    const next = items.map((i) => (i.key === key ? { ...i, tamanhos } : i));
    save(next);
  };

  const updateObservacao = (key: string, obs: string) => {
    const next = items.map((i) =>
      i.key === key ? { ...i, observacao: obs.trim() || undefined } : i,
    );
    save(next);
  };

  const remove = (key: string) => save(items.filter((i) => i.key !== key));
  const clear = () => save([]);

  const totalPecas = items.reduce((s, i) => s + sumSizes(i.tamanhos), 0);
  const activeFaixa = getOrderTier(totalPecas);

  const calculatedItems: CartCalculatedItem[] = items.map((item) => {
    const itemPecas = sumSizes(item.tamanhos);
    const precoUnitario = getTierUnitPrice(item.faixas, activeFaixa);
    const valorTotal = Math.round(itemPecas * precoUnitario * 100) / 100;
    return {
      ...item,
      pecas: itemPecas,
      precoUnitario,
      valorTotal,
    };
  });

  const total = calculatedItems.reduce((s, i) => s + i.valorTotal, 0);
  const minimoAtingido = totalPecas >= 10;
  const faltamMinimo = Math.max(0, 10 - totalPecas);
  const nextTierInfo = getNextTierInfo(totalPecas);

  const value: Ctx = {
    items,
    calculatedItems,
    add,
    updateTamanhos,
    updateObservacao,
    remove,
    clear,
    total,
    pecas: totalPecas,
    faixa: activeFaixa,
    minimoAtingido,
    faltamMinimo,
    nextTierInfo,
  };

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
