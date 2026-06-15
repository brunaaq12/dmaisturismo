import jsPDF from "jspdf";
import { formatBRL, formatDate } from "./categories";

export interface VoucherData {
  voucher_code: string;
  quantity: number;
  total_price: number;
  unit_price?: number;
  created_at?: string;
  customer: { 
    full_name?: string | null; 
    email?: string | null; 
    phone?: string | null;
    rg?: string | null;
  };
  package: {
    title?: string; 
    location?: string; 
    departure_date?: string; 
    duration_days?: number;
    hotel_name?: string | null;
    itinerary_main?: string | null;
    itinerary_farewell?: string | null;
    itinerary_return?: string | null;
  };
  passengers?: { full_name: string; rg: string; role: string }[];
  accommodation_type?: string;
}

export const generateVoucherPDF = (v: VoucherData) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(15, 27, 61);
  doc.rect(0, 0, W, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text("D+ TURISMO", 15, 19);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Voucher de Viagem", W - 15, 19, { align: "right" });

  // Voucher code box
  doc.setTextColor(15, 27, 61);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Código do voucher", 15, 45);
  doc.setFontSize(22);
  doc.setTextColor(201, 168, 76);
  doc.text(v.voucher_code, 15, 55);

  let y = 73;
  const section = (title: string) => {
    if (y > H - 35) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 27, 61);
    doc.text(title, 15, y);
    doc.setDrawColor(220);
    doc.line(15, y + 2, W - 15, y + 2);
    y += 10;
  };

  const row = (label: string, value: string, inline = false) => {
    if (y > H - 25) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(label, 15, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text(value || "—", 15, y + 6);
    if (!inline) y += 15;
  };

  section("Dados do Titular");
  row("Nome", v.customer.full_name || "—", true);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(120);
  doc.text("RG", 120, y);
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(30);
  doc.text(v.customer.rg || "—", 120, y + 6);
  y += 15;
  
  row("E-mail", v.customer.email || "—", true);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(120);
  doc.text("Contato", 120, y);
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(30);
  doc.text(v.customer.phone || "—", 120, y + 6);
  y += 15;

  if (v.passengers && v.passengers.length > 0) {
    section("Todos os Passageiros");
    v.passengers.forEach((p) => {
      if (y > H - 20) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(30);
      doc.text(`${p.full_name} - RG: ${p.rg || "—"} (${p.role})`, 15, y);
      y += 8;
    });
    y += 4;
  }

  section("Pacote e Hospedagem");
  row("Título", v.package.title || "—");
  row("Destino", v.package.location || "—", true);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(120);
  doc.text("Data de partida", 120, y);
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(30);
  doc.text(v.package.departure_date ? formatDate(v.package.departure_date) : "—", 120, y + 6);
  y += 15;
  
  row("Hotel", v.package.hotel_name || "—", true);
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(120);
  doc.text("Tipo de Acomodação", 120, y);
  doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(30);
  doc.text(v.accommodation_type || "—", 120, y + 6);
  y += 15;

  section("Programação");
  
  // Impede quebras cegas renderizando o texto linha por linha de forma dinâmica
  if (v.package.itinerary_main) {
    if (y > H - 25) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Roteiro Principal:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const lines = doc.splitTextToSize(v.package.itinerary_main, W - 30);
    lines.forEach((line: string) => {
      if (y > H - 20) { doc.addPage(); y = 20; }
      doc.text(line, 15, y);
      y += 5.5;
    });
    y += 4;
  }
  
  if (v.package.itinerary_farewell) {
    if (y > H - 25) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Despedida:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const lines = doc.splitTextToSize(v.package.itinerary_farewell, W - 30);
    lines.forEach((line: string) => {
      if (y > H - 20) { doc.addPage(); y = 20; }
      doc.text(line, 15, y);
      y += 5.5;
    });
    y += 4;
  }
  
  if (v.package.itinerary_return) {
    if (y > H - 25) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.text("Retorno:", 15, y);
    y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const lines = doc.splitTextToSize(v.package.itinerary_return, W - 30);
    lines.forEach((line: string) => {
      if (y > H - 20) { doc.addPage(); y = 20; }
      doc.text(line, 15, y);
      y += 5.5;
    });
    y += 4;
  }

  // FORCE AQUI A NOVA PÁGINA EXCLUSIVA PARA O INFORMATIVO
  // Assim garantimos que o regulamento nunca dividirá teto na mesma página que a programação
  doc.addPage();
  y = 20;
  
  section("INFORMATIVO & REGULAMENTO");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14); // Mantido o tamanho ideal solicitado por você
  doc.setTextColor(50);
  
  const regulamento = `NO ÔNIBUS:
Não será permitido acesso ao veículo: Sem pulseira identificação, sem camisa, molhado ou em trajes de banho. Não permitido uso de: Cooler, Isopor, caixa de som de qualquer tamanho ainda que desligada e uso de bebidas alcoólicas e cigarros mesmo que eletrônico.
NÃO HAVERÁ ACORDO SOB OS ITENS MENCIONADOS ACIMA.
Pontualidade é fundamental: Em caso de atraso, o passageiro perderá o passeio, sem direito a devolução do valor pago.
Durante percursos passageiros devem estar sentados, e com uso do cinto de segurança. Não nos responsabilizamos por objetos esquecidos ou deixados no interior do veículo, ao endembarcar leve todos os objetos pessoais consigo.
Em caso de danos causados no veículo pelo passageiro, o mesmo será responsabilizado e terá que arcar com o custo diretamente com a empresa. Isentando o coordenador de viagem de quaisquer responsabilidades.

HOTEL:
Não permitido uso de som em áreas comuns. Evitem barulhos nos corredores.
Não nos responsabilizamos por itens servidos no restaurante. Ao sair certifique-se não está esquecendo nada nos armários ou nas dependências do apartamento.
A distribuição das acomodações será feita de acordo ao disponibilizado pelo hotel. Peço que aguarde ser chamado para retirada das chaves.

VIAGEM:
Caso necessário, será efetuada alteração na programação pelos guias e coordenadores de viagem sem prévio aviso. Ainda que a situação seja causada por fornecedores terceirizados.
Ao chegarmos em Porto de Galinhas, será disponibilizada uma estrutura de restaurante com café da manhã não incluso, onde poderá ser feita a troca de roupa de praia para darmos início a nossa jornada do dia. Gentileza levar troca de roupa na bagagem de mão, para que se evite a abertura de bagageiro.
Calma, imprevistos acontecem. Se algo não sair como planejado, mantenha sempre a calma, mau humor e nervosismo podem estragar parte do seu divertimento.
Não incluso: Despesas pessoais; taxas de embarque; taxas de locais visitados bem como taxas de qualquer tipo de serviço; TAXA DE GUIAMENTO R$ 5.00 POR PESSOA`;

  const regLines = doc.splitTextToSize(regulamento, W - 30);
  
  const lineHeight = 6.5; 
  regLines.forEach((line: string) => {
    if (y > H - 25) { 
      doc.addPage(); 
      y = 20; 
    }
    doc.text(line, 15, y);
    y += lineHeight;
  });

  y += 8;

  if (y > H - 25) { doc.addPage(); y = 20; }
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30);
  const now = new Date();
  doc.text(`COMPRA REALIZADA NO SITE : https://dmaisturismo.com.br na data: ${formatDate(v.created_at || now.toISOString())}`, 15, y);
  
  // Rodapé dinâmico aplicado a todas as páginas geradas
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("D+ TURISMO - Transformando sonhos em destinos.", W / 2, H - 10, { align: "center" });
  }

  doc.save(`voucher-${v.voucher_code}.pdf`);
};
