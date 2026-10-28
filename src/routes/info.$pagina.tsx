import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { configQuery, type Config } from "@/lib/catalog.functions";

const PAGES: Record<string, { titulo: string; campo: keyof Config }> = {
  sobre: { titulo: "Sobre nós", campo: "texto_sobre" },
  trocas: { titulo: "Trocas e devoluções", campo: "texto_trocas" },
  privacidade: { titulo: "Privacidade", campo: "texto_privacidade" },
};

export const Route = createFileRoute("/info/$pagina")({
  loader: async ({ context, params }) => {
    if (!PAGES[params.pagina]) throw notFound();
    await context.queryClient.ensureQueryData(configQuery);
    return { titulo: PAGES[params.pagina]!.titulo };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.titulo ?? "Informações"} — Líder Grifes Atacado` },
      { name: "description", content: `${loaderData?.titulo ?? "Informações"} da Líder Grifes Atacado.` },
      { property: "og:title", content: `${loaderData?.titulo ?? "Informações"} — Líder Grifes` },
      { property: "og:description", content: "Informações institucionais da Líder Grifes Atacado." },
    ],
  }),
  component: InfoPage,
});

function InfoPage() {
  const { pagina } = Route.useParams();
  const { data: cfg } = useSuspenseQuery(configQuery);
  const pg = PAGES[pagina]!;
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{pg.titulo}</h1>
      <p className="mt-4 whitespace-pre-line text-muted-foreground">{String(cfg[pg.campo] ?? "")}</p>
    </div>
  );
}
