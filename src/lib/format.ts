export const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Responsive image helpers: each image has a "-sm" variant for small screens. */
export const smSrc = (src: string) => src.replace(/\.webp$/, "-sm.webp");
export const srcSet = (src: string) => (src.endsWith(".webp") ? `${smSrc(src)} 384w, ${src} 768w` : undefined);

export const SIZES = ["p", "m", "g", "gg"] as const;
export type Size = (typeof SIZES)[number];
export type SizeQty = Record<Size, number>;
export const sumSizes = (q: SizeQty) => q.p + q.m + q.g + q.gg;
