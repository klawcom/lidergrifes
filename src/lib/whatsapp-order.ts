export type OrderItemData = {
  nome: string;
  kit: number;
  p: number;
  m: number;
  g: number;
  gg: number;
  valor: number;
  observacao?: string | null;
};

export type OrderClienteData = {
  nome: string;
  email: string;
  whatsapp: string;
  cep: string;
  rua: string;
  numero: string;
  complemento?: string | null;
  bairro: string;
  cidade: string;
  estado: string;
};

export type OrderSummaryData = {
  numeroSequencial: number;
  dataHora: Date | string;
  itens: OrderItemData[];
  total: number;
  cliente: OrderClienteData;
  observacao?: string | null;
};

export function formatOrderNumber(num: number): string {
  const safeNum = Math.max(1, Math.floor(Number(num) || 1));
  return String(safeNum).padStart(4, "0");
}

export function formatValor(v: number): string {
  return Number(v).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCep(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return raw;
}

export function formatPhone(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }
  if (digits.length === 11) {
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return raw.startsWith("+") ? raw : `+55 ${raw}`;
}

export function formatDataHora(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

const DIVISOR = "━━━━━━━━━━━━━━";

export function buildWhatsAppMessage(data: OrderSummaryData): string {
  const numFormatado = formatOrderNumber(data.numeroSequencial);
  const dataHoraStr = formatDataHora(data.dataHora);

  const header = [
    `🛍️ *NOVO PEDIDO #${numFormatado}*`,
    `*Líder Grifes Atacado*`,
    `📅 ${dataHoraStr}`,
  ].join("\n");

  const itensBlocks = data.itens.map((item, idx) => {
    const itemNum = idx + 1;
    const precoUnitario = item.kit > 0 ? item.valor / item.kit : 0;

    const tamanhosAtivos: string[] = [];
    if (item.p > 0) tamanhosAtivos.push(`P ${item.p}`);
    if (item.m > 0) tamanhosAtivos.push(`M ${item.m}`);
    if (item.g > 0) tamanhosAtivos.push(`G ${item.g}`);
    if (item.gg > 0) tamanhosAtivos.push(`GG ${item.gg}`);

    const lines = [
      `*${itemNum}) ${item.nome}*`,
      `Kit de ${item.kit} peças (R$ ${formatValor(precoUnitario)} por peça)`,
    ];

    if (tamanhosAtivos.length > 0) {
      lines.push(`Tamanhos: ${tamanhosAtivos.join(" | ")}`);
    }

    lines.push(`Valor do kit: R$ ${formatValor(item.valor)}`);

    const obsItem = item.observacao?.trim();
    if (obsItem) {
      lines.push(`📝 Obs.: ${obsItem}`);
    }

    return lines.join("\n");
  });

  const totalPecas = data.itens.reduce((acc, i) => acc + i.kit, 0);

  const resumo = [
    `*RESUMO*`,
    `Total de peças: ${totalPecas}`,
    `*Total dos produtos: R$ ${formatValor(data.total)}*`,
    `Frete e pagamento: a combinar`,
  ].join("\n");

  const compl = data.cliente.complemento?.trim();
  const linhaEndereco = compl
    ? `📍 ${data.cliente.rua}, ${data.cliente.numero} ${compl}`
    : `📍 ${data.cliente.rua}, ${data.cliente.numero}`;

  const clienteLines = [
    `*CLIENTE*`,
    `👤 ${data.cliente.nome}`,
    `📧 ${data.cliente.email}`,
    `📱 ${formatPhone(data.cliente.whatsapp)}`,
    `*ENTREGA*`,
    linhaEndereco,
    data.cliente.bairro,
    `${data.cliente.cidade}/${data.cliente.estado.toUpperCase()}`,
    `CEP ${formatCep(data.cliente.cep)}`,
  ];

  const obsPedido = data.observacao?.trim();
  if (obsPedido) {
    clienteLines.push(`📝 *Observação do pedido:*\n${obsPedido}`);
  }

  const footer = `Aguardo o valor do frete e as formas de pagamento. Obrigado!`;

  return [
    header,
    DIVISOR,
    `*ITENS*\n${itensBlocks.join("\n")}`,
    DIVISOR,
    resumo,
    DIVISOR,
    clienteLines.join("\n"),
    "",
    footer,
  ].join("\n");
}

export function buildWhatsAppLink(whatsappLoja: string, message: string): string {
  const digits = (whatsappLoja || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
