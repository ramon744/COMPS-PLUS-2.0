// Google Apps Script Ultra Simples - GARANTIDO PARA FUNCIONAR
// Substitua TODO o código no Google Apps Script por este

// Função principal OBRIGATÓRIA
function doPost(e) {
  try {
    var data = e.parameter;
    var action = data.action;
    
    console.log('Ação:', action);
    
    if (action === 'testeConexao') {
      return testeConexao();
    }
    
    if (action === 'enviarFechamentoCompleto') {
      return enviarFechamentoCompleto(data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Ação não reconhecida: ' + action
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Erro:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Teste de conexão
function testeConexao() {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Google Apps Script funcionando',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

// Enviar fechamento completo - ULTRA SIMPLES
function enviarFechamentoCompleto(data) {
  try {
    console.log('Iniciando fechamento completo...');
    console.log('Data recebida:', data);
    
    // Parse dos dados - ULTRA SIMPLES
    var dados;
    if (typeof data.dados === 'string') {
      dados = JSON.parse(data.dados);
    } else {
      dados = data.dados || data;
    }
    
    console.log('Dados parseados:', dados);
    
    // Verificar se os dados existem
    if (!dados) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Dados não fornecidos'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 1. Atualizar cabeçalho
    var sheet = SpreadsheetApp.getActiveSheet();
    
    // Data
    if (dados.dataOperacional) {
      sheet.getRange('B1').setValue(dados.dataOperacional);
    }
    
    // Gerentes
    if (dados.gerenteDia) {
      sheet.getRange('E1').setValue(dados.gerenteDia);
    }
    if (dados.gerenteNoite) {
      sheet.getRange('E2').setValue(dados.gerenteNoite);
    }
    
    // Total
    if (dados.totalComps) {
      sheet.getRange('B2').setValue(dados.totalComps);
    }
    
    // Porcentagens
    if (dados.porcentagens) {
      if (dados.porcentagens.comps2) {
        sheet.getRange('C6').setValue(dados.porcentagens.comps2);
      }
      if (dados.porcentagens.comps4) {
        sheet.getRange('D6').setValue(dados.porcentagens.comps4);
      }
      if (dados.porcentagens.comps8) {
        sheet.getRange('E6').setValue(dados.porcentagens.comps8);
      }
      if (dados.porcentagens.comps11) {
        sheet.getRange('F6').setValue(dados.porcentagens.comps11);
      }
      if (dados.porcentagens.comps12) {
        sheet.getRange('G6').setValue(dados.porcentagens.comps12);
      }
      if (dados.porcentagens.comps13) {
        sheet.getRange('H6').setValue(dados.porcentagens.comps13);
      }
    }
    
    // 2. Adicionar garçons
    if (dados.waiters && dados.waiters.length > 0) {
      sheet.getRange('A8:I100').clearContent();
      
      var row = 8;
      for (var i = 0; i < dados.waiters.length; i++) {
        var waiter = dados.waiters[i];
        
        sheet.getRange(row, 1).setValue(waiter.nome || '');
        sheet.getRange(row, 2).setValue(waiter.total || 0);
        
        // Só inserir valores se não forem zero
        if (waiter.comps2 && waiter.comps2 !== 0) {
          sheet.getRange(row, 3).setValue(waiter.comps2);
        }
        if (waiter.comps4 && waiter.comps4 !== 0) {
          sheet.getRange(row, 4).setValue(waiter.comps4);
        }
        if (waiter.comps8 && waiter.comps8 !== 0) {
          sheet.getRange(row, 5).setValue(waiter.comps8);
        }
        if (waiter.comps11 && waiter.comps11 !== 0) {
          sheet.getRange(row, 6).setValue(waiter.comps11);
        }
        if (waiter.comps12 && waiter.comps12 !== 0) {
          sheet.getRange(row, 7).setValue(waiter.comps12);
        }
        if (waiter.comps13 && waiter.comps13 !== 0) {
          sheet.getRange(row, 8).setValue(waiter.comps13);
        }
        
        sheet.getRange(row, 9).setValue(waiter.justificativas || '');
        row++;
      }
    }
    
    // Forçar atualização
    SpreadsheetApp.flush();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Fechamento completo realizado com sucesso',
      dataOperacional: dados.dataOperacional,
      gerenteDia: dados.gerenteDia,
      gerenteNoite: dados.gerenteNoite,
      totalComps: dados.totalComps,
      waitersCount: dados.waiters ? dados.waiters.length : 0
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Erro no fechamento:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro no fechamento: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
