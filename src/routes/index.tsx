import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle, Package, Truck } from "lucide-react";
import { homeQuery } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Líder Grifes Atacado — Camisetas e polos a partir de 10 peças" },
      { name: "description", content: "Camisetas básicas Cotton Pima e polos Piquet Duplo no atacado. Monte seu kit e finalize o pedido pelo WhatsApp." },
      { property: "og:title", content: "Líder Grifes Atacado" },
      { property: "og:description", content: "Camisetas básicas e polos no atacado, a partir de 10 peças." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Index,
});

const passos = [
  { icon: Package, t: "Escolha o kit", d: "Kits de 10, 20, 30 ou 50 peças, com a grade de tamanhos que você quiser." },
  { icon: MessageCircle, t: "Envie no WhatsApp", d: "Finalize o pedido e ele chega pronto na nossa conversa." },
  { icon: Truck, t: "Combine frete e pagamento", d: "Acertamos tudo direto com você, rápido e sem complicação." },
];

function Index() {
  const { data: cats } = useSuspenseQuery(homeQuery);
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="mt-4 rounded-3xl bg-secondary px-5 py-10 sm:px-10 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent-foreground/70">Atacado</p>
        <h1 className="mt-2 max-w-xl text-3xl font-semibold leading-tight sm:text-5xl">
          Camisetas básicas e polos no atacado, a partir de <span className="text-accent">10 peças</span>
        </h1>
        {cats[0] && (
          <Link
            to="/categoria/$slug"
            params={{ slug: cats[0].slug }}
            className="tap mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 font-semibold text-primary-foreground"
          >
            Ver catálogo <ArrowRight className="h-5 w-5" />
          </Link>
        )}
      </section>

      {cats.map((c) => (
        <section key={c.id} className="mt-12">
          <div className="mb-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
            <h2 className="text-xl font-semibold sm:text-2xl">{c.nome}</h2>
            <Link
              to="/categoria/$slug"
              params={{ slug: c.slug }}
              className="tap inline-flex items-center gap-1 rounded-full px-3 text-sm font-semibold hover:bg-secondary"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4">
            {c.produtos.slice(0, 4).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      ))}

      <section className="mt-16">
        <h2 className="text-xl font-semibold sm:text-2xl">Como comprar</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {passos.map((s, i) => (
            <li key={s.t} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent font-bold text-accent-foreground">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-semibold">
                  <s.icon className="h-4 w-4 text-muted-foreground" /> {s.t}
                </p>
                <p className="mt-1 text-muted-foreground">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
