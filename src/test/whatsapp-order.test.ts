import { describe, expect, it } from "vitest";
import {
  buildWhatsAppMessage,
  buildWhatsAppLink,
  formatOrderNumber,
  formatPhone,
  formatCep,
  formatValor,
  formatDataHora,
  type OrderSummaryData,
} from "@/lib/whatsapp-order";

describe("WhatsApp Order Message Formatter", () => {
  const baseOrder: OrderSummaryData = {
    numeroSequencial: 1,
    dataHora: new Date(2026, 9, 28, 15, 30), // 28/10/2026 às 15:30
    itens: [
      {
        nome: "Camiseta Pima Branca",
        pecas: 10,
        precoUnitario: 24.9,
        p: 5,
        m: 5,
        g: 0,
        gg: 0,
        valor: 249.0,
        observacao: "Separar golas com acabamento canelado",
      },
    ],
    total: 249.0,
    faixa: 10,
    cliente: {
      nome: "Claudinei Lima",
      email: "claudinei@exemplo.com",
      whatsapp: "11987654321",
      rua: "Av. Paulista",
      numero: "1000",
      complemento: "Apto 42",
      bairro: "Bela Vista",
      cidade: "São Paulo",
      estado: "SP",
      cep: "01310100",
    },
    observacao: "Favor despachar via transportadora no período da manhã.",
  };

  it("formats a complete order matching the exact requested template", () => {
    const msg = buildWhatsAppMessage(baseOrder);

    expect(msg).toContain("🛍️ *NOVO PEDIDO #0001*");
    expect(msg).toContain("*Líder Grifes Atacado*");
    expect(msg).toContain("📅 28/10/2026 às 15:30");
    expect(msg).toContain("━━━━━━━━━━━━━━");
    expect(msg).toContain("*ITENS*");
    expect(msg).toContain("*1) Camiseta Pima Branca*");
    expect(msg).toContain("10 peças (R$ 24,90 por peça)");
    expect(msg).toContain("Tamanhos: P 5 | M 5"); // G and GG with 0 are omitted
    expect(msg).toContain("Valor: R$ 249,00");
    expect(msg).toContain("📝 Obs.: Separar golas com acabamento canelado");
    expect(msg).toContain("*RESUMO*");
    expect(msg).toContain("Total de peças: 10");
    expect(msg).toContain("Faixa aplicada: a partir de 10 peças");
    expect(msg).toContain("*Total dos produtos: R$ 249,00*");
    expect(msg).toContain("Frete e pagamento: a combinar");
    expect(msg).toContain("*CLIENTE*");
    expect(msg).toContain("👤 Claudinei Lima");
    expect(msg).toContain("📧 claudinei@exemplo.com");
    expect(msg).toContain("📱 +55 (11) 98765-4321");
    expect(msg).toContain("*ENTREGA*");
    expect(msg).toContain("📍 Av. Paulista, 1000 Apto 42");
    expect(msg).toContain("Bela Vista");
    expect(msg).toContain("São Paulo/SP");
    expect(msg).toContain("CEP 01310-100");
    expect(msg).toContain("📝 *Observação do pedido:*\nFavor despachar via transportadora no período da manhã.");
    expect(msg).toContain("Aguardo o valor do frete e as formas de pagamento. Obrigado!");

    // Rule: no external web links in the message
    expect(msg).not.toMatch(/https?:\/\//);
  });

  it("omits empty item observation, order observation, and complement", () => {
    const orderWithoutObs: OrderSummaryData = {
      ...baseOrder,
      numeroSequencial: 42,
      itens: [
        {
          nome: "Polo Piquet Preta",
          pecas: 20,
          precoUnitario: 37.905,
          p: 0,
          m: 10,
          g: 10,
          gg: 0,
          valor: 758.1,
          observacao: "", // empty item observation
        },
      ],
      faixa: 20,
      cliente: {
        ...baseOrder.cliente,
        complemento: "", // empty complement
      },
      observacao: "", // empty order observation
    };

    const msg = buildWhatsAppMessage(orderWithoutObs);

    expect(msg).toContain("🛍️ *NOVO PEDIDO #0042*");
    expect(msg).toContain("*1) Polo Piquet Preta*");
    expect(msg).toContain("Tamanhos: M 10 | G 10"); // P and GG omitted
    expect(msg).not.toContain("📝 Obs.:");
    expect(msg).not.toContain("📝 *Observação do pedido:*");
    expect(msg).toContain("📍 Av. Paulista, 1000\nBela Vista");
  });

  it("pads sequential order numbers to 4 digits", () => {
    expect(formatOrderNumber(1)).toBe("0001");
    expect(formatOrderNumber(9)).toBe("0009");
    expect(formatOrderNumber(15)).toBe("0015");
    expect(formatOrderNumber(999)).toBe("0999");
    expect(formatOrderNumber(1000)).toBe("1000");
  });

  it("formats currency in BRL with comma", () => {
    expect(formatValor(24.9)).toBe("24,90");
    expect(formatValor(249)).toBe("249,00");
    expect(formatValor(1499.5)).toBe("1.499,50");
  });

  it("formats CEP and Phone with standard masks", () => {
    expect(formatCep("01310100")).toBe("01310-100");
    expect(formatPhone("11987654321")).toBe("+55 (11) 98765-4321");
    expect(formatPhone("5511987654321")).toBe("+55 (11) 98765-4321");
    expect(formatPhone("1133334444")).toBe("+55 (11) 3333-4444");
  });

  it("generates wa.me URL with encodeURIComponent preserving emojis and line breaks", () => {
    const msg = buildWhatsAppMessage(baseOrder);
    const link = buildWhatsAppLink("5566996444461", msg);

    expect(link.startsWith("https://wa.me/5566996444461?text=")).toBe(true);
    const decoded = decodeURIComponent(link.split("?text=")[1]);
    expect(decoded).toBe(msg);
    expect(decoded).toContain("🛍️ *NOVO PEDIDO #0001*");
  });
});
