export type PriceTier = {
  id?: string;
  quantidade: number;
  preco: number;
};

export const TIERS = [10, 20, 30, 50] as const;
export type TierQty = (typeof TIERS)[number];

/** Returns the active pricing tier (10, 20, 30, 50) based on total pieces in the order */
export function getOrderTier(totalPecas: number): TierQty {
  if (totalPecas >= 50) return 50;
  if (totalPecas >= 30) return 30;
  if (totalPecas >= 20) return 20;
  return 10;
}

/** Calculates the unit price (preço da peça) for a given tier quantity */
export function getTierUnitPrice(tiers: PriceTier[], tierQty: number): number {
  if (!tiers || tiers.length === 0) return 0;
  const exact = tiers.find((t) => t.quantidade === tierQty);
  if (exact && exact.quantidade > 0) {
    return exact.preco / exact.quantidade;
  }
  const sorted = [...tiers].sort((a, b) => a.quantidade - b.quantidade);
  const candidate =
    [...sorted].reverse().find((t) => t.quantidade <= tierQty) || sorted[0];
  return candidate && candidate.quantidade > 0
    ? candidate.preco / candidate.quantidade
    : 0;
}

/** Lowest unit price for a product ("a partir de R$ X por peça") */
export function getLowestUnitPrice(tiers: PriceTier[]): number {
  if (!tiers || tiers.length === 0) return 0;
  const unitPrices = tiers
    .filter((t) => t.quantidade > 0)
    .map((t) => t.preco / t.quantidade);
  return unitPrices.length > 0 ? Math.min(...unitPrices) : 0;
}

export type NextTierInfo = {
  nextTier: number;
  missing: number;
};

/**
 * Returns the next discount tier and how many pieces are missing to unlock it.
 * Returns null if the maximum discount tier (50+ pieces) is already unlocked.
 */
export function getNextTierInfo(totalPecas: number): NextTierInfo | null {
  if (totalPecas < 10) {
    return { nextTier: 10, missing: 10 - totalPecas };
  }
  if (totalPecas < 20) {
    return { nextTier: 20, missing: 20 - totalPecas };
  }
  if (totalPecas < 30) {
    return { nextTier: 30, missing: 30 - totalPecas };
  }
  if (totalPecas < 50) {
    return { nextTier: 50, missing: 50 - totalPecas };
  }
  return null;
}
