import { Link } from "@tanstack/react-router";
import type { Produto } from "@/lib/catalog.functions";
import { brl, smSrc, srcSet } from "@/lib/format";
import { getLowestUnitPrice } from "@/lib/pricing";

export function ProductCard({ p }: { p: Produto }) {
  const img = p.imagens[0];
  const menorPreco = getLowestUnitPrice(p.kits);

  return (
    <Link to="/produto/$slug" params={{ slug: p.slug }} className="group block min-w-0">
      <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-secondary">
        {img && (
          <img
            src={smSrc(img)}
            srcSet={srcSet(img)}
            sizes="(min-width: 768px) 25vw, 50vw"
            alt={p.nome}
            loading="lazy"
            decoding="async"
            width={384}
            height={480}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <p className="mt-2 line-clamp-2 font-medium leading-snug">{p.nome}</p>
      {menorPreco > 0 && (
        <p className="mt-1 text-sm text-muted-foreground">
          a partir de <span className="font-bold text-foreground">{brl(menorPreco)}</span> por peça
        </p>
      )}
    </Link>
  );
}
