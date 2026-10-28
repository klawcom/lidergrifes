import { createServerFn } from '@tanstack/react-start';
import { queryOptions } from '@tanstack/react-query';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getAccount = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const [role, profile, customer] = await Promise.all([
 context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' }),
 context.supabase.from('profiles').select('*').eq('id', context.userId).maybeSingle(),
 context.supabase.from('clientes').select('*').eq('user_id', context.userId).maybeSingle(),
 ]);
 if (role.error || profile.error || customer.error) throw new Error('Não foi possível carregar sua conta.');
 return { admin: role.data === true, profile: profile.data, customer: customer.data };
});
export const accountQuery = queryOptions({ queryKey: ['account'], queryFn: () => getAccount() });
export const getMyOrders = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const { data: customer, error: cError } = await context.supabase.from('clientes').select('id').eq('user_id', context.userId).maybeSingle();
 if (cError) throw new Error('Não foi possível carregar seus pedidos.');
 if (!customer) return [];
 const { data, error } = await context.supabase.from('pedidos').select('id,total,status,created_at,observacao,itens:pedido_itens(kit,qtd_p,qtd_m,qtd_g,qtd_gg,valor,produto:produtos(nome))').eq('cliente_id', customer.id).order('created_at', { ascending: false });
 if (error) throw new Error('Não foi possível carregar seus pedidos.');
 return data ?? [];
});
export const myOrdersQuery = queryOptions({ queryKey: ['my-orders'], queryFn: () => getMyOrders() });
export const getAdmin = createServerFn({ method: 'GET' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 const { data: allowed, error: roleError } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
 if (roleError || !allowed) throw new Error('Acesso restrito ao gestor.');
 const [config, orders] = await Promise.all([context.supabase.from('configuracoes').select('*').eq('id', 1).single(), context.supabase.from('pedidos').select('id,total,status,created_at,cliente:clientes(nome,email)').order('created_at', {ascending:false}).limit(100)]);
 if (config.error || orders.error) throw new Error('Não foi possível carregar o painel.');
 return { config: config.data, orders: orders.data ?? [] };
});
export const adminQuery = queryOptions({queryKey:['admin'],queryFn:()=>getAdmin()});
export const saveConfig = createServerFn({ method:'POST' }).middleware([requireSupabaseAuth]).inputValidator((input)=>z.object({whatsapp_loja:z.string().regex(/^\d{10,15}$/)}).parse(input)).handler(async ({ data, context }) => {
 const {data:allowed,error:roleError}=await context.supabase.rpc('has_role',{_user_id:context.userId,_role:'admin'});
 if(roleError || !allowed) throw new Error('Acesso restrito ao gestor.');
 const {error}=await context.supabase.from('configuracoes').update({...data,updated_at:new Date().toISOString()}).eq('id',1);
 if(error) throw new Error('Não foi possível salvar.');
 return {ok:true};
});
