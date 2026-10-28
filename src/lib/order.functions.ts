import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const qty = z.number().int().min(0).max(1000);
export const orderSchema = z.object({
  cliente: z.object({
    nome: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200),
    whatsapp: z.string().regex(/^\d{10,13}$/),
    cep: z.string().regex(/^\d{8}$/),
    rua: z.string().trim().min(1).max(200),
    numero: z.string().trim().min(1).max(20),
    complemento: z.string().trim().max(100).optional().default(""),
    bairro: z.string().trim().min(1).max(100),
    cidade: z.string().trim().min(1).max(100),
    estado: z.string().trim().length(2),
  }),
  observacao: z.string().max(1000).optional().default(""),
  itens: z
    .array(z.object({ produtoId: z.string().uuid(), kit: z.number().int(), p: qty, m: qty, g: qty, gg: qty }))
    .min(1)
    .max(50),
});

/** Creates the order with server-side prices. Returns the order id, total and line details. */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const authorization = getRequest().headers.get('authorization');
    let owner: { id: string; email: string } | null = null;
    if (authorization) {
      if (!authorization.startsWith('Bearer ')) throw new Error('Entre novamente na sua conta.');
      const { data: auth, error } = await supabaseAdmin.auth.getUser(authorization.slice(7));
      if (error || !auth.user?.email || !auth.user.email_confirmed_at) throw new Error('Entre novamente na sua conta.');
      owner = { id: auth.user.id, email: auth.user.email.toLowerCase() };
    }
    const ids = [...new Set(data.itens.map((i) => i.produtoId))];
    const { data: kits, error: kErr } = await supabaseAdmin
      .from("kits_preco")
      .select("produto_id,quantidade,preco,ativo,produtos!inner(nome,ativo)")
      .in("produto_id", ids);
    if (kErr) throw new Error(kErr.message);

    const linhas = data.itens.map((i) => {
      const k = kits?.find((x) => x.produto_id === i.produtoId && x.quantidade === i.kit && x.ativo);
      if (!k || !(k as any).produtos?.ativo) throw new Error("Produto ou kit indisponível.");
      if (i.p + i.m + i.g + i.gg !== i.kit) throw new Error("A grade de tamanhos não fecha o kit.");
      return { ...i, valor: Number(k.preco), nome: (k as any).produtos.nome as string };
    });
    const total = linhas.reduce((s, l) => s + l.valor, 0);

    const c = { ...data.cliente, email: owner?.email ?? data.cliente.email.toLowerCase() };
    const { data: existing, error: findError } = await supabaseAdmin.from('clientes').select('id,user_id').eq('email', c.email).maybeSingle();
    if (findError) throw new Error('Não foi possível registrar o cliente.');
    let customerId = existing?.id;
    if (!existing) {
      const { data: cli, error } = await supabaseAdmin.from('clientes').insert({...c,user_id:owner?.id ?? null}).select('id').single();
      if (error) throw new Error('Não foi possível registrar o cliente.');
      customerId = cli.id;
    } else if (owner && (!existing.user_id || existing.user_id === owner.id)) {
      const {error}=await supabaseAdmin.from('clientes').update({...c,user_id:owner.id}).eq('id',existing.id);
      if(error) throw new Error('Não foi possível atualizar seus dados.');
    }
    if (!customerId) throw new Error('Não foi possível registrar o cliente.');

    const { data: ped, error: pErr } = await supabaseAdmin
      .from("pedidos")
      .insert({ cliente_id: customerId, user_id: owner?.id ?? null, total, observacao: data.observacao || null })
      .select("id")
      .single();
    if (pErr) throw new Error(pErr.message);

    const { error: iErr } = await supabaseAdmin.from("pedido_itens").insert(
      linhas.map((l) => ({
        pedido_id: ped.id,
        produto_id: l.produtoId,
        kit: l.kit,
        qtd_p: l.p,
        qtd_m: l.m,
        qtd_g: l.g,
        qtd_gg: l.gg,
        valor: l.valor,
      })),
    );
    if (iErr) throw new Error(iErr.message);

    return { id: ped.id, total, linhas: linhas.map(({ nome, kit, p, m, g, gg, valor }) => ({ nome, kit, p, m, g, gg, valor })) };
  });
