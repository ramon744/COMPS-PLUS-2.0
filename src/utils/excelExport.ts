import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CompData {
  id: string;
  valorCentavos: number;
  diaOperacional: string;
  compTypeId: string;
  waiterId: string;
  gerenteId: string;
  motivo?: string;
  dataHoraLocal: string;
  dataHoraUtc: string;
  turno: "manha" | "noite";
  observacoes?: string;
}

interface CompType {
  id: string;
  codigo: string;
  nome: string;
}

interface Waiter {
  id: string;
  nome: string;
  matricula?: string;
}

interface Manager {
  id: string;
  nome: string;
  email: string;
}

interface FilterParams {
  startDate: string;
  endDate: string;
  reportType: string;
  selectedType: string;
}

interface PerdaServicoData {
  id: string;
  atendente_nome: string;
  numero_mesa: string;
  motivo: string;
  created_at: string;
  dia_operacional?: string;
}

interface ExportData {
  comps: CompData[];
  compTypes: CompType[];
  waiters: Waiter[];
  managers: Manager[];
  perdas?: PerdaServicoData[];
  filters: FilterParams;
  formatCurrency: (value: number) => string;
}

export function exportToExcel(data: ExportData) {
  const { comps, compTypes, waiters, managers, perdas, filters, formatCurrency } = data;
  
  // Criar workbook
  const workbook = XLSX.utils.book_new();
  
  // Filtrar dados baseado nos filtros
  const filteredComps = filterComps(comps, filters, compTypes);
  
  // 1. ABA RESUMO
  const resumoData = createResumoSheet(filteredComps, compTypes, filters, formatCurrency);
  const resumoSheet = XLSX.utils.json_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(workbook, resumoSheet, 'Resumo');
  
  // 2. ABA FUNCIONÁRIOS
  const funcionariosData = createFuncionariosSheet(filteredComps, waiters, formatCurrency);
  const funcionariosSheet = XLSX.utils.json_to_sheet(funcionariosData);
  XLSX.utils.book_append_sheet(workbook, funcionariosSheet, 'Funcionários');
  
  // 3. ABA GERENTES
  const gerentesData = createGerentesSheet(filteredComps, managers, formatCurrency);
  const gerentesSheet = XLSX.utils.json_to_sheet(gerentesData);
  XLSX.utils.book_append_sheet(workbook, gerentesSheet, 'Gerentes');
  
  // 4. ABA DETALHADO
  const detalhadoData = createDetalhadoSheet(filteredComps, compTypes, waiters, managers, formatCurrency);
  const detalhadoSheet = XLSX.utils.json_to_sheet(detalhadoData);
  XLSX.utils.book_append_sheet(workbook, detalhadoSheet, 'Detalhado');
  
  // 5. ABA POR TIPO
  const porTipoData = createPorTipoSheet(filteredComps, compTypes, formatCurrency);
  const porTipoSheet = XLSX.utils.json_to_sheet(porTipoData);
  XLSX.utils.book_append_sheet(workbook, porTipoSheet, 'Por Tipo');
  
  // 6. ABA PERDAS DE SERVIÇO (se houver dados)
  if (perdas && perdas.length > 0) {
    const perdasFiltradas = filterPerdas(perdas, filters);
    
    // 6.1. ABA RESUMO PERDAS
    const resumoPerdasData = createResumoPerdasSheet(perdasFiltradas, filters);
    const resumoPerdasSheet = XLSX.utils.json_to_sheet(resumoPerdasData);
    XLSX.utils.book_append_sheet(workbook, resumoPerdasSheet, 'Resumo Perdas');
    
    // 6.2. ABA PERDAS DETALHADO
    const perdasDetalhadoData = createPerdasDetalhadoSheet(perdasFiltradas);
    const perdasDetalhadoSheet = XLSX.utils.json_to_sheet(perdasDetalhadoData);
    XLSX.utils.book_append_sheet(workbook, perdasDetalhadoSheet, 'Perdas Detalhado');
    
    // 6.3. ABA PERDAS POR ATENDENTE
    const perdasPorAtendenteData = createPerdasPorAtendenteSheet(perdasFiltradas);
    const perdasPorAtendenteSheet = XLSX.utils.json_to_sheet(perdasPorAtendenteData);
    XLSX.utils.book_append_sheet(workbook, perdasPorAtendenteSheet, 'Perdas por Atendente');
  }
  
  // Gerar nome do arquivo
  const fileName = generateFileName(filters);
  
  // Salvar arquivo
  XLSX.writeFile(workbook, fileName);
}

function filterComps(comps: CompData[], filters: FilterParams, compTypes: CompType[]) {
  let filteredComps = comps;
  
  // Filtrar por data
  const dateRange = getDateRange(filters.startDate, filters.endDate, filters.reportType);
  filteredComps = filteredComps.filter(comp => 
    dateRange.includes(comp.diaOperacional)
  );
  
  // Filtrar por tipo de COMP
  if (filters.selectedType !== 'all') {
    filteredComps = filteredComps.filter(comp => 
      comp.compTypeId === filters.selectedType
    );
  }
  
  return filteredComps;
}

function getDateRange(startDate: string, endDate: string, reportType: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];

  if (reportType === 'diario') {
    dates.push(startDate);
  } else {
    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  
  return dates;
}

function createResumoSheet(comps: CompData[], compTypes: CompType[], filters: FilterParams, formatCurrency: (value: number) => string) {
  const totalValue = comps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
  const totalQuantity = comps.length;
  const averageValue = totalQuantity > 0 ? totalValue / totalQuantity : 0;
  
  const resumoData = [
    { 'Métrica': 'Período', 'Valor': `${filters.startDate} a ${filters.endDate}` },
    { 'Métrica': 'Tipo de Relatório', 'Valor': getReportTypeLabel(filters.reportType) },
    { 'Métrica': 'Tipo de COMP', 'Valor': filters.selectedType === 'all' ? 'Todos' : compTypes.find(t => t.id === filters.selectedType)?.codigo || 'N/A' },
    { 'Métrica': '', 'Valor': '' },
    { 'Métrica': 'Total do Período', 'Valor': formatCurrency(totalValue) },
    { 'Métrica': 'Quantidade Total', 'Valor': totalQuantity },
    { 'Métrica': 'Média por COMP', 'Valor': formatCurrency(averageValue) },
    { 'Métrica': '', 'Valor': '' },
    { 'Métrica': 'Data de Geração', 'Valor': format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) }
  ];
  
  return resumoData;
}

function createFuncionariosSheet(comps: CompData[], waiters: Waiter[], formatCurrency: (value: number) => string) {
  const waiterStats = waiters.map(waiter => {
    const waiterComps = comps.filter(comp => comp.waiterId === waiter.id);
    const totalValue = waiterComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
    const totalCount = waiterComps.length;
    
    return {
      'Funcionário': waiter.nome,
      'Matrícula': waiter.matricula,
      'Total de COMPs': totalCount,
      'Valor Total': formatCurrency(totalValue),
      'Valor Médio': totalCount > 0 ? formatCurrency(totalValue / totalCount) : 'R$ 0,00'
    };
  }).filter(waiter => waiter['Total de COMPs'] > 0)
    .sort((a, b) => b['Total de COMPs'] - a['Total de COMPs']);
  
  return waiterStats;
}

function createGerentesSheet(comps: CompData[], managers: Manager[], formatCurrency: (value: number) => string) {
  const managerStats = managers.map(manager => {
    const managerComps = comps.filter(comp => comp.gerenteId === manager.id);
    const totalValue = managerComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
    const totalCount = managerComps.length;
    
    return {
      'Gerente': manager.nome,
      'Email': manager.email,
      'Total de COMPs': totalCount,
      'Valor Total': formatCurrency(totalValue),
      'Valor Médio': totalCount > 0 ? formatCurrency(totalValue / totalCount) : 'R$ 0,00'
    };
  }).filter(manager => manager['Total de COMPs'] > 0)
    .sort((a, b) => b['Total de COMPs'] - a['Total de COMPs']);
  
  return managerStats;
}

function createDetalhadoSheet(comps: CompData[], compTypes: CompType[], waiters: Waiter[], managers: Manager[], formatCurrency: (value: number) => string) {
  const detalhadoData = comps.map(comp => {
    const compType = compTypes.find(t => t.id === comp.compTypeId);
    const waiter = waiters.find(w => w.id === comp.waiterId);
    const manager = managers.find(m => m.id === comp.gerenteId);
    
    return {
      'Data': format(new Date(comp.diaOperacional), 'dd/MM/yyyy', { locale: ptBR }),
      'Tipo de COMP': compType?.codigo || 'N/A',
      'Funcionário': waiter?.nome || 'N/A',
      'Matrícula': waiter?.matricula || 'N/A',
      'Gerente': manager?.nome || 'N/A',
      'Valor': formatCurrency(comp.valorCentavos),
      'Motivo': comp.motivo || '',
      'Turno': comp.turno === 'manha' ? 'Manhã' : 'Noite',
      'Data/Hora Local': format(new Date(comp.dataHoraLocal), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    };
  }).sort((a, b) => new Date(b['Data']).getTime() - new Date(a['Data']).getTime());
  
  return detalhadoData;
}

function createPorTipoSheet(comps: CompData[], compTypes: CompType[], formatCurrency: (value: number) => string) {
  const tipoStats = compTypes.map(compType => {
    const tipoComps = comps.filter(comp => comp.compTypeId === compType.id);
    const totalValue = tipoComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
    const totalCount = tipoComps.length;
    
    return {
      'Tipo': compType.codigo,
      'Nome': compType.nome,
      'Quantidade': totalCount,
      'Valor Total': formatCurrency(totalValue),
      'Valor Médio': totalCount > 0 ? formatCurrency(totalValue / totalCount) : 'R$ 0,00',
      'Percentual': comps.length > 0 ? `${((totalCount / comps.length) * 100).toFixed(2)}%` : '0%'
    };
  }).filter(tipo => tipo.Quantidade > 0)
    .sort((a, b) => b.Quantidade - a.Quantidade);
  
  return tipoStats;
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

function filterPerdas(perdas: PerdaServicoData[], filters: FilterParams) {
  // Filtrar por data
  const dateRange = getDateRange(filters.startDate, filters.endDate, filters.reportType);
  return perdas.filter(perda => {
    const perdaDiaOperacional = calculateOperationalDay(perda.created_at);
    return dateRange.includes(perdaDiaOperacional);
  });
}

function calculateOperationalDay(createdAt: string): string {
  const date = new Date(createdAt);
  
  // Se foi criado antes das 5h, pertence ao dia operacional anterior
  if (date.getHours() < 5) {
    const previousDay = new Date(date);
    previousDay.setDate(previousDay.getDate() - 1);
    return previousDay.toISOString().split('T')[0];
  }
  
  return date.toISOString().split('T')[0];
}

function createResumoPerdasSheet(perdas: PerdaServicoData[], filters: FilterParams) {
  const totalPerdas = perdas.length;
  const atendentesUnicos = new Set(perdas.map(p => p.atendente_nome)).size;
  const mesasUnicas = new Set(perdas.map(p => p.numero_mesa)).size;
  
  // Agrupar por motivo
  const motivosCount = perdas.reduce((acc, perda) => {
    acc[perda.motivo] = (acc[perda.motivo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const motivoMaisComum = Object.entries(motivosCount)
    .sort(([,a], [,b]) => b - a)[0];
  
  const resumoData = [
    { 'Métrica': 'Período', 'Valor': `${filters.startDate} a ${filters.endDate}` },
    { 'Métrica': 'Tipo de Relatório', 'Valor': getReportTypeLabel(filters.reportType) },
    { 'Métrica': '', 'Valor': '' },
    { 'Métrica': 'Total de Perdas', 'Valor': totalPerdas },
    { 'Métrica': 'Atendentes Afetados', 'Valor': atendentesUnicos },
    { 'Métrica': 'Mesas Afetadas', 'Valor': mesasUnicas },
    { 'Métrica': 'Motivo Mais Comum', 'Valor': motivoMaisComum ? `${motivoMaisComum[0]} (${motivoMaisComum[1]} ocorrências)` : 'N/A' },
    { 'Métrica': '', 'Valor': '' },
    { 'Métrica': 'Data de Geração', 'Valor': format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR }) }
  ];
  
  return resumoData;
}

function createPerdasDetalhadoSheet(perdas: PerdaServicoData[]) {
  const detalhadoData = perdas.map(perda => {
    const dataOperacional = calculateOperationalDay(perda.created_at);
    
    return {
      'Data Operacional': format(new Date(dataOperacional), 'dd/MM/yyyy', { locale: ptBR }),
      'Atendente': perda.atendente_nome,
      'Número da Mesa': perda.numero_mesa,
      'Motivo': perda.motivo,
      'Data/Hora Registro': format(new Date(perda.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    };
  }).sort((a, b) => new Date(b['Data Operacional']).getTime() - new Date(a['Data Operacional']).getTime());
  
  return detalhadoData;
}

function createPerdasPorAtendenteSheet(perdas: PerdaServicoData[]) {
  const atendenteStats = perdas.reduce((acc, perda) => {
    if (!acc[perda.atendente_nome]) {
      acc[perda.atendente_nome] = {
        atendente: perda.atendente_nome,
        totalPerdas: 0,
        mesasAfetadas: new Set(),
        motivos: {} as Record<string, number>
      };
    }
    
    acc[perda.atendente_nome].totalPerdas++;
    acc[perda.atendente_nome].mesasAfetadas.add(perda.numero_mesa);
    acc[perda.atendente_nome].motivos[perda.motivo] = (acc[perda.atendente_nome].motivos[perda.motivo] || 0) + 1;
    
    return acc;
  }, {} as Record<string, any>);
  
  const statsData = Object.values(atendenteStats).map((stats: any) => {
    const motivoMaisComum = Object.entries(stats.motivos)
      .sort(([,a], [,b]) => b - a)[0];
    
    return {
      'Atendente': stats.atendente,
      'Total de Perdas': stats.totalPerdas,
      'Mesas Afetadas': stats.mesasAfetadas.size,
      'Motivo Mais Comum': motivoMaisComum ? `${motivoMaisComum[0]} (${motivoMaisComum[1]})` : 'N/A'
    };
  }).sort((a, b) => b['Total de Perdas'] - a['Total de Perdas']);
  
  return statsData;
}

function generateFileName(filters: FilterParams): string {
  const date = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ptBR });
  const reportType = getReportTypeLabel(filters.reportType).toLowerCase();
  return `relatorio_comps_${reportType}_${date}.xlsx`;
}

// Nova função para gerar planilha no formato da imagem
export function exportToExcelFormatoImagem(data: ExportData) {
  const { comps, compTypes, waiters, managers, filters, formatCurrency } = data;
  
  // Filtrar dados baseado nos filtros
  const filteredComps = filterComps(comps, filters, compTypes);
  
  // Calcular totais
  const totalValue = filteredComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
  
  // Agrupar por tipo de COMP para calcular percentuais
  const compsByType = compTypes.map(compType => {
    const tipoComps = filteredComps.filter(comp => comp.compTypeId === compType.id);
    const typeValue = tipoComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
    return {
      codigo: compType.codigo,
      totalValue: typeValue,
      percentage: totalValue > 0 ? (typeValue / totalValue) * 100 : 0
    };
  });
  
  // Agrupar por garçom
  const compsByWaiter = waiters.map(waiter => {
    const waiterComps = filteredComps.filter(comp => comp.waiterId === waiter.id);
    const waiterTotal = waiterComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
    
    // Agrupar por tipo de COMP para este garçom
    const compsByTypeForWaiter = compTypes.map(compType => {
      const tipoComps = waiterComps.filter(comp => comp.compTypeId === compType.id);
      const tipoValue = tipoComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
      const motivos = tipoComps.map(comp => comp.motivo || '').filter(m => m).join(' / ');
      return {
        codigo: compType.codigo,
        value: tipoValue,
        justificativa: motivos
      };
    });
    
    return {
      waiter,
      totalValue: waiterTotal,
      compsByType: compsByTypeForWaiter
    };
  }).filter(item => item.totalValue > 0);
  
  // Criar dados da planilha no formato exato da imagem
  const planilhaData = [];
  
  // Linha 1: Cabeçalho com data
  const dataFormatada = format(new Date(filters.startDate), 'M/d/yyyy', { locale: ptBR });
  planilhaData.push([
    'DATA', dataFormatada, '', 'GERENTE DIURNO', 'ADM'
  ]);
  
  // Linha 2: Total dos COMPs
  planilhaData.push([
    'COMP\'S TOTAL', formatCurrency(totalValue), '', 'GERENTE NOTURNO', 'ADM'
  ]);
  
  // Linha 3: Título das porcentagens
  planilhaData.push([
    'PORCENTAGEM DE CADA COMPS EM RELAÇÃO AO TOTAL DE COMPS'
  ]);
  
  // Linhas 4 e 5: Vazias
  planilhaData.push(['']);
  planilhaData.push(['']);
  
  // Linha 6: Percentuais por tipo (assumindo ordem: 2, 4, 8, 11, 12, 13)
  const tipos = ['2', '4', '8', '11', '12', '13'];
  const percentuais = tipos.map(codigo => {
    const comp = compsByType.find(c => c.codigo === codigo);
    return comp ? `${comp.percentage.toFixed(2)}%` : '0%';
  });
  
  planilhaData.push([
    '', '', percentuais[0], percentuais[1], percentuais[2], 
    percentuais[3], percentuais[4], percentuais[5]
  ]);
  
  // Linha 7: Cabeçalho da tabela
  planilhaData.push([
    'WAITER', 'TOTAL', 'COMPS 2', 'COMP\'S 4', 'COMPS 8', 'COMP\'S 11', 'COMP\'S 12', 'COMP\'S 13', 'JUSTIFICATIVAS'
  ]);
  
  // Linhas dos garçons
  compsByWaiter.forEach(item => {
    const { waiter, totalValue, compsByType } = item;
    
    // Encontrar valores por tipo
    const valores = tipos.map(codigo => {
      const comp = compsByType.find(c => c.codigo === codigo);
      return comp && comp.value > 0 ? formatCurrency(comp.value) : '';
    });
    
    // Pegar todas as justificativas não vazias
    const justificativas = compsByType
      .filter(c => c.justificativa)
      .map(c => c.justificativa)
      .join(' / ');
    
    planilhaData.push([
      waiter.nome,
      formatCurrency(totalValue),
      valores[0], // COMPS 2
      valores[1], // COMP'S 4
      valores[2], // COMPS 8
      valores[3], // COMP'S 11
      valores[4], // COMP'S 12
      valores[5], // COMP'S 13
      justificativas
    ]);
  });
  
  // Criar workbook
  const workbook = XLSX.utils.book_new();
  
  // Converter dados para worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(planilhaData);
  
  // Definir larguras das colunas
  worksheet['!cols'] = [
    { wch: 15 }, // WAITER
    { wch: 12 }, // TOTAL
    { wch: 12 }, // COMPS 2
    { wch: 12 }, // COMP'S 4
    { wch: 12 }, // COMPS 8
    { wch: 12 }, // COMP'S 11
    { wch: 12 }, // COMP'S 12
    { wch: 12 }, // COMP'S 13
    { wch: 80 }  // JUSTIFICATIVAS
  ];
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório COMPS');
  
  // Gerar nome do arquivo
  const fileName = `relatorio_comps_${dataFormatada.replace(/\//g, '-')}.xlsx`;
  
  // Salvar arquivo
  XLSX.writeFile(workbook, fileName);
}