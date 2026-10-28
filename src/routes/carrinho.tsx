import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, AlertCircle, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { useCart } from "@/lib/cart";
import { brl, smSrc, SIZES } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getTierUnitPrice } from "@/lib/pricing";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Meu pedido — Líder Grifes Atacado" },
      { name: "description", content: "Revise as peças do seu pedido antes de enviar pelo WhatsApp." },
      { property: "og:title", content: "Meu pedido — Líder Grifes" },
      { property: "og:description", content: "Revise seu pedido no atacado por peças e tamanhos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Carrinho,
});

function Carrinho() {
  const { calculatedItems, remove, total, pecas, faixa, minimoAtingido, faltamMinimo, nextTierInfo } =
    useCart();

  // Next tier unit price example from the first item
  const sampleItem = calculatedItems[0];
  const nextTierUnitPrice =
    sampleItem && nextTierInfo
      ? getTierUnitPrice(sampleItem.faixas, nextTierInfo.nextTier)
      : null;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-36 pt-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">Meu pedido</h1>
        {pecas > 0 && (
          <span className="text-sm font-semibold text-muted-foreground">
            {pecas} {pecas === 1 ? "peça no pedido" : "peças no pedido"}
          </span>
        )}
      </div>

      {calculatedItems.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="text-muted-foreground">Seu pedido está vazio.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Adicione ao menos 10 peças no total para finalizar seu pedido no atacado.
          </p>
          <Link
            to="/"
            className="tap mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground"
          >
            Ver catálogo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          {/* Alertas de Faixa e Mínimo */}
          <div className="mt-4 space-y-2.5">
            {!minimoAtingido ? (
              <div className="flex items-start gap-3 rounded-2xl bg-amber-500/10 p-3.5 text-amber-900 dark:text-amber-200">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="text-sm">
                  <p className="font-bold">
                    Faltam {faltamMinimo} {faltamMinimo === 1 ? "peça" : "peças"} para o pedido mínimo!
                  </p>
                  <p className="text-xs opacity-90">
                    O pedido mínimo de atacado é de 10 peças (soma de todos os produtos e categorias).
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-2xl bg-whatsapp/10 p-3 text-sm text-foreground">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-whatsapp" />
                <div>
                  <span className="font-semibold text-whatsapp">
                    Pedido mínimo atingido! ({pecas} peças)
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Faixa aplicada: a partir de {faixa} peças.
                  </span>
                </div>
              </div>
            )}

            {/* Aviso de incentivo da próxima faixa de desconto */}
            {minimoAtingido && nextTierInfo && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-accent/30 bg-accent/10 p-3 text-xs text-foreground">
                <Sparkles className="h-4 w-4 shrink-0 text-accent" />
                <p>
                  Faltam <span className="font-bold text-accent">{nextTierInfo.missing}</span>{" "}
                  {nextTierInfo.missing === 1 ? "peça" : "peças"} para o preço de{" "}
                  <span className="font-bold text-whatsapp">
                    {nextTierUnitPrice ? brl(nextTierUnitPrice) : `a partir da faixa de ${nextTierInfo.nextTier} peças`}
                  </span>{" "}
                  por peça!
                </p>
              </div>
            )}

            {minimoAtingido && !nextTierInfo && (
              <div className="flex items-center gap-2 rounded-2xl bg-secondary p-3 text-xs text-muted-foreground">
                <Sparkles className="h-4 w-4 text-whatsapp" />
                <span>Você atingiu a melhor faixa de preço com desconto máximo (50+ peças)!</span>
              </div>
            )}
          </div>

          {/* Lista de itens no pedido */}
          <ul className="mt-4 flex flex-col gap-3">
            {calculatedItems.map((i) => (
              <li
                key={i.key}
                className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
              >
                <img
                  src={smSrc(i.imagem)}
                  alt=""
                  loading="lazy"
                  width={72}
                  height={90}
                  className="h-[90px] w-[72px] rounded-xl bg-secondary object-cover"
                />
                <div className="min-w-0">
                  <Link
                    to="/produto/$slug"
                    params={{ slug: i.slug }}
                    className="line-clamp-2 font-semibold hover:underline"
                  >
                    {i.nome}
                  </Link>

                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {i.pecas} {i.pecas === 1 ? "peça" : "peças"} &bull;{" "}
                    <span className="text-whatsapp">{brl(i.precoUnitario)}/peça</span>
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {SIZES.filter((s) => i.tamanhos[s] > 0)
                      .map((s) => `${s.toUpperCase()} ${i.tamanhos[s]}`)
                      .join(" · ")}
                  </p>

                  {i.observacao && (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      📝 Obs.: {i.observacao}
                    </p>
                  )}

                  <p className="mt-1 font-bold text-foreground">{brl(i.valorTotal)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(i.key)}
                  className="tap grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Barra fixa de Finalização */}
      {calculatedItems.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur safe-bottom">
          <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-3">
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                {pecas} {pecas === 1 ? "peça" : "peças"} &bull; Faixa a partir de {faixa} un
              </p>
              <p className="text-xl font-bold">{brl(total)}</p>
            </div>
            <Link
              to="/finalizar"
              disabled={!minimoAtingido}
              className={cn(
                "inline-flex h-12 items-center justify-center rounded-full px-6 font-semibold transition-all",
                minimoAtingido
                  ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                  : "pointer-events-none cursor-not-allowed bg-muted text-muted-foreground opacity-50",
              )}
            >
              {minimoAtingido ? "Finalizar pedido" : `Faltam ${faltamMinimo} peças`}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
