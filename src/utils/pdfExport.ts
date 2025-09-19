import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export async function exportToPDF(element: HTMLElement, filename: string = 'relatorio_comps.pdf') {
  try {
    // Configurar opções do html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Aumentar escala para melhor qualidade
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });

    // Criar PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Calcular dimensões
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // Calcular proporção para ajustar à página
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;
    
    // Centralizar na página
    const x = (pdfWidth - finalWidth) / 2;
    const y = (pdfHeight - finalHeight) / 2;
    
    // Adicionar imagem ao PDF
    pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);
    
    // Se o conteúdo for muito alto, adicionar páginas adicionais
    if (finalHeight > pdfHeight) {
      const totalPages = Math.ceil(finalHeight / pdfHeight);
      
      for (let i = 1; i < totalPages; i++) {
        pdf.addPage();
        const yOffset = -i * pdfHeight;
        pdf.addImage(imgData, 'PNG', x, yOffset, finalWidth, finalHeight);
      }
    }
    
    // Salvar arquivo
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
}

export function generatePDFFilename(filters: {
  startDate: string;
  endDate: string;
  reportType: string;
}): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '-');
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const reportType = getReportTypeLabel(filters.reportType).toLowerCase();
  
  return `relatorio_comps_${reportType}_${date}_${time}.pdf`;
}

function getReportTypeLabel(reportType: string): string {
  switch (reportType) {
    case 'diario': return 'Diário';
    case 'semanal': return 'Semanal';
    case 'mensal': return 'Mensal';
    case 'personalizado': return 'Personalizado';
    default: return reportType;
  }
}
