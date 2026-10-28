import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Save, Package, ShoppingBag, Layers, Settings } from 'lucide-react';
import { toast } from 'sonner';
import {
  adminQuery,
  saveConfig,
  saveBulkPricesAndStock,
} from '@/lib/account.functions';
import { brandLogo, privateHead } from '@/lib/identity';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { brl } from '@/lib/format';

export const Route = createFileRoute('/_authenticated/admin')({
  head: () =>
    privateHead('Painel do gestor', 'Pedidos e configurações da Líder Grifes Atacado.'),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  component: Admin,
  errorComponent: () => (
    <section className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold">Acesso restrito ao gestor</h1>
      <p className="mt-3 text-muted-foreground">
        Sua conta não tem permissão para acessar o painel.
      </p>
    </section>
  ),
});

function Admin() {
  const { data } = useSuspenseQuery(adminQuery);
  const qc = useQueryClient();
  const [wa, setWa] = useState(data.config.whatsapp_loja);
  const [busy, setBusy] = useState(false);

  // State for products and bulk tier prices editing
  const [bulkState, setBulkState] = useState(() => {
    return (data.products || []).map((p) => ({
      produtoId: p.id,
      nome: p.nome,
      categoria: p.categoria?.nome || '',
      estoque_pecas: p.estoque_pecas || 0,
      tiers: (p.kits || []).map((k) => ({
        id: k.id,
        quantidade: k.quantidade,
        preco: Number(k.preco),
      })),
    }));
  });

  const handlePriceChange = (produtoId: string, tierId: string, val: string) => {
    const num = parseFloat(val) || 0;
    setBulkState((prev) =>
      prev.map((p) => {
        if (p.produtoId !== produtoId) return p;
        return {
          ...p,
          tiers: p.tiers.map((t) => (t.id === tierId ? { ...t, preco: num } : t)),
        };
      }),
    );
  };

  const handleStockChange = (produtoId: string, val: string) => {
    const num = parseInt(val, 10) || 0;
    setBulkState((prev) =>
      prev.map((p) => (p.produtoId === produtoId ? { ...p, estoque_pecas: num } : p)),
    );
  };

  const saveAllPricesAndStock = async () => {
    setBusy(true);
    try {
      await saveBulkPricesAndStock({
        data: {
          items: bulkState.map((b) => ({
            produtoId: b.produtoId,
            estoque_pecas: b.estoque_pecas,
            tiers: b.tiers.map((t) => ({ id: t.id, preco: t.preco })),
          })),
        },
      });
      await qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Preços e estoque atualizados com sucesso!');
    } catch {
      toast.error('Não foi possível salvar os preços.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-3">
        <img
          src={brandLogo}
          alt="Líder Grifes"
          width={64}
          height={64}
          className="h-16 w-16 object-contain"
        />
        <div>
          <h1 className="text-2xl font-bold">Painel de Gestão</h1>
          <p className="text-xs text-muted-foreground">Líder Grifes Atacado</p>
        </div>
      </div>

      <Tabs defaultValue="pedidos" className="mt-6">
        <TabsList className="h-12 w-full justify-start overflow-x-auto">
          <TabsTrigger value="pedidos" className="h-10 gap-2">
            <ShoppingBag className="h-4 w-4" /> Pedidos
          </TabsTrigger>
          <TabsTrigger value="produtos" className="h-10 gap-2">
            <Package className="h-4 w-4" /> Produtos
          </TabsTrigger>
          <TabsTrigger value="massa" className="h-10 gap-2">
            <Layers className="h-4 w-4" /> Preços e estoque em massa
          </TabsTrigger>
          <TabsTrigger value="config" className="h-10 gap-2">
            <Settings className="h-4 w-4" /> Configurações
          </TabsTrigger>
        </TabsList>

        {/* 1. Pedidos (antigos e novos visíveis) */}
        <TabsContent value="pedidos">
          {data.orders.length === 0 ? (
            <p className="py-8 text-muted-foreground">Nenhum pedido recebido.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card p-4">
              {data.orders.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div>
                    <p className="font-semibold text-foreground">
                      #{p.numero_sequencial ? String(p.numero_sequencial).padStart(4, '0') : p.id.slice(0, 8)}{' '}
                      &bull; {p.cliente?.nome ?? 'Cliente'}
                    </p>
                    <p className="break-all text-xs text-muted-foreground">{p.cliente?.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('pt-BR')} &bull;{' '}
                      {p.status.replaceAll('_', ' ')}
                    </p>
                  </div>
                  <p className="font-bold text-foreground">{brl(Number(p.total))}</p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* 2. Produtos com preços por faixa e preço por peça calculado */}
        <TabsContent value="produtos">
          <div className="mt-4 space-y-4">
            {bulkState.map((prod) => (
              <div
                key={prod.produtoId}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {prod.categoria}
                    </span>
                    <h3 className="text-lg font-bold text-foreground">{prod.nome}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">Estoque:</span>
                    <input
                      type="number"
                      min={0}
                      value={prod.estoque_pecas}
                      onChange={(e) => handleStockChange(prod.produtoId, e.target.value)}
                      className="h-9 w-20 rounded-lg border border-input bg-background px-2 text-center text-sm font-semibold"
                    />
                    <span className="text-xs text-muted-foreground">peças</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {prod.tiers.map((tier) => {
                    const unitPrice =
                      tier.quantidade > 0 ? tier.preco / tier.quantidade : 0;
                    return (
                      <div
                        key={tier.id}
                        className="rounded-xl border border-border/80 bg-secondary/50 p-3"
                      >
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold text-foreground">
                            Faixa {tier.quantidade} peças
                          </span>
                          <span className="text-xs font-semibold text-whatsapp">
                            {brl(unitPrice)}/peça
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={tier.preco}
                            onChange={(e) =>
                              handlePriceChange(prod.produtoId, tier.id, e.target.value)
                            }
                            className="h-9 w-full rounded-lg border border-input bg-card px-2 text-sm font-semibold"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-2">
              <Button onClick={saveAllPricesAndStock} disabled={busy} className="h-11 rounded-full px-6 gap-2">
                <Save className="h-4 w-4" /> {busy ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* 3. Preços e estoque em massa */}
        <TabsContent value="massa">
          <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Edição em Massa: Preços das Faixas e Estoque
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ao lado de cada valor de faixa, confira o preço unitário por peça calculado em tempo real.
                </p>
              </div>
              <Button onClick={saveAllPricesAndStock} disabled={busy} className="h-10 rounded-full px-5 gap-2">
                <Save className="h-4 w-4" /> {busy ? 'Salvando...' : 'Salvar tudo'}
              </Button>
            </div>

            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 pr-4">Produto</th>
                  <th className="py-2.5 px-2 text-center">Estoque</th>
                  <th className="py-2.5 px-2">Faixa 10 un</th>
                  <th className="py-2.5 px-2">Faixa 20 un</th>
                  <th className="py-2.5 px-2">Faixa 30 un</th>
                  <th className="py-2.5 px-2">Faixa 50 un</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bulkState.map((prod) => (
                  <tr key={prod.produtoId} className="hover:bg-secondary/40">
                    <td className="py-3 pr-4 font-medium">
                      <span className="block font-semibold">{prod.nome}</span>
                      <span className="text-xs text-muted-foreground">{prod.categoria}</span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <input
                        type="number"
                        min={0}
                        value={prod.estoque_pecas}
                        onChange={(e) => handleStockChange(prod.produtoId, e.target.value)}
                        className="h-9 w-16 rounded-lg border border-input bg-card px-2 text-center text-xs font-semibold"
                      />
                    </td>
                    {prod.tiers.map((tier) => {
                      const unitPrice =
                        tier.quantidade > 0 ? tier.preco / tier.quantidade : 0;
                      return (
                        <td key={tier.id} className="py-3 px-2">
                          <input
                            type="number"
                            step="0.01"
                            value={tier.preco}
                            onChange={(e) =>
                              handlePriceChange(prod.produtoId, tier.id, e.target.value)
                            }
                            className="h-8 w-24 rounded-lg border border-input bg-card px-2 text-xs font-semibold"
                          />
                          <span className="block text-[11px] font-medium text-whatsapp">
                            {brl(unitPrice)}/un
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* 4. Configurações */}
        <TabsContent value="config">
          <form
            className="mt-6 max-w-md"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                await saveConfig({ data: { whatsapp_loja: wa } });
                await Promise.all([
                  qc.invalidateQueries({ queryKey: ['config'] }),
                  qc.invalidateQueries({ queryKey: ['admin'] }),
                ]);
                toast.success('Configurações salvas.');
              } catch {
                toast.error('Não foi possível salvar.');
              } finally {
                setBusy(false);
              }
            }}
          >
            <label className="flex flex-col gap-2 text-sm font-medium">
              WhatsApp da loja
              <input
                required
                aria-label="WhatsApp da loja"
                pattern="\d{10,15}"
                inputMode="numeric"
                value={wa}
                onChange={(e) => setWa(e.target.value.replace(/\D/g, ''))}
                className="h-12 rounded-xl border border-input bg-card px-3 text-base"
              />
            </label>
            <Button type="submit" disabled={busy} className="mt-4 h-12 rounded-full px-6 gap-2">
              <Save className="h-4 w-4" />
              {busy ? 'Salvando…' : 'Salvar'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </section>
  );
}
