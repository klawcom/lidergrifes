import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ChangeEvent } from "react";
import { useAuth } from "@/lib/auth";
import { accountQuery } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/format";
import { configQuery } from "@/lib/catalog.functions";
import { createOrder } from "@/lib/order.functions";

export const Route = createFileRoute("/finalizar")({
  head: () => ({
    meta: [
      { title: "Finalizar pedido — Líder Grifes Atacado" },
      { name: "description", content: "Informe seus dados e envie o pedido pelo WhatsApp." },
      { property: "og:title", content: "Finalizar pedido — Líder Grifes" },
      { property: "og:description", content: "Envie seu pedido no atacado pelo WhatsApp." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Finalizar,
});

const digits = (s: string) => s.replace(/\D/g, "");
const input =
  "h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

type Form = Record<"nome" | "email" | "whatsapp" | "cep" | "rua" | "numero" | "complemento" | "bairro" | "cidade" | "estado" | "observacao", string>;

function Finalizar() {
  const { user } = useAuth();
  const { data: account } = useQuery({...accountQuery,queryKey:['account',user?.id],enabled:!!user});
  const cart = useCart();
  const { data: cfg } = useQuery(configQuery);
  const [f, setF] = useState<Form>({ nome: "", email: "", whatsapp: "", cep: "", rua: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", observacao: "" });
  const [sending, setSending] = useState(false);
  useEffect(()=>{
    if (!user) return;
    const customer = account?.customer;
    setF(current=>({...current,nome:current.nome || customer?.nome || account?.profile?.display_name || user.user_metadata.full_name || user.user_metadata.name || '',email:user.email ?? '',whatsapp:current.whatsapp || customer?.whatsapp || '',cep:current.cep || customer?.cep || '',rua:current.rua || customer?.rua || '',numero:current.numero || customer?.numero || '',complemento:current.complemento || customer?.complemento || '',bairro:current.bairro || customer?.bairro || '',cidade:current.cidade || customer?.cidade || '',estado:current.estado || customer?.estado || ''}));
  },[user,account]);
  const set = (k: keyof Form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const buscarCep = async (cep: string) => {
    if (cep.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const d = await r.json();
      if (!d.erro) setF((x) => ({ ...x, rua: d.logradouro || x.rua, bairro: d.bairro || x.bairro, cidade: d.localidade || x.cidade, estado: d.uf || x.estado }));
    } catch {}
  };

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <p className="text-muted-foreground">Seu pedido está vazio.</p>
        <Link to="/" className="tap mt-4 inline-flex items-center rounded-full bg-primary px-6 font-semibold text-primary-foreground">Ver produtos</Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfg?.whatsapp_loja) { toast.error('Aguarde o contato da loja carregar.'); return; }
    let wa = digits(f.whatsapp);
    if (wa.length === 10 || wa.length === 11) wa = "55" + wa;
    // Open the window synchronously so mobile browsers don't block it.
    const win = window.open("", "_blank");
    setSending(true);
    try {
      const res = await createOrder({
        data: {
          cliente: { nome: f.nome, email: f.email, whatsapp: wa, cep: digits(f.cep), rua: f.rua, numero: f.numero, complemento: f.complemento, bairro: f.bairro, cidade: f.cidade, estado: f.estado.toUpperCase() },
          observacao: f.observacao,
          itens: cart.items.map((i) => ({ produtoId: i.produtoId, kit: i.kit, ...i.tamanhos })),
        },
      });
      const linhas = res.linhas
        .map((l, n) => `${n + 1}. ${l.nome} — Kit ${l.kit}\n   P ${l.p} · M ${l.m} · G ${l.g} · GG ${l.gg} — ${brl(l.valor)}`)
        .join("\n");
      const msg =
        `*Novo pedido #${res.id.slice(0, 8)}*\n\n${linhas}\n\n*Total: ${brl(res.total)}*\n\n` +
        `*Cliente:* ${f.nome}\n${f.email}\nWhatsApp: ${wa}\n` +
        `${f.rua}, ${f.numero}${f.complemento ? " - " + f.complemento : ""}\n${f.bairro} — ${f.cidade}/${f.estado.toUpperCase()}\nCEP ${digits(f.cep)}` +
        (f.observacao ? `\n\n*Obs:* ${f.observacao}` : "");
      const url = `https://wa.me/${cfg?.whatsapp_loja ?? ""}?text=${encodeURIComponent(msg)}`;
      if (win) win.location.href = url;
      else window.location.href = url;
      cart.clear();
      toast.success("Pedido registrado! Envie a mensagem no WhatsApp.");
    } catch (err) {
      win?.close();
      toast.error(err instanceof Error && err.message.length < 120 ? err.message : "Confira os dados e tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-md flex-col gap-4 px-4 pb-32 pt-6">
      <h1 className="text-2xl font-semibold">Seus dados</h1>
      <Field label="Nome completo"><input required autoComplete="name" className={input} value={f.nome} onChange={set("nome")} /></Field>
      <Field label="E-mail"><input required readOnly={!!user} type="email" inputMode="email" autoComplete="email" className={input} value={f.email} onChange={set("email")} /></Field>
      <Field label="WhatsApp (com DDD)"><input required type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="11999999999" pattern="\d{10,13}" className={input} value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: digits(e.target.value) })} /></Field>
      <h2 className="mt-2 text-lg font-semibold">Endereço de entrega</h2>
      <Field label="CEP"><input required inputMode="numeric" autoComplete="postal-code" maxLength={8} pattern="\d{8}" className={input} value={f.cep} onChange={(e) => { const v = digits(e.target.value); setF({ ...f, cep: v }); buscarCep(v); }} /></Field>
      <Field label="Rua"><input required autoComplete="address-line1" className={input} value={f.rua} onChange={set("rua")} /></Field>
      <Field label="Número"><input required inputMode="numeric" className={input} value={f.numero} onChange={set("numero")} /></Field>
      <Field label="Complemento (opcional)"><input autoComplete="address-line2" className={input} value={f.complemento} onChange={set("complemento")} /></Field>
      <Field label="Bairro"><input required className={input} value={f.bairro} onChange={set("bairro")} /></Field>
      <Field label="Cidade"><input required autoComplete="address-level2" className={input} value={f.cidade} onChange={set("cidade")} /></Field>
      <Field label="Estado (UF)"><input required maxLength={2} autoComplete="address-level1" className={input + " uppercase"} value={f.estado} onChange={set("estado")} /></Field>
      <Field label="Observação (opcional)"><textarea rows={3} maxLength={1000} className={input + " h-auto py-3"} value={f.observacao} onChange={set("observacao")} /></Field>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur safe-bottom">
        <div className="mx-auto grid max-w-md grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 pt-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{cart.pecas} peças</p>
            <p className="text-xl font-bold">{brl(cart.total)}</p>
          </div>
          <Button type="submit" disabled={sending || !cfg?.whatsapp_loja} className="inline-flex h-12 items-center gap-2 rounded-full bg-whatsapp px-5 font-semibold text-whatsapp-foreground hover:bg-whatsapp/90 disabled:opacity-60">
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
