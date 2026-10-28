create type public.app_role as enum ('admin','user');
create type public.pedido_status as enum ('novo','em_atendimento','pago','enviado','cancelado');

create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.categorias (id uuid primary key default gen_random_uuid(), nome text not null, slug text not null unique, descricao text, ordem int not null default 0, ativa boolean not null default true, created_at timestamptz not null default now());
create table public.produtos (id uuid primary key default gen_random_uuid(), nome text not null, slug text not null unique, descricao text, composicao text, categoria_id uuid references public.categorias(id) on delete set null, imagens text[] not null default '{}', ativo boolean not null default true, destaque boolean not null default false, ordem int not null default 0, estoque_pecas int not null default 0, created_at timestamptz not null default now());
create table public.kits_preco (id uuid primary key default gen_random_uuid(), produto_id uuid not null references public.produtos(id) on delete cascade, quantidade int not null check (quantidade in (10,20,30,50)), preco numeric(10,2) not null, ativo boolean not null default true, unique(produto_id, quantidade));
create table public.clientes (id uuid primary key default gen_random_uuid(), nome text not null, email text not null unique, whatsapp text not null, rua text, numero text, complemento text, bairro text, cidade text, estado text, cep text, created_at timestamptz not null default now());
create table public.pedidos (id uuid primary key default gen_random_uuid(), cliente_id uuid references public.clientes(id) on delete set null, status pedido_status not null default 'novo', total numeric(10,2) not null default 0, observacao text, created_at timestamptz not null default now());
create table public.pedido_itens (id uuid primary key default gen_random_uuid(), pedido_id uuid not null references public.pedidos(id) on delete cascade, produto_id uuid references public.produtos(id) on delete set null, kit int not null, qtd_p int not null default 0, qtd_m int not null default 0, qtd_g int not null default 0, qtd_gg int not null default 0, valor numeric(10,2) not null, observacao text);
create table public.configuracoes (id int primary key default 1 check (id=1), whatsapp_loja text not null default '5511999999999', pedido_minimo int not null default 10, texto_boas_vindas text, texto_sobre text, texto_trocas text, texto_privacidade text, logo_url text, cor_destaque text, updated_at timestamptz not null default now());

grant select on public.categorias, public.produtos, public.kits_preco, public.configuracoes to anon, authenticated;
grant insert, update, delete on public.categorias, public.produtos, public.kits_preco, public.configuracoes to authenticated;
grant insert on public.clientes, public.pedidos, public.pedido_itens to anon, authenticated;
grant select, update, delete on public.clientes, public.pedidos, public.pedido_itens to authenticated;
grant all on public.categorias, public.produtos, public.kits_preco, public.configuracoes, public.clientes, public.pedidos, public.pedido_itens to service_role;

alter table public.categorias enable row level security;
alter table public.produtos enable row level security;
alter table public.kits_preco enable row level security;
alter table public.configuracoes enable row level security;
alter table public.clientes enable row level security;
alter table public.pedidos enable row level security;
alter table public.pedido_itens enable row level security;

create policy "public read" on public.categorias for select using (ativa or public.has_role(auth.uid(),'admin'));
create policy "public read" on public.produtos for select using (ativo or public.has_role(auth.uid(),'admin'));
create policy "public read" on public.kits_preco for select using (ativo or public.has_role(auth.uid(),'admin'));
create policy "public read" on public.configuracoes for select using (true);
create policy "admin all" on public.categorias for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin all" on public.produtos for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin all" on public.kits_preco for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin all" on public.configuracoes for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin all" on public.clientes for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin all" on public.pedidos for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin all" on public.pedido_itens for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

insert into public.configuracoes (id, texto_boas_vindas, texto_sobre, texto_trocas, texto_privacidade) values (1,'Camisetas básicas e polos no atacado, a partir de 10 peças.','A Líder Grifes vende camisetas básicas e polos no atacado para lojistas e revendedores.','Trocas por defeito de fabricação em até 7 dias após o recebimento.','Usamos seus dados apenas para atender o seu pedido.');

insert into public.categorias (nome, slug, descricao, ordem) values
('Camisetas Básicas Cotton Pima','camisetas-basicas-cotton-pima','Malha Pima macia, caimento perfeito.',1),
('Camisas Polo Piquet Duplo','camisas-polo-piquet-duplo','Piquet duplo encorpado, gola firme.',2);

insert into public.produtos (nome, slug, descricao, composicao, categoria_id, imagens, ordem, estoque_pecas, destaque)
select v.nome, v.slug, v.descricao, v.comp, c.id, array[v.img], v.ordem, 500, v.ordem=1 from (values
('Camiseta Pima Branca','camiseta-pima-branca','Camiseta básica gola careca em algodão Pima.','100% algodão Pima','camisetas-basicas-cotton-pima','/produtos/tee-branca.webp',1),
('Camiseta Pima Preta','camiseta-pima-preta','Camiseta básica gola careca em algodão Pima.','100% algodão Pima','camisetas-basicas-cotton-pima','/produtos/tee-preta.webp',2),
('Camiseta Pima Mescla','camiseta-pima-mescla','Camiseta básica gola careca em algodão Pima.','100% algodão Pima','camisetas-basicas-cotton-pima','/produtos/tee-mescla.webp',3),
('Camiseta Pima Marinho','camiseta-pima-marinho','Camiseta básica gola careca em algodão Pima.','100% algodão Pima','camisetas-basicas-cotton-pima','/produtos/tee-marinho.webp',4),
('Polo Piquet Branca','polo-piquet-branca','Polo clássica em piquet duplo.','100% algodão piquet duplo','camisas-polo-piquet-duplo','/produtos/polo-branca.webp',1),
('Polo Piquet Preta','polo-piquet-preta','Polo clássica em piquet duplo.','100% algodão piquet duplo','camisas-polo-piquet-duplo','/produtos/polo-preta.webp',2),
('Polo Piquet Marinho','polo-piquet-marinho','Polo clássica em piquet duplo.','100% algodão piquet duplo','camisas-polo-piquet-duplo','/produtos/polo-marinho.webp',3),
('Polo Piquet Verde','polo-piquet-verde','Polo clássica em piquet duplo.','100% algodão piquet duplo','camisas-polo-piquet-duplo','/produtos/polo-verde.webp',4)
) as v(nome,slug,descricao,comp,cat,img,ordem) join public.categorias c on c.slug=v.cat;

insert into public.kits_preco (produto_id, quantidade, preco)
select p.id, k.q, round((case when c.slug like 'camisas-polo%' then 39.9 else 24.9 end) * k.q * k.f, 2)
from public.produtos p join public.categorias c on c.id=p.categoria_id
cross join (values (10,1.0),(20,0.95),(30,0.9),(50,0.85)) as k(q,f);