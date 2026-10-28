import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { checkoutEmail, canUpdateCustomer } from "./account-rules";
import { publicDb } from "./public-db.server";
import { getOrderTier, getTierUnitPrice } from "./pricing";

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
    .array(
      z.object({
        produtoId: z.string().uuid(),
        kit: z.number().int().optional().nullable(),
        p: qty,
        m: qty,
        g: qty,
        gg: qty,
        observacao: z.string().max(500).optional().default(""),
      }),
    )
    .min(1)
    .max(50),
});

/** Creates the order with server-side tier prices. Returns the order id, sequential number, total and line details. */
export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((d) => orderSchema.parse(d))
  .handler(async ({ data }) => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const hasAdminKey = Boolean(process.env["SUPABASE_SERVICE_ROLE_KEY"]);

    const ids = [...new Set(data.itens.map((i) => i.produtoId))];

    // Read prices server-side
    const dbClient = hasAdminKey
      ? (await import("@/integrations/supabase/client.server")).supabaseAdmin
      : publicDb();

    const { data: kits, error: kErr } = await dbClient
      .from("kits_preco")
      .select("produto_id,quantidade,preco,ativo,produtos!inner(nome,ativo)")
      .in("produto_id", ids);
    if (kErr) throw new Error(kErr.message);

    // Validate minimum piece requirement (soma de todos os produtos do pedido)
    const totalPecas = data.itens.reduce(
      (sum, i) => sum + (i.p + i.m + i.g + i.gg),
      0,
    );
    if (totalPecas < 10) {
      throw new Error(
        `O pedido mínimo é de 10 peças (seu pedido contém ${totalPecas} peça${totalPecas === 1 ? "" : "s"}).`,
      );
    }

    // Determine order-level discount tier (10, 20, 30, 50)
    const faixa = getOrderTier(totalPecas);

    const linhas = data.itens.map((i) => {
      const itemPecas = i.p + i.m + i.g + i.gg;
      if (itemPecas <= 0) {
        throw new Error("Cada produto deve ter pelo menos 1 peça selecionada.");
      }

      const productKits = (kits ?? [])
        .filter((x) => x.produto_id === i.produtoId && x.ativo)
        .map((k) => ({ quantidade: k.quantidade, preco: Number(k.preco) }));

      const prodMeta = kits?.find((x) => x.produto_id === i.produtoId);
      if (!productKits.length || !(prodMeta as any)?.produtos?.ativo) {
        throw new Error("Produto indisponível.");
      }

      const precoUnitario = getTierUnitPrice(productKits, faixa);
      const valor = Math.round(itemPecas * precoUnitario * 100) / 100;

      return {
        ...i,
        pecas: itemPecas,
        precoUnitario,
        faixa,
        valor,
        nome: (prodMeta as any).produtos.nome as string,
        observacao: i.observacao || "",
      };
    });

    const total = Math.round(linhas.reduce((s, l) => s + l.valor, 0) * 100) / 100;

    // If local dev environment lacks admin key, return server-priced local order simulation
    if (!hasAdminKey) {
      return {
        id: crypto.randomUUID(),
        numero_sequencial: 1,
        total,
        faixa,
        created_at: new Date().toISOString(),
        linhas: linhas.map(
          ({ nome, pecas, precoUnitario, p, m, g, gg, valor, observacao }) => ({
            nome,
            pecas,
            precoUnitario,
            p,
            m,
            g,
            gg,
            valor,
            observacao: observacao || "",
          }),
        ),
      };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const authorization = getRequest().headers.get("authorization");
    let owner: { id: string; email: string } | null = null;
    if (authorization) {
      if (!authorization.startsWith("Bearer ")) throw new Error("Entre novamente na sua conta.");
      const { data: auth, error } = await supabaseAdmin.auth.getUser(authorization.slice(7));
      if (error || !auth.user?.email || !auth.user.email_confirmed_at) throw new Error("Entre novamente na sua conta.");
      owner = { id: auth.user.id, email: auth.user.email.toLowerCase() };
    }

    const c = { ...data.cliente, email: checkoutEmail(data.cliente.email, owner?.email ?? null) };
    const { data: existing, error: findError } = await supabaseAdmin
      .from("clientes")
      .select("id,user_id")
      .eq("email", c.email)
      .maybeSingle();
    if (findError) throw new Error("Não foi possível registrar o cliente.");
    let customerId = existing?.id;
    if (!existing) {
      const { data: cli, error } = await supabaseAdmin
        .from("clientes")
        .insert({ ...c, user_id: owner?.id ?? null })
        .select("id")
        .single();
      if (error) throw new Error("Não foi possível registrar o cliente.");
      customerId = cli.id;
    } else if (owner && canUpdateCustomer(existing.user_id, owner.id)) {
      const { error } = await supabaseAdmin
        .from("clientes")
        .update({ ...c, user_id: owner.id })
        .eq("id", existing.id);
      if (error) throw new Error("Não foi possível atualizar seus dados.");
    }
    if (!customerId) throw new Error("Não foi possível registrar o cliente.");

    let ped: { id: string; numero_sequencial?: number; created_at?: string } | null = null;
    const { data: pedData, error: pErr } = await supabaseAdmin
      .from("pedidos")
      .insert({ cliente_id: customerId, user_id: owner?.id ?? null, total, observacao: data.observacao || null })
      .select("id, numero_sequencial, created_at")
      .single();

    if (pErr) {
      // Graceful fallback if database column migration is pending on remote Supabase
      const { data: fallbackPed, error: fbErr } = await supabaseAdmin
        .from("pedidos")
        .insert({ cliente_id: customerId, user_id: owner?.id ?? null, total, observacao: data.observacao || null })
        .select("id, created_at")
        .single();
      if (fbErr) throw new Error(fbErr.message);
      ped = fallbackPed as any;
    } else {
      ped = pedData as any;
    }

    let numeroSequencial = (ped as any)?.numero_sequencial;
    if (!numeroSequencial) {
      const { count } = await supabaseAdmin.from("pedidos").select("*", { count: "exact", head: true });
      numeroSequencial = count ?? 1;
    }

    // Insert order items with preco_unitario and faixa
    const itemRows = linhas.map((l) => ({
      pedido_id: ped!.id,
      produto_id: l.produtoId,
      kit: l.kit ?? null,
      qtd_p: l.p,
      qtd_m: l.m,
      qtd_g: l.g,
      qtd_gg: l.gg,
      preco_unitario: l.precoUnitario,
      faixa: l.faixa,
      valor: l.valor,
      observacao: l.observacao || null,
    }));

    const { error: iErr } = await supabaseAdmin.from("pedido_itens").insert(itemRows);
    if (iErr) {
      // Fallback in case columns preco_unitario/faixa are still running migration on remote DB
      const fallbackRows = linhas.map((l) => ({
        pedido_id: ped!.id,
        produto_id: l.produtoId,
        kit: l.faixa,
        qtd_p: l.p,
        qtd_m: l.m,
        qtd_g: l.g,
        qtd_gg: l.gg,
        valor: l.valor,
        observacao: l.observacao || null,
      }));
      const { error: fbErr } = await supabaseAdmin.from("pedido_itens").insert(fallbackRows);
      if (fbErr) throw new Error(fbErr.message);
    }

    return {
      id: ped!.id,
      numero_sequencial: Number(numeroSequencial) || 1,
      total,
      faixa,
      created_at: ped!.created_at ?? new Date().toISOString(),
      linhas: linhas.map(
        ({ nome, pecas, precoUnitario, p, m, g, gg, valor, observacao }) => ({
          nome,
          pecas,
          precoUnitario,
          p,
          m,
          g,
          gg,
          valor,
          observacao: observacao || "",
        }),
      ),
    };
  });
