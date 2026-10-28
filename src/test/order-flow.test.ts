import { describe, expect, it } from "vitest";
import { buildWhatsAppMessage, buildWhatsAppLink, type OrderSummaryData } from "@/lib/whatsapp-order";

describe("Complete Order Flow & WhatsApp Message Test", () => {
  it("processes a complete order with item and order observations and verifies the exact WhatsApp message", () => {
    // 1. Simulating a full checkout with item observation and order observation
    const orderData: OrderSummaryData = {
      numeroSequencial: 1,
      dataHora: new Date("2026-10-28T15:30:00"),
      itens: [
        {
          nome: "Camiseta Pima Branca",
          kit: 10,
          p: 4,
          m: 3,
          g: 3,
          gg: 0,
          valor: 249.0,
          observacao: "Separar golas com acabamento canelado e tag discreta",
        },
        {
          nome: "Polo Piquet Preta",
          kit: 20,
          p: 0,
          m: 10,
          g: 10,
          gg: 0,
          valor: 758.1,
          observacao: "Todas com botão reserva na etiqueta interna",
        },
      ],
      total: 1007.1,
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
    expect(msg).toContain("Kit de 10 peças (R$ 24,90 por peça)");
    expect(msg).toContain("Tamanhos: P 4 | M 3 | G 3"); // GG is 0 so omitted
    expect(msg).toContain("Valor do kit: R$ 249,00");
    expect(msg).toContain("📝 Obs.: Separar golas com acabamento canelado e tag discreta");

    expect(msg).toContain("*2) Polo Piquet Preta*");
    expect(msg).toContain("Kit de 20 peças (R$ 37,91 por peça)");
    expect(msg).toContain("Tamanhos: M 10 | G 10"); // P and GG are 0 so omitted
    expect(msg).toContain("Valor do kit: R$ 758,10");
    expect(msg).toContain("📝 Obs.: Todas com botão reserva na etiqueta interna");

    // Summary section
    expect(msg).toContain("*RESUMO*");
    expect(msg).toContain("Total de peças: 30");
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
});
