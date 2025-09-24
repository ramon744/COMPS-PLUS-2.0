// src/services/sheetsIntegration.ts
// Integração real com Google Apps Script

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwZMzPRK19A07IiESRd_qe_yt0QFLsXql9dZ5PhlO3qsCLf0O5NIKNqRCnNb_pazCAbhQ/exec';

// Implementação real para integração com Google Apps Script
const sheets = {
  updateHeader: async (data: any) => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'updateHeader',
          dados: JSON.stringify(data)
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { updated: true, data: result };
      } else {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar cabeçalho:', error);
      throw error;
    }
  },

  updateByRow: async (row: number, data: any) => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'updateByRow',
          dados: JSON.stringify({ row, data })
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, row, data: result };
      } else {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar linha:', error);
      throw error;
    }
  },

  limparTudo: async () => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=limparTudo'
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, message: result.message || 'Limpeza executada' };
      } else {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao limpar planilha:', error);
      throw error;
    }
  },

  gerarPDF: async () => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'action=gerarPDF'
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, pdfUrl: result.pdfUrl || 'http://example.com/pdf.pdf' };
      } else {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      throw error;
    }
  },

  enviarEmail: async (data: any) => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'enviarEmailViaSupabase',
          dados: JSON.stringify(data)
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, destinatarios: result.destinatarios || 'test@example.com' };
      } else {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      throw error;
    }
  },

  criarNotificacao: async (data: any) => {
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'criarNotificacao',
          dados: JSON.stringify(data)
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, message: result.message || 'Notificação criada' };
      } else {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      throw error;
    }
  }
};

export interface FechamentoData {
  dataOperacional: string;
  gerenteDiurno: string;
  gerenteNoturno: string;
  totalComps: number;
  waiters: WaiterData[];
  porcentagens: PorcentagensComps;
  gerenteId?: string; // ID do gerente para buscar template personalizado
}

export interface WaiterData {
  nome: string;
  total: number;
  comps2?: number;
  comps4?: number;
  comps8?: number;
  comps11?: number;
  comps12?: number;
  comps13?: number;
  justificativas: string;
}

export interface PorcentagensComps {
  comps2: string;
  comps4: string;
  comps8: string;
  comps11: string;
  comps12: string;
  comps13: string;
}

export class SheetsIntegrationService {
  private sheets = sheets;

  // Função principal para processar fechamento - ENVIANDO TUDO DE UMA VEZ
  async processarFechamento(fechamentoData: FechamentoData, onProgress?: (progress: number) => void): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('🚀 INICIANDO FECHAMENTO INTEGRADO COM PLANILHA...');
      console.log('📋 Dados recebidos:', fechamentoData);

      // ENVIAR TUDO DE UMA VEZ PARA O GOOGLE APPS SCRIPT
      console.log('📤 Enviando todos os dados de uma vez...');
      
      const resultado = await this.enviarTudoDeUmaVez(fechamentoData, onProgress);
      
      if (resultado.success) {
        console.log('✅ FECHAMENTO COMPLETO COM SUCESSO!');
        return {
          success: true,
          message: 'Fechamento processado com sucesso! Dados enviados diretamente para a planilha.'
        };
      } else {
        throw new Error(resultado.message);
      }

    } catch (error: any) {
      console.error('❌ ERRO NO FECHAMENTO:', error);
      return {
        success: false,
        message: `Erro ao processar fechamento: ${error.message}`
      };
    }
  }

  // NOVA FUNÇÃO: ENVIAR TUDO DE UMA VEZ USANDO enviarFechamentoCompleto
  private async enviarTudoDeUmaVez(fechamentoData: FechamentoData, onProgress?: (progress: number) => void): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    try {
      console.log('📤 ENVIANDO FECHAMENTO COMPLETO PARA GOOGLE APPS SCRIPT...');
      
      if (onProgress) onProgress(10);

      // Chamar a função enviarFechamentoCompleto do Google Apps Script
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'enviarFechamentoCompleto',
          dados: JSON.stringify(fechamentoData)
        })
      });

      if (onProgress) onProgress(50);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (onProgress) onProgress(90);

      if (result.success) {
        console.log('✅ FECHAMENTO COMPLETO REALIZADO COM SUCESSO!');
        console.log('📊 Resultado:', result);
        
        if (onProgress) onProgress(100);

        return {
          success: true,
          message: 'Fechamento processado com sucesso! Dados enviados diretamente para a planilha.',
          data: result
        };
      } else {
        throw new Error(result.error || 'Erro desconhecido no Google Apps Script');
      }

    } catch (error: any) {
      console.error('❌ ERRO AO ENVIAR FECHAMENTO COMPLETO:', error);
      return {
        success: false,
        message: `Erro ao enviar dados: ${error.message}`
      };
    }
  }

  private async enviarCabecalho(fechamentoData: FechamentoData): Promise<void> {
    try {
      console.log('📋 Preparando dados do cabeçalho...');
      
      const headerData = {
        dataOperacional: fechamentoData.dataOperacional,
        gerenteDiurno: fechamentoData.gerenteDiurno,
        gerenteNoturno: fechamentoData.gerenteNoturno,
        totalComps: fechamentoData.totalComps,
        porcentagens: fechamentoData.porcentagens
      };

      console.log('📊 Dados do cabeçalho:', headerData);

      // Enviar cabeçalho em uma única chamada
      console.log('📤 Enviando dados para updateHeader...');
      const resultado = await this.sheets.updateHeader(headerData);
      console.log('📥 Resposta recebida do updateHeader:', resultado);
      
      if (!resultado || !resultado.updated) {
        console.error('❌ Resposta inválida do updateHeader:', resultado);
        throw new Error(`Erro ao atualizar cabeçalho: ${JSON.stringify(resultado)}`);
      }

      console.log('✅ Cabeçalho atualizado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao enviar cabeçalho:', error);
      throw error;
    }
  }

  private async enviarWaiters(waiters: WaiterData[], onProgress?: (progress: number) => void): Promise<void> {
    try {
      console.log(`🚀 ENVIANDO WAITERS: ${waiters.length} waiters encontrados`);

      if (waiters.length === 0) {
        console.log('⚠️ Nenhum waiter para enviar');
        return;
      }

      // Enviar waiters com progresso (SEM LIMPEZA PRÉVIA)
      console.log(`📝 Enviando ${waiters.length} waiters...`);
      for (let i = 0; i < waiters.length; i++) {
        const waiter = waiters[i];
        const linha = 8 + i;

        console.log(`   ⏳ Enviando ${waiter.nome} na linha ${linha}...`);
        console.log(`   📊 Dados do waiter:`, {
          nome: waiter.nome,
          total: waiter.total,
          comps2: waiter.comps2,
          comps4: waiter.comps4,
          comps8: waiter.comps8,
          comps11: waiter.comps11,
          comps12: waiter.comps12,
          comps13: waiter.comps13,
          justificativas: waiter.justificativas
        });

        try {
          // Enviar todos os dados de uma vez usando updateByRow
          const rowData = {
            'WAITER': waiter.nome,
            'TOTAL': waiter.total,
            'COMPS 2': waiter.comps2 || '',
            "COMP'S 4": waiter.comps4 || '',
            'COMPS 8': waiter.comps8 || '',
            "COMP'S 11": waiter.comps11 || '',
            "COMP'S 12": waiter.comps12 || '',
            "COMP'S 13": waiter.comps13 || '',
            'JUSTIFICATIVAS': waiter.justificativas
          };

          console.log(`   ⏳ Enviando dados completos do waiter ${waiter.nome} na linha ${linha}...`);
          await this.sheets.updateByRow(linha, rowData);
          console.log(`   ✅ Waiter ${waiter.nome} enviado com sucesso na linha ${linha}`);
          
          // Atualizar progresso
          const progress = Math.round(((i + 1) / waiters.length) * 75) + 25; // 25% a 100%
          if (onProgress) {
            onProgress(progress);
          }
          
          // Delay mínimo entre waiters (apenas 1 segundo para não sobrecarregar)
          if (i < waiters.length - 1) {
            console.log(`   ⏰ Aguardando 1 segundo antes do próximo waiter...`);
            await this.delay(1000);
          }
        } catch (cellError) {
          console.error(`   ❌ Erro ao enviar waiter ${waiter.nome} na linha ${linha}:`, cellError);
          throw cellError;
        }
      }

      console.log('✅ Dados dos waiters enviados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao enviar waiters:', error);
      throw error;
    }
  }

  private agendarLimpezaAutomatica(): void {
    try {
      console.log('⏰ Agendando limpeza automática...');
      
      // Usar setTimeout para agendar limpeza após 10 minutos
      setTimeout(async () => {
        try {
          console.log('🧹 EXECUTANDO LIMPEZA AUTOMÁTICA...');
          const resultado = await this.sheets.limparTudo();
          
          if (resultado.success) {
            console.log('✅ Limpeza automática executada com sucesso!');
          } else {
            console.error('❌ Erro na limpeza automática:', resultado.message);
          }
        } catch (error) {
          console.error('❌ Erro ao executar limpeza automática:', error);
        }
      }, 10 * 60 * 1000); // 10 minutos em millisegundos

      console.log('✅ Limpeza automática agendada para 10 minutos');
    } catch (error) {
      console.error('❌ Erro ao agendar limpeza automática:', error);
    }
  }

  // Calcular porcentagens
  calcularPorcentagens(waiters: WaiterData[]): PorcentagensComps {
    console.log('🔢 CALCULANDO PORCENTAGENS - Waiters recebidos:', waiters);
    
    const totais = {
      comps2: 0,
      comps4: 0,
      comps8: 0,
      comps11: 0,
      comps12: 0,
      comps13: 0
    };

    waiters.forEach(waiter => {
      console.log(`👤 Waiter ${waiter.nome}:`, {
        total: waiter.total,
        comps2: waiter.comps2,
        comps4: waiter.comps4,
        comps8: waiter.comps8,
        comps11: waiter.comps11,
        comps12: waiter.comps12,
        comps13: waiter.comps13
      });
      
      totais.comps2 += waiter.comps2 || 0;
      totais.comps4 += waiter.comps4 || 0;
      totais.comps8 += waiter.comps8 || 0;
      totais.comps11 += waiter.comps11 || 0;
      totais.comps12 += waiter.comps12 || 0;
      totais.comps13 += waiter.comps13 || 0;
    });

    const totalGeral = waiters.reduce((sum, waiter) => sum + waiter.total, 0);
    
    console.log('📊 Totais calculados:', totais);
    console.log('💰 Total geral:', totalGeral);

    const calcularPorcentagem = (valor: number) => {
      if (totalGeral <= 0) return 0;
      const porcentagem = (valor / totalGeral) * 100;
      console.log(`📈 Valor ${valor} / Total ${totalGeral} = ${porcentagem.toFixed(2)}%`);
      return Number(porcentagem.toFixed(2));
    };

    const porcentagens = {
      comps2: calcularPorcentagem(totais.comps2) + '%',
      comps4: calcularPorcentagem(totais.comps4) + '%',
      comps8: calcularPorcentagem(totais.comps8) + '%',
      comps11: calcularPorcentagem(totais.comps11) + '%',
      comps12: calcularPorcentagem(totais.comps12) + '%',
      comps13: calcularPorcentagem(totais.comps13) + '%'
    };
    
    console.log('✅ Porcentagens finais:', porcentagens);
    return porcentagens;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Agendar geração de PDF após 5 minutos
  private agendarGeracaoPDF(): void {
    console.log('📄 Agendando geração de PDF em 5 minutos...');
    
    setTimeout(async () => {
      try {
        console.log('📄 Executando geração de PDF...');
        const resultado = await this.sheets.gerarPDF();
        
        if (resultado.success && resultado.pdfUrl) {
          console.log('✅ PDF gerado com sucesso:', resultado.pdfUrl);
          
          // Enviar notificação para o sistema
          this.enviarNotificacaoPDF({
            pdfUrl: resultado.pdfUrl,
            dataOperacional: resultado.dataOperacional,
            totalComps: resultado.totalComps,
            message: resultado.message || 'PDF do fechamento gerado com sucesso!'
          });
          
        } else {
          console.error('❌ Erro na geração do PDF:', resultado.message);
        }
        
      } catch (error) {
        console.error('❌ Erro ao gerar PDF agendado:', error);
      }
    }, 5 * 60 * 1000); // 5 minutos
  }

  // Agendar envio de email após 6 minutos
  private agendarEnvioEmail(fechamentoData: FechamentoData): void {
    console.log('📧 Agendando envio de email em 6 minutos...');
    
    setTimeout(async () => {
      try {
        console.log('📧 Executando envio de email...');
        
        // Primeiro gerar PDF se ainda não foi gerado
        const pdfResult = await this.sheets.gerarPDF();
        if (!pdfResult.success || !pdfResult.pdfUrl) {
          console.error('❌ Não foi possível gerar PDF para email');
          return;
        }
        
        // Enviar email
        const emailData = {
          gerenteId: fechamentoData.gerenteId || 'sistema',
          dataOperacional: fechamentoData.dataOperacional,
          gerenteDiurno: fechamentoData.gerenteDiurno,
          gerenteNoturno: fechamentoData.gerenteNoturno,
          totalComps: fechamentoData.totalComps,
          pdfUrl: pdfResult.pdfUrl
        };
        
        const resultado = await this.sheets.enviarEmail(emailData);
        
        if (resultado.success) {
          console.log('✅ Email enviado com sucesso para', resultado.destinatarios, 'destinatários');
        } else {
          console.error('❌ Erro no envio do email:', resultado.message);
        }
        
      } catch (error) {
        console.error('❌ Erro ao enviar email agendado:', error);
      }
    }, 6 * 60 * 1000); // 6 minutos
  }

  // Enviar notificação do PDF para o sistema
  private enviarNotificacaoPDF(dadosPDF: {
    pdfUrl: string;
    dataOperacional?: string;
    totalComps?: number;
    message: string;
  }): void {
    try {
      console.log('🔔 Enviando notificação do PDF...');
      
      // Criar evento customizado para notificação
      const notificacao = {
        id: `pdf-${Date.now()}`,
        tipo: 'pdf-fechamento',
        titulo: 'PDF do Fechamento Disponível',
        mensagem: `${dadosPDF.message}\nData: ${dadosPDF.dataOperacional || 'N/A'}\nTotal: R$ ${dadosPDF.totalComps || 0}`,
        pdfUrl: dadosPDF.pdfUrl,
        timestamp: new Date().toISOString(),
        acao: 'ver-pdf'
      };
      
      // Disparar evento customizado
      window.dispatchEvent(new CustomEvent('nova-notificacao-pdf', { 
        detail: notificacao 
      }));
      
      console.log('✅ Notificação do PDF enviada:', notificacao);
      
    } catch (error) {
      console.error('❌ Erro ao enviar notificação do PDF:', error);
    }
  }
}

// Instância global
export const sheetsIntegrationService = new SheetsIntegrationService();
