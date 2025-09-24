// Google Apps Script Notificação Final - Query corrigida
// Substitua TODO o código no Google Apps Script por este

// Configurações
var SUPABASE_URL = 'https://hivxzwvqzfelhbijiuzm.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpdnh6d3ZxemZlbGhiaWppdXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDU1MjQsImV4cCI6MjA3MzkyMTUyNH0.5lU7K9ZJP-KE7668a4Guf3iiHhEHF-XjXQnhoz5bxfI';

// Função principal
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
    
    if (action === 'updateHeader') {
      return updateHeader(data);
    }
    
    if (action === 'addWaiters') {
      return addWaiters(data);
    }
    
    if (action === 'gerarPDF') {
      return gerarPDF();
    }
    
    if (action === 'limparTudo') {
      return limparTudo();
    }
    
    if (action === 'criarNotificacao') {
      return criarNotificacao(data);
    }
    
    if (action === 'enviarEmailViaSupabase') {
      return enviarEmailViaSupabase(data);
    }
    
    if (action === 'gerarXLSXInterno') {
      return gerarXLSXInterno();
    }
    
    if (action === 'gerarXLSX') {
      return gerarXLSX(data);
    }
    
    if (action === 'updateByRow') {
      return updateByRow(data);
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

// Enviar fechamento completo
function enviarFechamentoCompleto(data) {
  try {
    console.log('Iniciando fechamento completo...');
    console.log('Data recebida:', data);
    console.log('Data.dados:', data.dados);
    
    // Parse dos dados
    var dados = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados;
    console.log('Dados parseados:', dados);
    
    // 1. Atualizar cabeçalho
    var headerData = {
      dataOperacional: dados.dataOperacional || '22/09/2025',
      gerenteDia: dados.gerenteDia || 'Gerente Dia',
      gerenteNoite: dados.gerenteNoite || 'Gerente Noite',
      totalComps: dados.totalComps || 0,
      porcentagens: dados.porcentagens || {
        comps2: 0,
        comps4: 0,
        comps8: 0,
        comps11: 0,
        comps12: 0,
        comps13: 0
      }
    };
    updateHeaderInterno(headerData);
    
    // 2. Adicionar garçons
    var waitersData = dados.waiters || [];
    addWaitersInterno(waitersData);
    
    // 3. Forçar atualização
    SpreadsheetApp.flush();
    
    // 4. Gerar PDF otimizado para impressão
    var pdfResult = gerarPDFOtimizado();
    
    // 5. Gerar XLSX
    var xlsxResult = gerarXLSXCorrigido();
    
    // 6. Enviar email APENAS com XLSX (sem PDF)
    var emailResult = enviarEmailApenasXLSX(data, xlsxResult.xlsxBase64, xlsxResult.fileName);
    
    // 7. Enviar notificação com PDF para gerentes
    var notificacaoResult = enviarNotificacaoComPDF(data, pdfResult.pdfUrl);
    
    // 8. Agendar limpeza
    agendarLimpeza();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Fechamento completo realizado com sucesso',
      pdfUrl: pdfResult.pdfUrl,
      xlsxUrl: xlsxResult.xlsxUrl,
      emailResult: emailResult,
      notificacaoResult: notificacaoResult
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Erro no fechamento:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro no fechamento: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para formatar data no padrão brasileiro (dd/mm/aaaa)
function formatarDataBrasileira(dataISO) {
  try {
    var data = new Date(dataISO);
    var dia = String(data.getDate()).padStart(2, '0');
    var mes = String(data.getMonth() + 1).padStart(2, '0');
    var ano = data.getFullYear();
    return dia + '/' + mes + '/' + ano;
  } catch (error) {
    return dataISO; // Retorna a data original se houver erro
  }
}

// Atualizar cabeçalho interno
function updateHeaderInterno(headerData) {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    
    // Formatar data para padrão brasileiro
    var dataFormatada = formatarDataBrasileira(headerData.dataOperacional);
    sheet.getRange('B1').setValue(dataFormatada);
    sheet.getRange('E1').setValue(headerData.gerenteDia);
    sheet.getRange('E2').setValue(headerData.gerenteNoite);
    sheet.getRange('B2').setValue(headerData.totalComps);
    
    // Converter porcentagens para texto simples (ex: "10%" em vez de "10.00%")
    var comps2Pct = headerData.porcentagens.comps2.replace('.00%', '%');
    var comps4Pct = headerData.porcentagens.comps4.replace('.00%', '%');
    var comps8Pct = headerData.porcentagens.comps8.replace('.00%', '%');
    var comps11Pct = headerData.porcentagens.comps11.replace('.00%', '%');
    var comps12Pct = headerData.porcentagens.comps12.replace('.00%', '%');
    var comps13Pct = headerData.porcentagens.comps13.replace('.00%', '%');
    
    sheet.getRange('C6').setValue(comps2Pct);
    sheet.getRange('D6').setValue(comps4Pct);
    sheet.getRange('E6').setValue(comps8Pct);
    sheet.getRange('F6').setValue(comps11Pct);
    sheet.getRange('G6').setValue(comps12Pct);
    sheet.getRange('H6').setValue(comps13Pct);
    
    formatHeaderCells(sheet);
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: 'Cabeçalho atualizado com sucesso',
      data: headerData
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao atualizar cabeçalho: ' + error.message
    };
  }
}

// Adicionar garçons interno
function addWaitersInterno(waitersData) {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    
    sheet.getRange('A8:I100').clearContent();
    
    var row = 8;
    for (var i = 0; i < waitersData.length; i++) {
      var waiter = waitersData[i];
      
      // Calcular valores monetários baseados nas porcentagens
      var totalComps = parseFloat(waiter.totalComps) || 0;
      var comps2Valor = Math.round(totalComps * (parseFloat(waiter.comps2) / 100)) || 0;
      var comps4Valor = Math.round(totalComps * (parseFloat(waiter.comps4) / 100)) || 0;
      var comps8Valor = Math.round(totalComps * (parseFloat(waiter.comps8) / 100)) || 0;
      var comps11Valor = Math.round(totalComps * (parseFloat(waiter.comps11) / 100)) || 0;
      var comps12Valor = Math.round(totalComps * (parseFloat(waiter.comps12) / 100)) || 0;
      var comps13Valor = Math.round(totalComps * (parseFloat(waiter.comps13) / 100)) || 0;
      
      sheet.getRange(row, 1).setValue(waiter.nome);
      sheet.getRange(row, 2).setValue(totalComps);
      sheet.getRange(row, 3).setValue(comps2Valor);
      sheet.getRange(row, 4).setValue(comps4Valor);
      sheet.getRange(row, 5).setValue(comps8Valor);
      sheet.getRange(row, 6).setValue(comps11Valor);
      sheet.getRange(row, 7).setValue(comps12Valor);
      sheet.getRange(row, 8).setValue(comps13Valor);
      sheet.getRange(row, 9).setValue(waiter.justificativas);
      
      // Aplicar formatação após inserir os valores
      SpreadsheetApp.flush();
      formatWaiterRow(sheet, row);
      row++;
    }
    
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: 'Garçons adicionados com sucesso',
      count: waitersData.length,
      data: waitersData
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao adicionar garçons: ' + error.message
    };
  }
}

// Gerar PDF otimizado para impressão (A4 horizontal)
function gerarPDFOtimizado() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var pdfUrl = spreadsheet.getUrl().replace('/edit', '/export') + 
               '?format=pdf&size=A4&portrait=false&fitw=true&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=true&fzr=false&top_margin=0.5&bottom_margin=0.5&left_margin=0.5&right_margin=0.5';
  return { pdfUrl: pdfUrl };
}

// Gerar XLSX corrigido com OAuth
function gerarXLSXCorrigido() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var exportUrl = ss.getUrl().replace('/edit', '/export')
    + '?format=xlsx&gid=' + ss.getActiveSheet().getSheetId()
    + '&size=A4&portrait=false&fitw=true&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=false&fzr=false';

  var options = {
    method: 'get',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };

  var resp = UrlFetchApp.fetch(exportUrl, options);
  var code = resp.getResponseCode();
  if (code !== 200) {
    throw new Error('Falha ao exportar XLSX. HTTP ' + code + ' - ' + resp.getContentText().slice(0, 200));
  }

  var blob = resp.getBlob()
    .setName('relatorio_comps.xlsx')
    .setContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  var base64 = Utilities.base64Encode(blob.getBytes());
  var dataAtual = new Date().toISOString().split('T')[0].replace(/-/g, '_');

  console.log('XLSX gerado com sucesso - Tamanho:', blob.getBytes().length, 'bytes');

  return {
    xlsxBase64: base64,
    xlsxUrl: exportUrl,
    fileName: 'relatorio_comps_' + dataAtual + '.xlsx',
    size: blob.getBytes().length
  };
}

// Enviar email APENAS com XLSX (sem PDF)
function enviarEmailApenasXLSX(data, xlsxBase64, fileName) {
  try {
    console.log('Enviando email APENAS com XLSX...');
    console.log('Tamanho do XLSX:', xlsxBase64.length, 'caracteres');
    
    var destinatarios = buscarDestinatariosSupabase();
    console.log('Destinatários:', destinatarios);
    
    if (destinatarios.length === 0) {
      console.log('Nenhum destinatário encontrado, usando email padrão');
      destinatarios = ['compsbz91@girosaas.com.br'];
    }
    
    var emailData = typeof data.emailData === 'string' ? JSON.parse(data.emailData) : data.emailData;
    var assunto = 'Relatório de comps BZ91- ' + emailData.dataOperacional;
    var corpo = gerarCorpoEmailSemPDF(emailData);
    
    var response = UrlFetchApp.fetch(SUPABASE_URL + '/functions/v1/enviar-email-zoho', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        destinatarios: destinatarios,
        assunto: assunto,
        corpo: corpo,
        planilhaBase64: xlsxBase64,
        nomeArquivo: fileName
      })
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error('Erro Supabase: ' + response.getResponseCode());
    }
    
    var resultado = JSON.parse(response.getContentText());
    console.log('Email enviado:', resultado);
    
    return resultado;
    
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

// Enviar notificação COM PDF para gerentes (QUERY CORRIGIDA)
function enviarNotificacaoComPDF(data, pdfUrl) {
  try {
    console.log('Enviando notificação COM PDF para gerentes...');
    
    var emailData = typeof data.emailData === 'string' ? JSON.parse(data.emailData) : data.emailData;
    
    // Buscar IDs dos gerentes no Supabase (query corrigida)
    var gerentes = buscarGerentesSupabase();
    
    if (gerentes.length === 0) {
      console.log('Nenhum gerente encontrado para notificação');
      return { success: false, message: 'Nenhum gerente encontrado' };
    }
    
    // Enviar notificação para cada gerente
    var notificacoes = [];
    for (var i = 0; i < gerentes.length; i++) {
      var gerente = gerentes[i];
      
      // Usar os campos corretos da tabela notifications
      var notificacao = {
        user_id: gerente.id,
        title: 'Fechamento Concluído',
        message: 'Relatório de comps do dia ' + emailData.dataOperacional + ' foi enviado com sucesso!',
        type: 'pdf_ready',
        pdf_url: pdfUrl,
        read: false
      };
      
      var response = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/notifications', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(notificacao)
      });
      
      console.log('Resposta da notificação para', gerente.nome, ':', response.getResponseCode());
      
      if (response.getResponseCode() === 200 || response.getResponseCode() === 201) {
        var resultado = JSON.parse(response.getContentText());
        notificacoes.push({ 
          gerente: gerente.nome, 
          success: true, 
          notificationId: resultado.id 
        });
      } else {
        var errorText = response.getContentText();
        notificacoes.push({ 
          gerente: gerente.nome, 
          success: false, 
          error: response.getResponseCode(),
          details: errorText
        });
      }
    }
    
    console.log('Notificações enviadas:', notificacoes);
    return { success: true, notificacoes: notificacoes };
    
  } catch (error) {
    console.error('Erro ao enviar notificações:', error);
    return { success: false, error: error.message };
  }
}

// Buscar gerentes no Supabase (QUERY CORRIGIDA)
function buscarGerentesSupabase() {
  try {
    // Query corrigida - buscar todos os gerentes ativos
    var response = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/profiles?ativo=eq.true&select=id,nome,role', {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status da busca de gerentes:', response.getResponseCode());
    
    if (response.getResponseCode() !== 200) {
      console.log('Erro na busca de gerentes:', response.getContentText());
      throw new Error('Erro ao buscar gerentes: ' + response.getResponseCode());
    }
    
    var data = JSON.parse(response.getContentText());
    console.log('Dados brutos dos gerentes:', data);
    
    // Filtrar apenas gerentes (manager_day, manager_night, admin)
    var gerentes = data.filter(function(profile) {
      return profile.role === 'manager_day' || profile.role === 'manager_night' || profile.role === 'admin';
    });
    
    console.log('Gerentes filtrados:', gerentes.length);
    return gerentes;
    
  } catch (error) {
    console.error('Erro ao buscar gerentes:', error);
    return [];
  }
}

// Buscar destinatários
function buscarDestinatariosSupabase() {
  try {
    var response = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/global_settings?config_key=eq.global_webhook_settings', {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.getResponseCode() !== 200) {
      throw new Error('Erro ao buscar: ' + response.getResponseCode());
    }
    
    var data = JSON.parse(response.getContentText());
    
    if (data.length === 0) {
      return [];
    }
    
    var config = data[0].config_value;
    return config.emailsDestino || [];
    
  } catch (error) {
    console.error('Erro ao buscar destinatários:', error);
    return [];
  }
}

// Gerar corpo do email SEM PDF (só XLSX)
function gerarCorpoEmailSemPDF(emailData) {
  var corpo = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">' +
    '<h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">' +
    'Relatório de fechamento do dia operacional' +
    '</h2>' +
    '<p style="font-size: 16px; color: #34495e; margin: 20px 0;">' +
    '<strong>BZ-91 ' + emailData.dataOperacional + '</strong>' +
    '</p>' +
    '<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">' +
    '<h3 style="color: #2c3e50; margin-top: 0;">Resumo Executivo</h3>' +
    '<p><strong>Gerente Dia:</strong> ' + emailData.gerenteDia + '</p>' +
    '<p><strong>Gerente Noite:</strong> ' + emailData.gerenteNoite + '</p>' +
    '<p><strong>Total de Comps:</strong> R$ ' + emailData.totalComps.toFixed(2) + '</p>' +
    '</div>' +
    '<div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">' +
    '<h3 style="color: #27ae60; margin-top: 0;">Distribuição por Tipo de Comp</h3>' +
    '<ul style="list-style: none; padding: 0;">' +
    '<li style="margin: 5px 0;">• Comps 2: ' + emailData.porcentagens.comps2 + '%</li>' +
    '<li style="margin: 5px 0;">• Comps 4: ' + emailData.porcentagens.comps4 + '%</li>' +
    '<li style="margin: 5px 0;">• Comps 8: ' + emailData.porcentagens.comps8 + '%</li>' +
    '<li style="margin: 5px 0;">• Comps 11: ' + emailData.porcentagens.comps11 + '%</li>' +
    '<li style="margin: 5px 0;">• Comps 12: ' + emailData.porcentagens.comps12 + '%</li>' +
    '<li style="margin: 5px 0;">• Comps 13: ' + emailData.porcentagens.comps13 + '%</li>' +
    '</ul>' +
    '</div>' +
    '<div style="margin: 20px 0;">' +
    '<h3 style="color: #2c3e50;">Relatório Completo</h3>' +
    '<p style="color: #7f8c8d; font-size: 14px;">' +
    '📊 A planilha completa está anexada a este email em formato XLSX' +
    '</p>' +
    '<p style="color: #7f8c8d; font-size: 12px; margin-top: 10px;">' +
    '<em>Para visualizar o PDF, acesse o aplicativo Comps Plus</em>' +
    '</p>' +
    '</div>' +
    '<div style="border-top: 1px solid #bdc3c7; padding-top: 15px; margin-top: 30px;">' +
    '<p style="color: #7f8c8d; font-size: 12px; margin: 0;">' +
    '<em>Relatório gerado automaticamente pelo Sistema Comps Plus</em>' +
    '</p>' +
    '<p style="color: #7f8c8d; font-size: 12px; margin: 5px 0 0 0;">' +
    '<em>Att: ' + emailData.gerenteDia + '</em>' +
    '</p>' +
    '</div>' +
    '</div>';
  
  return corpo;
}

// Agendar limpeza
function agendarLimpeza() {
  ScriptApp.newTrigger('executarLimpeza')
    .timeBased()
    .after(10 * 60 * 1000)
    .create();
}

// Executar limpeza
function executarLimpeza() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    sheet.getRange('A8:I100').clearContent();
    sheet.getRange('A8:I100').clearFormat();
    SpreadsheetApp.flush();
    console.log('Limpeza executada');
  } catch (error) {
    console.error('Erro na limpeza:', error);
  }
}

// Formatação do cabeçalho
function formatHeaderCells(sheet) {
  sheet.getRange('B1').setFontWeight('bold');
  sheet.getRange('E1:E2').setFontWeight('bold');
  sheet.getRange('B2').setFontWeight('bold');
  sheet.getRange('B2').setNumberFormat('R$ #,##0.00');
  
  var percentuaisRange = sheet.getRange('C6:H6');
  percentuaisRange.setBackground('#E3F2FD');
  percentuaisRange.setFontWeight('bold');
  percentuaisRange.setHorizontalAlignment('center');
}

// Formatação das linhas
function formatWaiterRow(sheet, row) {
  var range = sheet.getRange(row, 1, 1, 9);
  range.setBorder(true, true, true, true, true, true);
  sheet.getRange(row, 9).setWrap(true);
  
  sheet.getRange(row, 2).setNumberFormat('R$ #,##0.00');
  sheet.getRange(row, 3).setNumberFormat('R$ #,##0.00');
  sheet.getRange(row, 4).setNumberFormat('R$ #,##0.00');
  sheet.getRange(row, 5).setNumberFormat('R$ #,##0.00');
  sheet.getRange(row, 6).setNumberFormat('R$ #,##0.00');
  sheet.getRange(row, 7).setNumberFormat('R$ #,##0.00');
  sheet.getRange(row, 8).setNumberFormat('R$ #,##0.00');
}

// Funções de compatibilidade
function updateHeader(data) {
  try {
    var dados = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados;
    var result = updateHeaderInterno(dados);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro ao processar dados: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function addWaiters(data) {
  try {
    var dados = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados;
    var result = addWaitersInterno(dados);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro ao processar dados: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function gerarPDF() {
  return ContentService.createTextOutput(JSON.stringify(gerarPDFOtimizado())).setMimeType(ContentService.MimeType.JSON);
}

function limparTudo() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    
    // Limpar apenas células específicas do cabeçalho (conteúdo apenas, mantendo formatação)
    sheet.getRange('B1').clearContent(); // Data
    sheet.getRange('B2').clearContent(); // Total
    sheet.getRange('E1').clearContent(); // Gerente dia
    sheet.getRange('E2').clearContent(); // Gerente noite
    sheet.getRange('C6').clearContent(); // Porcentagem comps2
    sheet.getRange('D6').clearContent(); // Porcentagem comps4
    sheet.getRange('E6').clearContent(); // Porcentagem comps8
    sheet.getRange('F6').clearContent(); // Porcentagem comps11
    sheet.getRange('G6').clearContent(); // Porcentagem comps12
    sheet.getRange('H6').clearContent(); // Porcentagem comps13
    
    // Limpar área dos waiters (A8:I100) - conteúdo + bordas, mas manter formatação
    sheet.getRange('A8:I100').clearContent();
    sheet.getRange('A8:I100').setBorder(false, false, false, false, false, false);
    
    SpreadsheetApp.flush();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Dados limpos com sucesso'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro ao limpar: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para criar notificações
function criarNotificacao(data) {
  try {
    var dados = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados;
    
    // Buscar gerentes para notificação
    var gerentes = buscarGerentesParaNotificacao();
    if (!gerentes || gerentes.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Nenhum gerente encontrado para notificação'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Criar notificação para cada gerente
    var notificacoesCriadas = [];
    for (var i = 0; i < gerentes.length; i++) {
      var gerente = gerentes[i];
      
      // Formatar data para padrão brasileiro se disponível
      var dataFormatada = '';
      if (dados.dataOperacional) {
        dataFormatada = formatarDataBrasileira(dados.dataOperacional);
      }
      
      var notificacao = {
        user_id: gerente.id,
        title: dados.title || dados.titulo || 'Relatório de Comps' + (dataFormatada ? ' - ' + dataFormatada : ''),
        message: dados.mensagem || 'Novo relatório de comps disponível' + (dataFormatada ? ' para ' + dataFormatada : ''),
        type: dados.tipo || 'pdf_ready',
        pdf_url: dados.pdfUrl || dados.pdf_url || null,
        read: false
      };
      
      var response = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/notifications', {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        payload: JSON.stringify(notificacao)
      });
      
      if (response.getResponseCode() === 201) {
        notificacoesCriadas.push(gerente.nome);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Notificações criadas para: ' + notificacoesCriadas.join(', '),
      gerentes: notificacoesCriadas
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro ao criar notificação: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para buscar gerentes para notificação
function buscarGerentesParaNotificacao() {
  try {
    var response = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1/profiles?select=id,nome&role=in.(manager_day,manager_night,admin)', {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    } else {
      console.error('Erro ao buscar gerentes:', response.getContentText());
      return [];
    }
  } catch (error) {
    console.error('Erro ao buscar gerentes:', error);
    return [];
  }
}

// Função para enviar email via Supabase (CORRIGIDA)
function enviarEmailViaSupabase(data) {
  try {
    var dados = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados;
    
    // 1. BUSCAR DESTINATÁRIOS DO SUPABASE
    var destinatarios = buscarDestinatariosSupabase();
    console.log('Destinatários encontrados no Supabase:', destinatarios);
    
    if (destinatarios.length === 0) {
      console.log('Nenhum destinatário encontrado, usando email padrão');
      destinatarios = ['compsbz91@girosaas.com.br'];
    }
    
    // 2. GERAR XLSX PARA ANEXO
    var xlsxResult = gerarXLSXCorrigido();
    console.log('XLSX gerado para anexo:', xlsxResult.fileName, 'Tamanho:', xlsxResult.size);
    
    // 3. PREPARAR DADOS PARA ENVIO
    var emailPayload = {
      destinatarios: destinatarios,
      assunto: dados.assunto || 'Relatório de comps BZ91- ' + new Date().toLocaleDateString('pt-BR'),
      corpo: dados.corpo || 'Relatório de comps gerado automaticamente',
      planilhaBase64: xlsxResult.xlsxBase64,
      nomeArquivo: xlsxResult.fileName
    };
    
    console.log('Enviando email para:', destinatarios);
    console.log('Anexo XLSX:', xlsxResult.fileName, 'Tamanho:', xlsxResult.size, 'bytes');
    
    // 4. ENVIAR VIA SUPABASE EDGE FUNCTION
    var response = UrlFetchApp.fetch(SUPABASE_URL + '/functions/v1/enviar-email-zoho', {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(emailPayload)
    });
    
    console.log('Resposta do Supabase:', response.getResponseCode());
    
    if (response.getResponseCode() === 200) {
      var responseText = response.getContentText();
      var parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        parsedResponse = { success: true, message: responseText };
      }
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Email enviado via Supabase com anexo XLSX',
        response: parsedResponse,
        destinatarios: destinatarios,
        anexo: xlsxResult.fileName,
        tamanhoAnexo: xlsxResult.size
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Erro ao enviar email: ' + response.getContentText()
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro ao enviar email: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função gerarXLSX
function gerarXLSX(data) {
  try {
    var dados = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados;
    
    // Gerar XLSX usando a planilha atual
    var sheet = SpreadsheetApp.getActiveSheet();
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // Criar uma cópia temporária
    var tempSheet = spreadsheet.copy('Temp_' + new Date().getTime());
    var tempFile = DriveApp.getFileById(tempSheet.getId());
    
    // Converter para XLSX
    var blob = tempFile.getBlob().setContentType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Limpar arquivo temporário
    DriveApp.getFileById(tempSheet.getId()).setTrashed(true);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'XLSX gerado com sucesso',
      tamanho: blob.getBytes().length,
      linhas: sheet.getLastRow()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro ao gerar XLSX: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função updateByRow
function updateByRow(data) {
  try {
    var dados = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados;
    var row = dados.row || dados.linha || 8;
    var rowData = dados.data || dados.dados || {};
    
    var sheet = SpreadsheetApp.getActiveSheet();
    
    // Atualizar linha específica
    sheet.getRange(row, 1).setValue(rowData.WAITER || rowData.waiter || '');
    sheet.getRange(row, 2).setValue(rowData.TOTAL || rowData.total || 0);
    sheet.getRange(row, 3).setValue(rowData['COMPS 2'] || rowData.comps2 || '');
    sheet.getRange(row, 4).setValue(rowData["COMP'S 4"] || rowData.comps4 || '');
    sheet.getRange(row, 5).setValue(rowData['COMPS 8'] || rowData.comps8 || '');
    sheet.getRange(row, 6).setValue(rowData["COMP'S 11"] || rowData.comps11 || '');
    sheet.getRange(row, 7).setValue(rowData["COMP'S 12"] || rowData.comps12 || '');
    sheet.getRange(row, 8).setValue(rowData["COMP'S 13"] || rowData.comps13 || '');
    sheet.getRange(row, 9).setValue(rowData.JUSTIFICATIVAS || rowData.justificativas || '');
    
    SpreadsheetApp.flush();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Linha atualizada com sucesso',
      row: row,
      data: rowData
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro ao atualizar linha: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para gerar XLSX
function gerarXLSXInterno() {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var blob = spreadsheet.getBlob();
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'XLSX gerado com sucesso',
      xlsxData: Utilities.base64Encode(blob.getBytes())
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro ao gerar XLSX: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
