import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { produtoQuery } from "@/lib/catalog.functions";
import { brl, SIZES, smSrc, srcSet, sumSizes, type SizeQty } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { SizeCounter } from "@/components/size-counter";
import { cn } from "@/lib/utils";
import { getLowestUnitPrice, getTierUnitPrice, TIERS } from "@/lib/pricing";
import { Info, Sparkles } from "lucide-react";

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
  const [q, setQ] = useState<SizeQty>(empty);
  const [observacao, setObservacao] = useState("");
  if (!p) return null;

  const total = sumSizes(q);
  const menorPreco = getLowestUnitPrice(p.kits);

  const add = () => {
    if (total <= 0) {
      toast.error("Selecione pelo menos 1 peça para adicionar ao pedido.");
      return;
    }

    cart.add({
      produtoId: p.id,
      slug: p.slug,
      nome: p.nome,
      imagem: p.imagens[0] ?? "",
      tamanhos: q,
      faixas: p.kits.map((k) => ({ quantidade: k.quantidade, preco: k.preco })),
      observacao: observacao.trim() || undefined,
    });

    toast.success(`${total} peça(s) adicionada(s) ao pedido!`, {
      action: {
        label: "Ver pedido",
        onClick: () => navigate({ to: "/carrinho" }),
      },
    });

    setQ(empty);
    setObservacao("");
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
              <button
                key={src + i}
                type="button"
                onClick={() => setImg(i)}
                className={cn(
                  "h-16 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                  i === img ? "border-foreground" : "border-transparent",
                )}
                aria-label={`Foto ${i + 1}`}
              >
                <img src={smSrc(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-5 md:px-0">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {p.categoria?.nome}
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">{p.nome}</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          A partir de <span className="text-xl font-bold text-foreground">{brl(menorPreco)}</span> por peça
        </p>

        {p.descricao && <p className="mt-3 text-muted-foreground">{p.descricao}</p>}
        {p.composicao && (
          <p className="mt-2 text-sm">
            <span className="font-semibold">Composição:</span> {p.composicao}
          </p>
        )}

        {/* Tabela de Preço por Peça */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Preço por peça
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Desconto progressivo calculado pelo total de peças somadas no pedido:
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIERS.map((tier) => {
              const unitPrice = getTierUnitPrice(p.kits, tier);
              return (
                <div
                  key={tier}
                  className="flex flex-col items-center justify-center rounded-xl bg-secondary/60 p-2.5 text-center"
                >
                  <span className="text-xs text-muted-foreground">a partir de</span>
                  <span className="font-bold text-foreground">{tier} peças</span>
                  <span className="mt-1 text-sm font-extrabold text-whatsapp">
                    {brl(unitPrice)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">por peça</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Aviso de cores sortidas */}
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-amber-500/10 p-3.5 text-amber-950 dark:text-amber-200">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-xs leading-relaxed">
            <span className="font-semibold">Aviso de cores sortidas:</span> As peças são enviadas
            em cores sortidas da coleção. Se desejar cores ou modelos específicos, informe no campo
            de observação abaixo.
          </p>
        </div>

        {/* Seleção de peças por tamanho */}
        <div className="mt-6 flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">Escolha as peças por tamanho</h2>
          <span className="text-sm font-semibold tabular-nums text-muted-foreground">
            {total} {total === 1 ? "peça" : "peças"}
          </span>
        </div>

        <div className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card px-4">
          {SIZES.map((s) => (
            <SizeCounter
              key={s}
              label={s.toUpperCase()}
              value={q[s]}
              canAdd={true}
              onChange={(v) => setQ({ ...q, [s]: Math.max(0, v) })}
            />
          ))}
        </div>

        {/* Observação do item */}
        <div className="mt-4">
          <label htmlFor="item-obs" className="text-sm font-medium">
            Observação do item (opcional)
          </label>
          <input
            id="item-obs"
            type="text"
            maxLength={300}
            placeholder="Ex.: cores preferidas, detalhes ou estampas específicas"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="mt-1.5 h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      {/* Barra de ação inferior fixa */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur safe-bottom">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-3">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">
              {total > 0
                ? `${total} ${total === 1 ? "peça selecionada" : "peças selecionadas"}`
                : "Selecione as peças"}
            </p>
            <p className="text-lg font-bold text-foreground">
              {total > 0
                ? `${brl(getTierUnitPrice(p.kits, 10) * total)} (faixa base)`
                : `A partir de ${brl(menorPreco)}/un`}
            </p>
          </div>
          <button
            type="button"
            onClick={add}
            disabled={total <= 0}
            className={cn(
              "h-12 rounded-full px-6 font-semibold transition-all",
              total >= 1
                ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                : "cursor-not-allowed bg-primary/30 text-primary-foreground opacity-60",
            )}
          >
            Adicionar ao pedido
          </button>
        </div>
      </div>
    </div>
  );
}
