ALTER TABLE public.pedido_itens ALTER COLUMN kit DROP NOT NULL;
ALTER TABLE public.pedido_itens ADD COLUMN IF NOT EXISTS preco_unitario numeric(10,2);
ALTER TABLE public.pedido_itens ADD COLUMN IF NOT EXISTS faixa int;

UPDATE public.pedido_itens 
SET preco_unitario = round(valor / nullif(qtd_p + qtd_m + qtd_g + qtd_gg, 0), 2), 
    faixa = coalesce(kit, 10) 
WHERE preco_unitario IS NULL;
