import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage, buildWhatsAppLink, type OrderSummaryData } from "@/lib/whatsapp-order";
import { getOrderTier, getTierUnitPrice, getNextTierInfo } from "@/lib/pricing";

describe("Complete Order Flow & WhatsApp Message Test", () => {
  it("processes a complete order with item and order observations and verifies the exact WhatsApp message", () => {
    // 1. Simulating a full checkout with item observation and order observation
    const orderData: OrderSummaryData = {
      numeroSequencial: 1,
      dataHora: new Date("2026-10-28T15:30:00"),
      itens: [
        {
          nome: "Camiseta Pima Branca",
          pecas: 10,
          precoUnitario: 24.9,
          p: 4,
          m: 3,
          g: 3,
          gg: 0,
          valor: 249.0,
          observacao: "Separar golas com acabamento canelado e tag discreta",
        },
        {
          nome: "Polo Piquet Preta",
          pecas: 20,
          precoUnitario: 37.905,
          p: 0,
          m: 10,
          g: 10,
          gg: 0,
          valor: 758.1,
          observacao: "Todas com botão reserva na etiqueta interna",
        },
      ],
      total: 1007.1,
      faixa: 30,
      cliente: {
        nome: "Claudinei Lima",
        email: "claudinei@exemplo.com",
        whatsapp: "11987654321",
        rua: "Avenida Paulista",
        numero: "1000",
        complemento: "Apto 42",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        estado: "SP",
        cep: "01310100",
      },
      observacao: "Entregar em horário comercial das 9h às 18h no setor de compras.",
    };

    // 2. Generate WhatsApp message
    const msg = buildWhatsAppMessage(orderData);

    // 3. Verify exact template format:
    // Header
    expect(msg).toContain("🛍️ *NOVO PEDIDO #0001*");
    expect(msg).toContain("*Líder Grifes Atacado*");
    expect(msg).toContain("📅 28/10/2026 às 15:30");
    expect(msg).toContain("━━━━━━━━━━━━━━");

    // Items section
    expect(msg).toContain("*ITENS*");
    expect(msg).toContain("*1) Camiseta Pima Branca*");
    expect(msg).toContain("10 peças (R$ 24,90 por peça)");
    expect(msg).toContain("Tamanhos: P 4 | M 3 | G 3"); // GG is 0 so omitted
    expect(msg).toContain("Valor: R$ 249,00");
    expect(msg).toContain("📝 Obs.: Separar golas com acabamento canelado e tag discreta");

    expect(msg).toContain("*2) Polo Piquet Preta*");
    expect(msg).toContain("20 peças (R$ 37,91 por peça)");
    expect(msg).toContain("Tamanhos: M 10 | G 10"); // P and GG are 0 so omitted
    expect(msg).toContain("Valor: R$ 758,10");
    expect(msg).toContain("📝 Obs.: Todas com botão reserva na etiqueta interna");

    // Summary section
    expect(msg).toContain("*RESUMO*");
    expect(msg).toContain("Total de peças: 30");
    expect(msg).toContain("Faixa aplicada: a partir de 30 peças");
    expect(msg).toContain("*Total dos produtos: R$ 1.007,10*");
    expect(msg).toContain("Frete e pagamento: a combinar");

    // Client section
    expect(msg).toContain("*CLIENTE*");
    expect(msg).toContain("👤 Claudinei Lima");
    expect(msg).toContain("📧 claudinei@exemplo.com");
    expect(msg).toContain("📱 +55 (11) 98765-4321"); // Phone with mask

    // Delivery section
    expect(msg).toContain("*ENTREGA*");
    expect(msg).toContain("📍 Avenida Paulista, 1000 Apto 42");
    expect(msg).toContain("Bela Vista");
    expect(msg).toContain("São Paulo/SP");
    expect(msg).toContain("CEP 01310-100"); // CEP with mask

    // Order observation
    expect(msg).toContain("📝 *Observação do pedido:*\nEntregar em horário comercial das 9h às 18h no setor de compras.");

    // Footer
    expect(msg).toContain("Aguardo o valor do frete e as formas de pagamento. Obrigado!");

    // Rule: No links to other websites
    expect(msg).not.toMatch(/https?:\/\//);

    // 4. Generate and test wa.me link
    const waLink = buildWhatsAppLink("5566996444461", msg);
    expect(waLink.startsWith("https://wa.me/5566996444461?text=")).toBe(true);

    // Verify encodeURIComponent preserved emojis, spaces, and line breaks
    const decodedMsg = decodeURIComponent(waLink.split("?text=")[1]);
    expect(decodedMsg).toBe(msg);
  });

  it("handles pricing tiers and order validation for 9, 10, 25, and 50 mixed category items", () => {
    // Mock kit prices for Camiseta (categoria 1) and Polo (categoria 2)
    const camisetaFaixas = [
      { quantidade: 10, preco: 249.0 },  // 24.90 / un
      { quantidade: 20, preco: 458.0 },  // 22.90 / un
      { quantidade: 30, preco: 627.0 },  // 20.90 / un
      { quantidade: 50, preco: 995.0 },  // 19.90 / un
    ];

    const poloFaixas = [
      { quantidade: 10, preco: 399.0 },  // 39.90 / un
      { quantidade: 20, preco: 758.1 },  // 37.905 / un
      { quantidade: 30, preco: 1077.0 }, // 35.90 / un
      { quantidade: 50, preco: 1695.0 }, // 33.90 / un
    ];

    // Case 1: 9 peças misturando (5 Camisetas + 4 Polos) - Below minimum (10)
    const totalPecas9 = 5 + 4;
    expect(totalPecas9).toBe(9);
    expect(totalPecas9 < 10).toBe(true); // Cart locks "Finalizar pedido" button
    const nextTier9 = getNextTierInfo(totalPecas9);
    expect(nextTier9).not.toBeNull();
    expect(nextTier9?.missing).toBe(1); // 1 peça faltando para atingir 10
    expect(nextTier9?.nextTier).toBe(10);

    // Case 2: 10 peças misturando (6 Camisetas + 4 Polos) - Tier 10
    const totalPecas10 = 6 + 4;
    const tier10 = getOrderTier(totalPecas10);
    expect(tier10).toBe(10);
    const precoUnitCamiseta10 = getTierUnitPrice(camisetaFaixas, tier10);
    const precoUnitPolo10 = getTierUnitPrice(poloFaixas, tier10);
    expect(precoUnitCamiseta10).toBeCloseTo(24.9, 2);
    expect(precoUnitPolo10).toBeCloseTo(39.9, 2);
    const valorCamiseta10 = precoUnitCamiseta10 * 6;
    const valorPolo10 = precoUnitPolo10 * 4;
    const total10 = valorCamiseta10 + valorPolo10;
    expect(total10).toBeCloseTo(149.4 + 159.6, 2);

    const msg10 = buildWhatsAppMessage({
      numeroSequencial: 101,
      dataHora: new Date("2026-10-28T16:00:00"),
      faixa: tier10,
      itens: [
        {
          nome: "Camiseta Pima",
          pecas: 6,
          precoUnitario: precoUnitCamiseta10,
          p: 3,
          m: 3,
          g: 0,
          gg: 0,
          valor: valorCamiseta10,
        },
        {
          nome: "Polo Piquet",
          pecas: 4,
          precoUnitario: precoUnitPolo10,
          p: 0,
          m: 2,
          g: 2,
          gg: 0,
          valor: valorPolo10,
        },
      ],
      total: total10,
      cliente: {
        nome: "Cliente 10",
        email: "c10@teste.com",
        whatsapp: "11999990010",
        cep: "01310100",
        rua: "Rua Teste",
        numero: "10",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
      },
    });
    expect(msg10).toContain("Total de peças: 10");
    expect(msg10).toContain("Faixa aplicada: a partir de 10 peças");
    expect(msg10).toContain("6 peças (R$ 24,90 por peça)");
    expect(msg10).toContain("4 peças (R$ 39,90 por peça)");

    // Case 3: 25 peças misturando (15 Camisetas + 10 Polos) - Tier 20
    const totalPecas25 = 15 + 10;
    const tier25 = getOrderTier(totalPecas25);
    expect(tier25).toBe(20);
    const precoUnitCamiseta25 = getTierUnitPrice(camisetaFaixas, tier25);
    const precoUnitPolo25 = getTierUnitPrice(poloFaixas, tier25);
    expect(precoUnitCamiseta25).toBeCloseTo(22.9, 2);
    expect(precoUnitPolo25).toBeCloseTo(37.905, 2);
    const valorCamiseta25 = precoUnitCamiseta25 * 15;
    const valorPolo25 = precoUnitPolo25 * 10;
    const total25 = valorCamiseta25 + valorPolo25;

    const msg25 = buildWhatsAppMessage({
      numeroSequencial: 102,
      dataHora: new Date("2026-10-28T16:00:00"),
      faixa: tier25,
      itens: [
        {
          nome: "Camiseta Pima",
          pecas: 15,
          precoUnitario: precoUnitCamiseta25,
          p: 5,
          m: 5,
          g: 5,
          gg: 0,
          valor: valorCamiseta25,
        },
        {
          nome: "Polo Piquet",
          pecas: 10,
          precoUnitario: precoUnitPolo25,
          p: 2,
          m: 4,
          g: 4,
          gg: 0,
          valor: valorPolo25,
        },
      ],
      total: total25,
      cliente: {
        nome: "Cliente 25",
        email: "c25@teste.com",
        whatsapp: "11999990025",
        cep: "01310100",
        rua: "Rua Teste",
        numero: "25",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
      },
    });
    expect(msg25).toContain("Total de peças: 25");
    expect(msg25).toContain("Faixa aplicada: a partir de 20 peças");
    expect(msg25).toContain("15 peças (R$ 22,90 por peça)");
    expect(msg25).toContain("10 peças (R$ 37,91 por peça)");

    // Case 4: 50 peças misturando (30 Camisetas + 20 Polos) - Tier 50
    const totalPecas50 = 30 + 20;
    const tier50 = getOrderTier(totalPecas50);
    expect(tier50).toBe(50);
    const precoUnitCamiseta50 = getTierUnitPrice(camisetaFaixas, tier50);
    const precoUnitPolo50 = getTierUnitPrice(poloFaixas, tier50);
    expect(precoUnitCamiseta50).toBeCloseTo(19.9, 2);
    expect(precoUnitPolo50).toBeCloseTo(33.9, 2);
    const valorCamiseta50 = precoUnitCamiseta50 * 30;
    const valorPolo50 = precoUnitPolo50 * 20;
    const total50 = valorCamiseta50 + valorPolo50;

    const msg50 = buildWhatsAppMessage({
      numeroSequencial: 103,
      dataHora: new Date("2026-10-28T16:00:00"),
      faixa: tier50,
      itens: [
        {
          nome: "Camiseta Pima",
          pecas: 30,
          precoUnitario: precoUnitCamiseta50,
          p: 10,
          m: 10,
          g: 10,
          gg: 0,
          valor: valorCamiseta50,
        },
        {
          nome: "Polo Piquet",
          pecas: 20,
          precoUnitario: precoUnitPolo50,
          p: 5,
          m: 5,
          g: 5,
          gg: 5,
          valor: valorPolo50,
        },
      ],
      total: total50,
      cliente: {
        nome: "Cliente 50",
        email: "c50@teste.com",
        whatsapp: "11999990050",
        cep: "01310100",
        rua: "Rua Teste",
        numero: "50",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
      },
    });
    expect(msg50).toContain("Total de peças: 50");
    expect(msg50).toContain("Faixa aplicada: a partir de 50 peças");
    expect(msg50).toContain("30 peças (R$ 19,90 por peça)");
    expect(msg50).toContain("20 peças (R$ 33,90 por peça)");

  });
});
