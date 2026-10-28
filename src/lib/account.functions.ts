import { createServerFn } from '@tanstack/react-start';
import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { isStoreManager } from './account-rules';

export const getAccount = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [role, profile, customer] = await Promise.all([
      context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' }),
      context.supabase.from('profiles').select('*').eq('id', context.userId).maybeSingle(),
      context.supabase.from('clientes').select('*').eq('user_id', context.userId).maybeSingle(),
    ]);
    if (role.error || profile.error || customer.error)
      throw new Error('Não foi possível carregar sua conta.');
    const { data: verified, error: authError } = await context.supabase.auth.getUser();
    if (authError) throw new Error('Entre novamente na sua conta.');
    return {
      admin: isStoreManager(
        verified.user?.email,
        !!verified.user?.email_confirmed_at,
        role.data === true,
      ),
      profile: profile.data,
      customer: customer.data,
    };
  });

export const accountQuery = queryOptions({
  queryKey: ['account'],
  queryFn: () => getAccount(),
});

export const getMyOrders = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: customer, error: cError } = await context.supabase
      .from('clientes')
      .select('id')
      .eq('user_id', context.userId)
      .maybeSingle();
    if (cError) throw new Error('Não foi possível carregar seus pedidos.');
    if (!customer) return [];
    const { data, error } = await context.supabase
      .from('pedidos')
      .select(
        'id,numero_sequencial,total,status,created_at,observacao,itens:pedido_itens(kit,preco_unitario,faixa,qtd_p,qtd_m,qtd_g,qtd_gg,valor,observacao,produto:produtos(nome))',
      )
      .eq('cliente_id', customer.id)
      .order('created_at', { ascending: false });
    if (error) throw new Error('Não foi possível carregar seus pedidos.');
    return data ?? [];
  });

export const myOrdersQuery = queryOptions({
  queryKey: ['my-orders'],
  queryFn: () => getMyOrders(),
});

export const getAdmin = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed, error: roleError } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    });
    const { data: verified, error: authError } = await context.supabase.auth.getUser();
    if (
      roleError ||
      authError ||
      !isStoreManager(verified.user?.email, !!verified.user?.email_confirmed_at, allowed === true)
    )
      throw new Error('Acesso restrito ao gestor.');

    const [config, orders, products] = await Promise.all([
      context.supabase.from('configuracoes').select('*').eq('id', 1).single(),
      context.supabase
        .from('pedidos')
        .select('id,numero_sequencial,total,status,created_at,cliente:clientes(nome,email)')
        .order('created_at', { ascending: false })
        .limit(100),
      context.supabase
        .from('produtos')
        .select(
          'id,nome,slug,ativo,estoque_pecas,ordem,categoria_id,categoria:categorias(nome),kits:kits_preco(id,quantidade,preco,ativo)',
        )
        .order('ordem', { ascending: true }),
    ]);

    if (config.error || orders.error) throw new Error('Não foi possível carregar o painel.');

    return {
      config: config.data,
      orders: orders.data ?? [],
      products: products.data ?? [],
    };
  });

export const adminQuery = queryOptions({
  queryKey: ['admin'],
  queryFn: () => getAdmin(),
});

export const saveConfig = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        whatsapp_loja: z.string().regex(/^\d{10,15}$/),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: allowed, error: roleError } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    });
    const { data: verified, error: authError } = await context.supabase.auth.getUser();
    if (
      roleError ||
      authError ||
      !isStoreManager(verified.user?.email, !!verified.user?.email_confirmed_at, allowed === true)
    )
      throw new Error('Acesso restrito ao gestor.');

    const { error } = await context.supabase
      .from('configuracoes')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) throw new Error('Não foi possível salvar.');
    return { ok: true };
  });

export const saveProductTierPrice = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        tierId: z.string().uuid(),
        preco: z.number().positive(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    });
    const { data: verified } = await context.supabase.auth.getUser();
    if (!isStoreManager(verified?.user?.email, !!verified?.user?.email_confirmed_at, allowed === true))
      throw new Error('Acesso restrito.');

    const { error } = await context.supabase
      .from('kits_preco')
      .update({ preco: data.preco })
      .eq('id', data.tierId);
    if (error) throw new Error('Erro ao salvar preço da faixa.');
    return { ok: true };
  });

export const saveBulkPricesAndStock = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        items: z.array(
          z.object({
            produtoId: z.string().uuid(),
            estoque_pecas: z.number().int().min(0),
            tiers: z.array(
              z.object({
                id: z.string().uuid(),
                preco: z.number().positive(),
              }),
            ),
          }),
        ),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc('has_role', {
      _user_id: context.userId,
      _role: 'admin',
    });
    const { data: verified } = await context.supabase.auth.getUser();
    if (!isStoreManager(verified?.user?.email, !!verified?.user?.email_confirmed_at, allowed === true))
      throw new Error('Acesso restrito.');

    for (const item of data.items) {
      await context.supabase
        .from('produtos')
        .update({ estoque_pecas: item.estoque_pecas })
        .eq('id', item.produtoId);

      for (const tier of item.tiers) {
        await context.supabase
          .from('kits_preco')
          .update({ preco: tier.preco })
          .eq('id', tier.id);
      }
    }
    return { ok: true };
  });
