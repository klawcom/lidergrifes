import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { produtoQuery } from "@/lib/catalog.functions";
import { brl, SIZES, smSrc, srcSet, sumSizes, type SizeQty } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { SizeCounter } from "@/components/size-counter";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(produtoQuery(params.slug));
    if (!p) throw notFound();
    return { nome: p.nome, descricao: p.descricao };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.nome} no atacado — Líder Grifes` },
          { name: "description", content: loaderData.descricao ?? loaderData.nome },
          { property: "og:title", content: `${loaderData.nome} — Líder Grifes Atacado` },
          { property: "og:description", content: loaderData.descricao ?? "" },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Produto — Líder Grifes" }, { name: "robots", content: "noindex" }],
  }),
  component: ProdutoPage,
});

const empty: SizeQty = { p: 0, m: 0, g: 0, gg: 0 };

function ProdutoPage() {
  const { slug } = Route.useParams();
  const { data: p } = useSuspenseQuery(produtoQuery(slug));
  const cart = useCart();
  const navigate = useNavigate();
  const [img, setImg] = useState(0);
  const [kitIdx, setKitIdx] = useState(0);
  const [q, setQ] = useState<SizeQty>(empty);
  if (!p) return null;

  const kit = p.kits[kitIdx];
  const total = sumSizes(q);
  const full = kit ? total >= kit.quantidade : true;

  const chooseKit = (i: number) => {
    setKitIdx(i);
    setQ(empty);
  };

  const add = () => {
    if (!kit) return;
    if (total !== kit.quantidade) {
      toast.error(`Distribua ${kit.quantidade - total} peça(s) entre os tamanhos.`);
      return;
    }
    cart.add({ produtoId: p.id, slug: p.slug, nome: p.nome, imagem: p.imagens[0] ?? "", kit: kit.quantidade, preco: kit.preco, tamanhos: q });
    toast.success("Adicionado ao pedido", { action: { label: "Ver pedido", onClick: () => navigate({ to: "/carrinho" }) } });
    setQ(empty);
  };

  return (
    <div className="mx-auto max-w-6xl pb-32 md:grid md:grid-cols-2 md:gap-10 md:px-4 md:pt-6">
      <div>
        <div className="aspect-[4/5] overflow-hidden bg-secondary md:rounded-3xl">
          {p.imagens[img] && (
            <img
              src={p.imagens[img]}
              srcSet={srcSet(p.imagens[img])}
              sizes="(min-width: 768px) 50vw, 100vw"
              alt={p.nome}
              width={768}
              height={960}
              fetchPriority="high"
              className="h-full w-full object-cover"
            />
          )}
        </div>
        {p.imagens.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 pt-3 md:px-0">
            {p.imagens.map((src, i) => (
              <button key={src + i} type="button" onClick={() => setImg(i)} className={cn("h-16 w-14 shrink-0 overflow-hidden rounded-xl border-2", i === img ? "border-foreground" : "border-transparent")} aria-label={`Foto ${i + 1}`}>
                <img src={smSrc(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-5 md:px-0">
        <p className="text-sm text-muted-foreground">{p.categoria?.nome}</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{p.nome}</h1>
        {p.descricao && <p className="mt-3 text-muted-foreground">{p.descricao}</p>}
        {p.composicao && (
          <p className="mt-2">
            <span className="font-semibold">Composição:</span> {p.composicao}
          </p>
        )}

        <h2 className="mt-8 text-lg font-semibold">Escolha o kit</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {p.kits.map((k, i) => (
            <button
              key={k.id}
              type="button"
              onClick={() => chooseKit(i)}
              aria-pressed={i === kitIdx}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center rounded-2xl border-2 px-1 transition-colors",
                i === kitIdx ? "border-foreground bg-primary text-primary-foreground" : "border-border bg-card",
              )}
            >
              <span className="text-lg font-bold leading-none">{k.quantidade}</span>
              <span className="mt-1 text-xs opacity-80">peças</span>
            </button>
          ))}
        </div>
        {kit && (
          <p className="mt-2 text-sm text-muted-foreground">
            {brl(kit.preco / kit.quantidade)} por peça
          </p>
        )}

        <div className="mt-8 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">Tamanhos</h2>
          {kit && (
            <p className={cn("font-semibold tabular-nums", full ? "text-whatsapp" : "text-muted-foreground")}>
              {total} de {kit.quantidade} peças
            </p>
          )}
        </div>
        <div className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card px-4">
          {SIZES.map((s) => (
            <SizeCounter key={s} label={s.toUpperCase()} value={q[s]} canAdd={!full} onChange={(v) => setQ({ ...q, [s]: Math.max(0, v) })} />
          ))}
        </div>
      </div>

      {kit && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur safe-bottom">
          <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">Kit {kit.quantidade} · {total}/{kit.quantidade} peças</p>
              <p className="text-xl font-bold">{brl(kit.preco)}</p>
            </div>
            <button type="button" onClick={add} className={cn("h-12 rounded-full px-6 font-semibold transition-opacity", full ? "bg-primary text-primary-foreground" : "bg-primary/40 text-primary-foreground")}>
              Adicionar ao pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
