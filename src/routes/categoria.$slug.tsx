import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { categoriaQuery } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/categoria/$slug")({
  loader: async ({ context, params }) => {
    const c = await context.queryClient.ensureQueryData(categoriaQuery(params.slug));
    if (!c) throw notFound();
    return { nome: c.nome, descricao: c.descricao };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.nome} no atacado — Líder Grifes` },
          { name: "description", content: loaderData.descricao ?? `${loaderData.nome} no atacado.` },
          { property: "og:title", content: `${loaderData.nome} — Líder Grifes` },
          { property: "og:description", content: loaderData.descricao ?? "" },
        ]
      : [{ title: "Categoria — Líder Grifes" }, { name: "robots", content: "noindex" }],
  }),
  component: CategoriaPage,
});

function CategoriaPage() {
  const { slug } = Route.useParams();
  const { data: c } = useSuspenseQuery(categoriaQuery(slug));
  if (!c) return null;
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">{c.nome}</h1>
      {c.descricao && <p className="mt-1 text-muted-foreground">{c.descricao}</p>}
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4">
        {c.produtos.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
