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

interface ExportData {
  comps: CompData[];
  compTypes: CompType[];
  waiters: Waiter[];
  managers: Manager[];
  filters: FilterParams;
  formatCurrency: (value: number) => string;
}

export function exportToExcel(data: ExportData) {
  const { comps, compTypes, waiters, managers, filters, formatCurrency } = data;
  
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

function generateFileName(filters: FilterParams): string {
  const date = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ptBR });
  const reportType = getReportTypeLabel(filters.reportType).toLowerCase();
  return `relatorio_comps_${reportType}_${date}.xlsx`;
}
