import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

export type Kit = { id: string; quantidade: number; preco: number };
export type Produto = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  composicao: string | null;
  imagens: string[];
  estoque_pecas: number;
  categoria: { nome: string; slug: string } | null;
  kits: Kit[];
};
export type Categoria = { id: string; nome: string; slug: string; descricao: string | null };
export type Config = {
  whatsapp_loja: string;
  pedido_minimo: number;
  texto_boas_vindas: string | null;
  texto_sobre: string | null;
  texto_trocas: string | null;
  texto_privacidade: string | null;
};

const SELECT =
  "id,nome,slug,descricao,composicao,imagens,estoque_pecas,ordem,categoria_id,categoria:categorias(nome,slug),kits:kits_preco(id,quantidade,preco,ativo)";

function mapProduto(p: any): Produto {
  return {
    ...p,
    kits: (p.kits ?? [])
      .filter((k: any) => k.ativo)
      .map((k: any) => ({ id: k.id, quantidade: k.quantidade, preco: Number(k.preco) }))
      .sort((a: Kit, b: Kit) => a.quantidade - b.quantidade),
  };
}

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./public-db.server");
  const db = publicDb();
  const [cats, prods] = await Promise.all([
    db.from("categorias").select("id,nome,slug,descricao").order("ordem"),
    db.from("produtos").select(SELECT).order("ordem"),
  ]);
  if (cats.error) throw new Error(cats.error.message);
  if (prods.error) throw new Error(prods.error.message);
  const produtos = (prods.data ?? []).map(mapProduto) as (Produto & { categoria_id: string })[];
  return (cats.data ?? []).map((c) => ({
    ...c,
    produtos: produtos.filter((p) => p.categoria_id === c.id),
  }));
});

export const getCategoria = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { publicDb } = await import("./public-db.server");
    const db = publicDb();
    const { data: cat } = await db.from("categorias").select("id,nome,slug,descricao").eq("slug", data.slug).maybeSingle();
    if (!cat) return null;
    const { data: prods, error } = await db.from("produtos").select(SELECT).eq("categoria_id", cat.id).order("ordem");
    if (error) throw new Error(error.message);
    return { ...cat, produtos: (prods ?? []).map(mapProduto) };
  });

export const getProduto = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().max(120) }).parse(d))
  .handler(async ({ data }) => {
    const { publicDb } = await import("./public-db.server");
    const { data: p, error } = await publicDb().from("produtos").select(SELECT).eq("slug", data.slug).maybeSingle();
    if (error) throw new Error(error.message);
    return p ? mapProduto(p) : null;
  });

export const getConfig = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./public-db.server");
  const { data } = await publicDb().from("configuracoes").select("*").eq("id", 1).maybeSingle();
  return (data ?? { whatsapp_loja: "", pedido_minimo: 10 }) as Config;
});

export const homeQuery = queryOptions({ queryKey: ["home"], queryFn: () => getHome() });
export const configQuery = queryOptions({ queryKey: ["config"], queryFn: () => getConfig(), staleTime: 300_000 });
export const categoriaQuery = (slug: string) =>
  queryOptions({ queryKey: ["categoria", slug], queryFn: () => getCategoria({ data: { slug } }) });
export const produtoQuery = (slug: string) =>
  queryOptions({ queryKey: ["produto", slug], queryFn: () => getProduto({ data: { slug } }) });
