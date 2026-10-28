import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { brl, smSrc, SIZES } from "@/lib/format";
import { configQuery } from "@/lib/catalog.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Meu pedido — Líder Grifes Atacado" },
      { name: "description", content: "Revise os kits do seu pedido antes de enviar pelo WhatsApp." },
      { property: "og:title", content: "Meu pedido — Líder Grifes" },
      { property: "og:description", content: "Revise seu pedido no atacado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Carrinho,
});

function Carrinho() {
  const { items, remove, total, pecas } = useCart();
  const { data: cfg } = useQuery(configQuery);
  const minimo = cfg?.pedido_minimo ?? 10;
  const ok = pecas >= minimo && items.length > 0;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-6">
      <h1 className="text-2xl font-semibold">Meu pedido</h1>
      {items.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-muted-foreground">Seu pedido está vazio.</p>
          <Link to="/" className="tap mt-4 inline-flex items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">
            Ver produtos
          </Link>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {items.map((i) => (
            <li key={i.key} className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] gap-3 rounded-2xl border border-border bg-card p-3">
              <img src={smSrc(i.imagem)} alt="" loading="lazy" width={72} height={90} className="h-[90px] w-[72px] rounded-xl bg-secondary object-cover" />
              <div className="min-w-0">
                <Link to="/produto/$slug" params={{ slug: i.slug }} className="line-clamp-2 font-semibold">{i.nome}</Link>
                <p className="text-sm text-muted-foreground">Kit {i.kit} peças</p>
                <p className="text-sm text-muted-foreground">
                  {SIZES.filter((s) => i.tamanhos[s] > 0).map((s) => `${s.toUpperCase()} ${i.tamanhos[s]}`).join(" · ")}
                </p>
                <p className="mt-1 font-semibold">{brl(i.preco)}</p>
              </div>
              <button type="button" onClick={() => remove(i.key)} className="tap grid place-items-center rounded-full text-muted-foreground hover:bg-secondary" aria-label="Remover">
                <Trash2 className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 && !ok && (
        <p className="mt-4 rounded-xl bg-secondary p-3 text-sm">Pedido mínimo de {minimo} peças.</p>
      )}

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur safe-bottom">
          <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{pecas} peças</p>
              <p className="text-xl font-bold">{brl(total)}</p>
            </div>
            <Link
              to="/finalizar"
              disabled={!ok}
              className={cn("inline-flex h-12 items-center rounded-full px-6 font-semibold", ok ? "bg-primary text-primary-foreground" : "pointer-events-none bg-primary/40 text-primary-foreground")}
            >
              Finalizar pedido
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
