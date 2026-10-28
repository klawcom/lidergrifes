import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ChangeEvent } from "react";
import { useAuth } from "@/lib/auth";
import { accountQuery } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { configQuery } from "@/lib/catalog.functions";
import { createOrder } from "@/lib/order.functions";
import {
  buildWhatsAppMessage,
  buildWhatsAppLink,
  formatOrderNumber,
  formatValor,
  formatDataHora,
  formatPhone,
  formatCep,
  type OrderSummaryData,
} from "@/lib/whatsapp-order";

export const Route = createFileRoute("/finalizar")({
  head: () => ({
    meta: [
      { title: "Finalizar pedido — Líder Grifes Atacado" },
      { name: "description", content: "Informe seus dados e envie o pedido pelo WhatsApp." },
      { property: "og:title", content: "Finalizar pedido — Líder Grifes" },
      { property: "og:description", content: "Envie seu pedido no atacado pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Finalizar,
});

const digits = (s: string) => s.replace(/\D/g, "");
const input =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

type Form = Record<
  | "nome"
  | "email"
  | "whatsapp"
  | "cep"
  | "rua"
  | "numero"
  | "complemento"
  | "bairro"
  | "cidade"
  | "estado"
  | "observacao",
  string
>;

const CONFIRMED_ORDER_KEY = "lg_confirmed_order";

function Finalizar() {
  const { user } = useAuth();
  const { data: account } = useQuery({
    ...accountQuery,
    queryKey: ["account", user?.id ?? "signed-out"],
    enabled: !!user,
  });
  const cart = useCart();
  const { data: cfg } = useQuery(configQuery);
  const [f, setF] = useState<Form>({
    nome: "",
    email: "",
    whatsapp: "",
    cep: "",
    rua: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    observacao: "",
  });
  const [sending, setSending] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderSummaryData | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(CONFIRMED_ORDER_KEY);
      if (saved) {
        setConfirmedOrder(JSON.parse(saved));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    const customer = account?.customer;
    setF((current) => ({
      ...current,
      nome:
        current.nome ||
        customer?.nome ||
        account?.profile?.display_name ||
        user.user_metadata["full_name"] ||
        user.user_metadata["name"] ||
        "",
      email: user.email ?? "",
      whatsapp: current.whatsapp || customer?.whatsapp || "",
      cep: current.cep || customer?.cep || "",
      rua: current.rua || customer?.rua || "",
      numero: current.numero || customer?.numero || "",
      complemento: current.complemento || customer?.complemento || "",
      bairro: current.bairro || customer?.bairro || "",
      cidade: current.cidade || customer?.cidade || "",
      estado: current.estado || customer?.estado || "",
    }));
  }, [user, account]);

  const set = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  const buscarCep = async (cep: string) => {
    if (cep.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setF((x) => ({
          ...x,
          rua: d.logradouro || x.rua,
          bairro: d.bairro || x.bairro,
          cidade: d.localidade || x.cidade,
          estado: d.uf || x.estado,
        }));
      }
    } catch {}
  };

  const handleNovoPedido = () => {
    sessionStorage.removeItem(CONFIRMED_ORDER_KEY);
    setConfirmedOrder(null);
  };

  // 1. Order confirmation screen (displays the exact same structured summary)
  if (confirmedOrder) {
    const waLink = buildWhatsAppLink(
      cfg?.whatsapp_loja ?? "",
      buildWhatsAppMessage(confirmedOrder),
    );
    const totalPecas = confirmedOrder.itens.reduce((acc, i) => acc + i.kit, 0);

    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3 text-whatsapp">
            <CheckCircle2 className="h-8 w-8 shrink-0" />
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-whatsapp">
                Pedido recebido com sucesso
              </span>
              <h1 className="text-2xl font-bold text-foreground">
                🛍️ Pedido #{formatOrderNumber(confirmedOrder.numeroSequencial)}
              </h1>
            </div>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            *Líder Grifes Atacado* &bull; 📅 {formatDataHora(confirmedOrder.dataHora)}
          </p>

          <div className="mt-6 rounded-2xl bg-whatsapp/10 p-4 text-center">
            <p className="text-sm font-medium text-foreground">
              Envie agora a mensagem para nosso WhatsApp para confirmarmos o frete e pagamento:
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="tap mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-6 font-semibold text-whatsapp-foreground shadow-sm hover:bg-whatsapp/90"
            >
              <MessageCircle className="h-5 w-5" /> Enviar no WhatsApp
            </a>
            <p className="mt-2 text-xs text-muted-foreground">
              Se a conversa não abriu automaticamente, toque no botão acima.
            </p>
          </div>

          {/* Resumo do pedido exatamente com as seções do modelo */}
          <div className="mt-6 space-y-5 divide-y divide-border pt-2 text-sm">
            {/* ITENS */}
            <div>
              <h2 className="font-bold uppercase tracking-wide text-foreground">ITENS</h2>
              <div className="mt-3 space-y-4">
                {confirmedOrder.itens.map((item, idx) => {
                  const precoUnitario = item.kit > 0 ? item.valor / item.kit : 0;
                  const tamanhosAtivos: string[] = [];
                  if (item.p > 0) tamanhosAtivos.push(`P ${item.p}`);
                  if (item.m > 0) tamanhosAtivos.push(`M ${item.m}`);
                  if (item.g > 0) tamanhosAtivos.push(`G ${item.g}`);
                  if (item.gg > 0) tamanhosAtivos.push(`GG ${item.gg}`);

                  return (
                    <div key={idx} className="rounded-xl bg-secondary/50 p-3.5">
                      <p className="font-semibold text-foreground">
                        {idx + 1}) {item.nome}
                      </p>
                      <p className="text-muted-foreground">
                        Kit de {item.kit} peças (R$ {formatValor(precoUnitario)} por peça)
                      </p>
                      {tamanhosAtivos.length > 0 && (
                        <p className="text-muted-foreground">
                          Tamanhos: {tamanhosAtivos.join(" | ")}
                        </p>
                      )}
                      <p className="font-medium text-foreground">
                        Valor do kit: R$ {formatValor(item.valor)}
                      </p>
                      {item.observacao && item.observacao.trim() && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          📝 Obs.: {item.observacao.trim()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RESUMO */}
            <div className="pt-4">
              <h2 className="font-bold uppercase tracking-wide text-foreground">RESUMO</h2>
              <div className="mt-2 space-y-1">
                <p className="text-muted-foreground">Total de peças: {totalPecas}</p>
                <p className="text-base font-bold text-foreground">
                  Total dos produtos: R$ {formatValor(confirmedOrder.total)}
                </p>
                <p className="text-muted-foreground">Frete e pagamento: a combinar</p>
              </div>
            </div>

            {/* CLIENTE & ENTREGA */}
            <div className="pt-4">
              <h2 className="font-bold uppercase tracking-wide text-foreground">CLIENTE</h2>
              <div className="mt-2 space-y-1">
                <p>👤 {confirmedOrder.cliente.nome}</p>
                <p>📧 {confirmedOrder.cliente.email}</p>
                <p>📱 {formatPhone(confirmedOrder.cliente.whatsapp)}</p>
              </div>

              <h2 className="mt-4 font-bold uppercase tracking-wide text-foreground">ENTREGA</h2>
              <div className="mt-2 space-y-1">
                <p>
                  📍 {confirmedOrder.cliente.rua}, {confirmedOrder.cliente.numero}
                  {confirmedOrder.cliente.complemento?.trim()
                    ? ` ${confirmedOrder.cliente.complemento.trim()}`
                    : ""}
                </p>
                <p>{confirmedOrder.cliente.bairro}</p>
                <p>
                  {confirmedOrder.cliente.cidade}/
                  {confirmedOrder.cliente.estado.toUpperCase()}
                </p>
                <p>CEP {formatCep(confirmedOrder.cliente.cep)}</p>
              </div>

              {confirmedOrder.observacao && confirmedOrder.observacao.trim() && (
                <div className="mt-4 rounded-xl bg-secondary/50 p-3">
                  <p className="font-semibold text-foreground">📝 Observação do pedido:</p>
                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">
                    {confirmedOrder.observacao.trim()}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 text-center">
              <p className="text-xs text-muted-foreground italic">
                Aguardo o valor do frete e as formas de pagamento. Obrigado!
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="tap inline-flex h-12 items-center justify-center gap-2 rounded-full bg-whatsapp px-6 font-semibold text-whatsapp-foreground shadow-sm hover:bg-whatsapp/90"
            >
              <MessageCircle className="h-5 w-5" /> Reenviar no WhatsApp
            </a>
            <Button
              variant="outline"
              onClick={handleNovoPedido}
              asChild
              className="h-12 rounded-full"
            >
              <Link to="/">
                Fazer novo pedido <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Empty cart state
  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-muted-foreground">Seu pedido está vazio.</p>
        <Link
          to="/"
          className="tap mt-4 inline-flex items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  // 3. Checkout form submission
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfg?.whatsapp_loja) {
      toast.error("Aguarde o contato da loja carregar.");
      return;
    }
    let wa = digits(f.whatsapp);
    if (wa.length === 10 || wa.length === 11) wa = "55" + wa;

    // Open the window synchronously so mobile browsers don't block it.
    const win = window.open("", "_blank");
    setSending(true);
    try {
      const res = await createOrder({
        data: {
          cliente: {
            nome: f.nome,
            email: f.email,
            whatsapp: wa,
            cep: digits(f.cep),
            rua: f.rua,
            numero: f.numero,
            complemento: f.complemento,
            bairro: f.bairro,
            cidade: f.cidade,
            estado: f.estado.toUpperCase(),
          },
          observacao: f.observacao,
          itens: cart.items.map((i) => ({
            produtoId: i.produtoId,
            kit: i.kit,
            ...i.tamanhos,
            observacao: i.observacao || "",
          })),
        },
      });

      const summaryData: OrderSummaryData = {
        numeroSequencial: res.numero_sequencial,
        dataHora: res.created_at,
        itens: res.linhas.map((l) => ({
          nome: l.nome,
          kit: l.kit,
          p: l.p,
          m: l.m,
          g: l.g,
          gg: l.gg,
          valor: l.valor,
          observacao: l.observacao,
        })),
        total: res.total,
        cliente: {
          nome: f.nome,
          email: f.email,
          whatsapp: wa,
          cep: digits(f.cep),
          rua: f.rua,
          numero: f.numero,
          complemento: f.complemento,
          bairro: f.bairro,
          cidade: f.cidade,
          estado: f.estado.toUpperCase(),
        },
        observacao: f.observacao,
      };

      const msg = buildWhatsAppMessage(summaryData);
      const url = buildWhatsAppLink(cfg.whatsapp_loja, msg);

      if (win) win.location.href = url;
      else window.location.href = url;

      cart.clear();
      setConfirmedOrder(summaryData);
      try {
        sessionStorage.setItem(CONFIRMED_ORDER_KEY, JSON.stringify(summaryData));
      } catch {}

      toast.success("Pedido registrado! Envie a mensagem no WhatsApp.");
    } catch (err) {
      win?.close();
      toast.error(
        err instanceof Error && err.message.length < 120
          ? err.message
          : "Confira os dados e tente novamente.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-32 pt-6">
      <h1 className="text-2xl font-semibold">Seus dados</h1>
      <Field label="Nome completo">
        <input required autoComplete="name" className={input} value={f.nome} onChange={set("nome")} />
      </Field>
      <Field label="E-mail">
        <input
          required
          readOnly={!!user}
          type="email"
          inputMode="email"
          autoComplete="email"
          className={input}
          value={f.email}
          onChange={set("email")}
        />
      </Field>
      <Field label="WhatsApp (com DDD)">
        <input
          required
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="11999999999"
          pattern="\d{10,13}"
          className={input}
          value={f.whatsapp}
          onChange={(e) => setF({ ...f, whatsapp: digits(e.target.value) })}
        />
      </Field>

      <h2 className="mt-2 text-lg font-semibold">Endereço de entrega</h2>
      <Field label="CEP">
        <input
          required
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={8}
          pattern="\d{8}"
          className={input}
          value={f.cep}
          onChange={(e) => {
            const v = digits(e.target.value);
            setF({ ...f, cep: v });
            buscarCep(v);
          }}
        />
      </Field>
      <Field label="Rua">
        <input required autoComplete="address-line1" className={input} value={f.rua} onChange={set("rua")} />
      </Field>
      <Field label="Número">
        <input required inputMode="numeric" className={input} value={f.numero} onChange={set("numero")} />
      </Field>
      <Field label="Complemento (opcional)">
        <input autoComplete="address-line2" className={input} value={f.complemento} onChange={set("complemento")} />
      </Field>
      <Field label="Bairro">
        <input required className={input} value={f.bairro} onChange={set("bairro")} />
      </Field>
      <Field label="Cidade">
        <input required autoComplete="address-level2" className={input} value={f.cidade} onChange={set("cidade")} />
      </Field>
      <Field label="Estado (UF)">
        <input
          required
          maxLength={2}
          autoComplete="address-level1"
          className={input + " uppercase"}
          value={f.estado}
          onChange={set("estado")}
        />
      </Field>
      <Field label="Observação (opcional)">
        <textarea
          rows={3}
          maxLength={1000}
          placeholder="Observação geral para o pedido (opcional)"
          className={input + " h-auto py-3"}
          value={f.observacao}
          onChange={set("observacao")}
        />
      </Field>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur safe-bottom">
        <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{cart.pecas} peças</p>
            <p className="text-xl font-bold">{brl(cart.total)}</p>
          </div>
          <Button
            type="submit"
            disabled={sending || !cfg?.whatsapp_loja}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-whatsapp px-5 font-semibold text-whatsapp-foreground hover:bg-whatsapp/90 disabled:opacity-60"
          >
            <MessageCircle className="h-5 w-5" /> {sending ? "Enviando..." : "Enviar no WhatsApp"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
