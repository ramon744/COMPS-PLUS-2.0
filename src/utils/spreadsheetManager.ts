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

interface SpreadsheetData {
  comps: CompData[];
  compTypes: CompType[];
  waiters: Waiter[];
  managers: Manager[];
  currentDate: string;
  gerenteDiurno: string;
  gerenteNoturno: string;
}

class SpreadsheetManager {
  private data: SpreadsheetData;
  private fileName: string;
  private filePath: string;

  constructor(data: SpreadsheetData) {
    this.data = data;
    this.fileName = `relatorio_comps_${format(new Date(data.currentDate), 'M-d-yyyy')}.xlsx`;
    this.filePath = `./public/spreadsheets/${this.fileName}`;
  }

  // Atualizar planilha quando um COMP é criado
  updateSpreadsheet(newComp: CompData) {
    // Adicionar novo COMP aos dados
    this.data.comps.push(newComp);
    
    // Regenerar planilha
    this.generateSpreadsheet();
    
    // Salvar arquivo
    this.saveSpreadsheet();
  }

  // Gerar planilha no formato exato da imagem
  private generateSpreadsheet() {
    const { comps, compTypes, waiters, managers, currentDate, gerenteDiurno, gerenteNoturno } = this.data;
    
    // Calcular totais
    const totalValue = comps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
    
    // Agrupar por tipo de COMP para calcular percentuais
    const compsByType = compTypes.map(compType => {
      const tipoComps = comps.filter(comp => comp.compTypeId === compType.id);
      const typeValue = tipoComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
      return {
        codigo: compType.codigo,
        totalValue: typeValue,
        percentage: totalValue > 0 ? (typeValue / totalValue) * 100 : 0
      };
    });
    
    // Agrupar por garçom
    const compsByWaiter = waiters.map(waiter => {
      const waiterComps = comps.filter(comp => comp.waiterId === waiter.id);
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
    const dataFormatada = format(new Date(currentDate), 'M/d/yyyy', { locale: ptBR });
    planilhaData.push([
      'DATA', dataFormatada, '', 'GERENTE DIURNO', gerenteDiurno
    ]);
    
    // Linha 2: Total dos COMPs
    planilhaData.push([
      'COMP\'S TOTAL', this.formatCurrency(totalValue), '', 'GERENTE NOTURNO', gerenteNoturno
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
        return comp && comp.value > 0 ? this.formatCurrency(comp.value) : '';
      });
      
      // Pegar todas as justificativas não vazias
      const justificativas = compsByType
        .filter(c => c.justificativa)
        .map(c => c.justificativa)
        .join(' / ');
      
      planilhaData.push([
        waiter.nome,
        this.formatCurrency(totalValue),
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
    
    // Aplicar formatação e cores
    this.applyFormatting(worksheet, planilhaData.length);
    
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
    
    return workbook;
  }

  // Aplicar formatação e cores da imagem original
  private applyFormatting(worksheet: XLSX.WorkSheet, totalRows: number) {
    // Definir estilos para diferentes seções
    const styles = {
      header: {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" }
      },
      title: {
        font: { bold: true, size: 14 },
        fill: { fgColor: { rgb: "D9E1F2" } },
        alignment: { horizontal: "center" }
      },
      data: {
        font: { size: 11 },
        alignment: { vertical: "center" }
      },
      total: {
        font: { bold: true, size: 12 },
        fill: { fgColor: { rgb: "E2EFDA" } }
      }
    };

    // Aplicar estilos às células
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < 9; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        
        if (!worksheet[cellRef]) continue;
        
        // Cabeçalho (linha 7)
        if (row === 6) {
          worksheet[cellRef].s = styles.header;
        }
        // Título das porcentagens (linha 3)
        else if (row === 2) {
          worksheet[cellRef].s = styles.title;
        }
        // Linha de totais (linha 2)
        else if (row === 1) {
          worksheet[cellRef].s = styles.total;
        }
        // Dados dos garçons
        else if (row > 6) {
          worksheet[cellRef].s = styles.data;
        }
      }
    }
  }

  // Salvar planilha - DESABILITADO PARA EVITAR DOWNLOADS AUTOMÁTICOS
  private saveSpreadsheet() {
    // COMENTADO: Não salvar automaticamente para evitar downloads desnecessários
    // const workbook = this.generateSpreadsheet();
    
    // COMENTADO: Salvar no diretório público para acesso via web
    // XLSX.writeFile(workbook, this.filePath);
    
    // COMENTADO: Também salvar no diretório de downloads
    // const downloadPath = `./downloads/${this.fileName}`;
    // XLSX.writeFile(workbook, downloadPath);
    
    console.log('📊 Planilha atualizada em memória (download automático desabilitado)');
  }

  // Formatar moeda
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  }

  // Obter URL da planilha
  getSpreadsheetUrl(): string {
    return `/spreadsheets/${this.fileName}`;
  }

  // Obter dados atuais
  getCurrentData(): SpreadsheetData {
    return this.data;
  }

  // Atualizar gerentes
  updateManagers(gerenteDiurno: string, gerenteNoturno: string) {
    this.data.gerenteDiurno = gerenteDiurno;
    this.data.gerenteNoturno = gerenteNoturno;
    // COMENTADO: Não gerar planilha automaticamente
    // this.generateSpreadsheet();
    // this.saveSpreadsheet();
    console.log('👥 Gerentes atualizados em memória:', { gerenteDiurno, gerenteNoturno });
  }

  // Função para download manual da planilha
  downloadSpreadsheet() {
    const workbook = this.generateSpreadsheet();
    XLSX.writeFile(workbook, this.fileName);
    console.log('📥 Download manual da planilha:', this.fileName);
  }
}

export default SpreadsheetManager;
export type { SpreadsheetData, CompData, CompType, Waiter, Manager };

