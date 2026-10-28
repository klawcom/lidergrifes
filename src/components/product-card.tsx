import { Link } from "@tanstack/react-router";
import type { Produto } from "@/lib/catalog.functions";
import { brl, smSrc, srcSet } from "@/lib/format";

export function ProductCard({ p }: { p: Produto }) {
  const img = p.imagens[0];
  const min = p.kits[0];
  const unit = min ? min.preco / min.quantidade : 0;
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
      {min && (
        <p className="text-sm text-muted-foreground">
          a partir de <span className="font-semibold text-foreground">{brl(min.preco)}</span>
          <span className="block text-xs">kit {min.quantidade} · {brl(unit)}/peça</span>
        </p>
      )}
    </Link>
  );
}
