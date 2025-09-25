/**
 * Google Apps Script Completo - COM PDF PÚBLICO E LIMPEZA AUTOMÁTICA APÓS 24H
 * Substitua TODO o código no Google Apps Script por este
 */

// Configurações
var SUPABASE_URL = 'https://hivxzwvqzfelhbijiuzm.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpdnh6d3ZxemZlbGhiaWppdXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDU1MjQsImV4cCI6MjA3MzkyMTUyNH0.5lU7K9ZJP-KE7668a4Guf3iiHhEHF-XjXQnhoz5bxfI';

// Função para requisições GET (necessária para aplicações web)
function doGet(e) {
  try {
    var data = e.parameter;
    var action = data.action;
    
    console.log('📥 Requisição GET recebida:', action);
    
    // Redirecionar para doPost para processar
    return doPost(e);
    
  } catch (error) {
    console.error('❌ Erro na função doGet:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro na função doGet: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função principal
function doPost(e) {
  try {
    var data = e.parameter;
    var action = data.action;
    
    console.log('Ação:', action);
    
    if (action === 'testeConexao') {
      return testeConexao();
    }
    
    if (action === 'status') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Google Apps Script funcionando corretamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      })).setMimeType(ContentService.MimeType.JSON);
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
    
    if (action === 'limparTodosTriggers') {
      limparTodosTriggers();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Todos os triggers foram removidos'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'limparTriggersAntigos') {
      limparTriggersAntigos();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Triggers antigos foram removidos'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'testarPerdas') {
      return testarPerdas(data);
    }
    
    if (action === 'testarTrigger') {
      return testarTrigger();
    }
    
    // NOVAS AÇÕES PARA LIMPEZA DE PDFs
    if (action === 'limparTodosPDFsAntigos') {
      return ContentService.createTextOutput(JSON.stringify(limparTodosPDFsAntigos())).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'listarPDFsPendentes') {
      return ContentService.createTextOutput(JSON.stringify(listarPDFsPendentes())).setMimeType(ContentService.MimeType.JSON);
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

// Enviar fechamento completo - COM PDF ESTÁTICO RESTAURADO E LIMPEZA AUTOMÁTICA
function enviarFechamentoCompleto(data) {
  try {
    console.log('Iniciando fechamento completo...');
    console.log('Data recebida:', data);
    console.log('Data.dados:', data.dados);
    
    // Parse dos dados - ULTRA ROBUSTO
    var dados;
    if (typeof data.dados === 'string') {
      try {
        dados = JSON.parse(data.dados);
      } catch (parseError) {
        console.error('Erro ao fazer parse dos dados:', parseError);
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Erro ao fazer parse dos dados: ' + parseError.message
        })).setMimeType(ContentService.MimeType.JSON);
      }
    } else if (data.dados) {
      dados = data.dados;
    } else {
      // Se não tem dados, usar os parâmetros diretos
      dados = {
        dataOperacional: data.dataOperacional,
        gerenteDia: data.gerenteDia,
        gerenteNoite: data.gerenteNoite,
        totalComps: data.totalComps,
        waiters: data.waiters ? (typeof data.waiters === 'string' ? JSON.parse(data.waiters) : data.waiters) : [],
        porcentagens: data.porcentagens ? (typeof data.porcentagens === 'string' ? JSON.parse(data.porcentagens) : data.porcentagens) : {}
      };
    }
    
    console.log('Dados parseados:', dados);
    
    // Verificar se os dados essenciais existem
    if (!dados || !dados.dataOperacional) {
      console.error('Campo dataOperacional obrigatório');
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Campo dataOperacional obrigatório'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 1. Atualizar cabeçalho
    var headerData = {
      dataOperacional: dados.dataOperacional || '22/09/2025',
      gerenteDia: dados.gerenteDia || dados.gerenteDiurno || 'Gerente Dia',
      gerenteNoite: dados.gerenteNoite || dados.gerenteNoturno || 'Gerente Noite',
      totalComps: dados.totalComps || 0,
      porcentagens: dados.porcentagens || {
        comps2: '0%',
        comps4: '0%',
        comps8: '0%',
        comps11: '0%',
        comps12: '0%',
        comps13: '0%'
      }
    };
    updateHeaderInterno(headerData);
    
    // 2. Adicionar garçons
    var waitersData = dados.waiters || [];
    addWaitersInterno(waitersData, dados.totalComps);
    
    // 3. Forçar atualização
    SpreadsheetApp.flush();
    
    // 4. Gerar PDF ESTÁTICO (cópia permanente) - FUNCIONALIDADE RESTAURADA
    console.log('📄 Gerando PDF estático...');
    var pdfResult = gerarPDFEstatico();
    console.log('✅ PDF estático gerado:', pdfResult.pdfUrl);
    
    // 5. Gerar XLSX
    var xlsxResult = gerarXLSXCorrigido();
    
    // 6. Enviar email COM XLSX E PERDAS DE SERVIÇO
    var emailData = {
      dataOperacional: formatarDataBrasileira(dados.dataOperacional),
      gerenteDia: dados.gerenteDia || dados.gerenteDiurno,
      gerenteNoite: dados.gerenteNoite || dados.gerenteNoturno,
      totalComps: dados.totalComps,
      porcentagens: dados.porcentagens
    };
    var emailResult = enviarEmailComPerdas({ emailData: emailData }, xlsxResult.xlsxBase64, xlsxResult.fileName);
    
    // 7. Enviar notificação com PDF ESTÁTICO para gerentes
    var notificacaoResult = enviarNotificacaoComPDFCorrigida({ emailData: emailData }, pdfResult.pdfUrl);
    
    // 8. Agendar limpeza da planilha (agora o PDF não será afetado)
    agendarLimpeza();
    
    // 9. Agendar limpeza da cópia PDF após 24 horas
    agendarLimpezaPDF(pdfResult.copiaId, pdfResult.nomeArquivo);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Fechamento completo realizado com sucesso',
      pdfUrl: pdfResult.pdfUrl,
      pdfEstatico: true, // Indicar que é PDF estático
      copiaId: pdfResult.copiaId,
      nomeArquivo: pdfResult.nomeArquivo,
      xlsxUrl: xlsxResult.xlsxUrl,
      emailResult: emailResult,
      notificacaoResult: notificacaoResult,
      limpezaPDFAgendada: true // Indicar que limpeza foi agendada
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Erro no fechamento:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro no fechamento: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ===== FUNÇÕES AUXILIARES =====

// Gerar PDF estático (cópia permanente) - FUNCIONALIDADE RESTAURADA COM PDF PÚBLICO
function gerarPDFEstatico() {
  try {
    console.log('📄 Gerando PDF estático (cópia permanente)...');
    
    // 1. Criar uma cópia da planilha atual
    var spreadsheetOriginal = SpreadsheetApp.getActiveSpreadsheet();
    var timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '_') + '_' + Date.now();
    var nomeArquivo = 'Relatorio_Comps_' + timestamp;
    var copiaSpreadsheet = spreadsheetOriginal.copy(nomeArquivo);
    
    console.log('📋 Cópia criada:', copiaSpreadsheet.getName());
    
    // 2. TORNAR O ARQUIVO PÚBLICO - QUALQUER UM COM O LINK PODE ACESSAR
    try {
      var arquivo = DriveApp.getFileById(copiaSpreadsheet.getId());
      arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      console.log('🌐 Arquivo configurado como PÚBLICO - qualquer um com o link pode acessar');
    } catch (sharingError) {
      console.log('⚠️ Erro ao tornar arquivo público:', sharingError);
    }
    
    // 3. Aguardar um momento para garantir que a cópia foi criada e configurada
    Utilities.sleep(2000);
    
    // 4. Gerar PDF da cópia (agora público)
    var pdfUrl = copiaSpreadsheet.getUrl().replace('/edit', '/export') + 
                 '?format=pdf&size=A4&portrait=false&fitw=true&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=true&fzr=false&top_margin=0.5&bottom_margin=0.5&left_margin=0.5&right_margin=0.5';
    
    console.log('📄 PDF estático PÚBLICO gerado:', pdfUrl);
    
    // 5. Opcional: Mover a cópia para uma pasta específica no Drive
    try {
      var pastas = DriveApp.getFoldersByName('Relatórios Comps');
      var pasta;
      if (pastas.hasNext()) {
        pasta = pastas.next();
      } else {
        pasta = DriveApp.createFolder('Relatórios Comps');
        console.log('📁 Pasta "Relatórios Comps" criada');
      }
      
      var arquivo = DriveApp.getFileById(copiaSpreadsheet.getId());
      pasta.addFile(arquivo);
      DriveApp.getRootFolder().removeFile(arquivo);
      console.log('📁 Arquivo movido para pasta Relatórios Comps');
    } catch (pastaError) {
      console.log('⚠️ Não foi possível mover para pasta, mas PDF foi criado:', pastaError);
    }
    
    return { 
      pdfUrl: pdfUrl,
      copiaId: copiaSpreadsheet.getId(),
      nomeArquivo: nomeArquivo,
      publico: true // Indicar que o PDF é público
    };
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF estático:', error);
    // Fallback para PDF normal se houver erro
    return gerarPDFOtimizado();
  }
}

// ===== FUNÇÕES PARA LIMPEZA AUTOMÁTICA DE PDFs APÓS 24 HORAS =====

// Agendar limpeza da cópia PDF após 24 horas
function agendarLimpezaPDF(copiaId, nomeArquivo) {
  try {
    console.log('⏰ Agendando limpeza do PDF após 24 horas...');
    console.log('📄 Arquivo:', nomeArquivo, 'ID:', copiaId);
    
    // Criar trigger para executar após 24 horas
    var trigger = ScriptApp.newTrigger('limparPDFAntigo')
      .timeBased()
      .after(24 * 60 * 60 * 1000) // 24 horas em milissegundos
      .create();
    
    // Armazenar dados do arquivo para limpeza posterior
    var dadosLimpeza = {
      copiaId: copiaId,
      nomeArquivo: nomeArquivo,
      dataCriacao: new Date().toISOString(),
      triggerId: trigger.getUniqueId()
    };
    
    // Salvar dados em PropertiesService para recuperar depois
    var properties = PropertiesService.getScriptProperties();
    var chave = 'limpeza_pdf_' + copiaId;
    properties.setProperty(chave, JSON.stringify(dadosLimpeza));
    
    console.log('✅ Limpeza de PDF agendada para 24 horas');
    console.log('🆔 ID do trigger:', trigger.getUniqueId());
    console.log('🔑 Chave salva:', chave);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao agendar limpeza do PDF:', error);
    return false;
  }
}

// Executar limpeza do PDF antigo (chamada pelo trigger após 24h)
function limparPDFAntigo() {
  try {
    console.log('🗑️ Iniciando limpeza de PDFs antigos...');
    
    var properties = PropertiesService.getScriptProperties();
    var todasAsPropriedades = properties.getProperties();
    var arquivosRemovidos = 0;
    var erros = 0;
    
    // Buscar todas as chaves de limpeza de PDF
    for (var chave in todasAsPropriedades) {
      if (chave.startsWith('limpeza_pdf_')) {
        try {
          var dados = JSON.parse(todasAsPropriedades[chave]);
          var dataCriacao = new Date(dados.dataCriacao);
          var agora = new Date();
          var diferencaHoras = (agora - dataCriacao) / (1000 * 60 * 60);
          
          console.log('📄 Verificando arquivo:', dados.nomeArquivo);
          console.log('⏰ Criado há:', diferencaHoras.toFixed(2), 'horas');
          
          // Se passou mais de 24 horas, deletar
          if (diferencaHoras >= 24) {
            try {
              var arquivo = DriveApp.getFileById(dados.copiaId);
              arquivo.setTrashed(true);
              console.log('✅ Arquivo deletado:', dados.nomeArquivo);
              arquivosRemovidos++;
            } catch (fileError) {
              console.log('⚠️ Arquivo já foi deletado ou não existe:', dados.nomeArquivo);
            }
            
            // Remover propriedade
            properties.deleteProperty(chave);
            console.log('🧹 Propriedade removida:', chave);
          }
        } catch (parseError) {
          console.error('❌ Erro ao processar dados:', chave, parseError);
          erros++;
        }
      }
    }
    
    console.log('🎯 Limpeza concluída:');
    console.log('   📄 Arquivos removidos:', arquivosRemovidos);
    console.log('   ❌ Erros:', erros);
    
    // Auto-excluir este trigger após execução
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = triggers.length - 1; i >= 0; i--) {
      var trigger = triggers[i];
      if (trigger.getHandlerFunction() === 'limparPDFAntigo') {
        ScriptApp.deleteTrigger(trigger);
        console.log('🗑️ Trigger de limpeza auto-excluído');
        break;
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na limpeza de PDFs:', error);
  }
}

// Função para limpar TODOS os PDFs antigos manualmente (para emergência)
function limparTodosPDFsAntigos() {
  try {
    console.log('🧹 LIMPEZA MANUAL: Removendo todos os PDFs antigos...');
    
    var properties = PropertiesService.getScriptProperties();
    var todasAsPropriedades = properties.getProperties();
    var arquivosRemovidos = 0;
    
    for (var chave in todasAsPropriedades) {
      if (chave.startsWith('limpeza_pdf_')) {
        try {
          var dados = JSON.parse(todasAsPropriedades[chave]);
          
          try {
            var arquivo = DriveApp.getFileById(dados.copiaId);
            arquivo.setTrashed(true);
            console.log('✅ Arquivo deletado:', dados.nomeArquivo);
            arquivosRemovidos++;
          } catch (fileError) {
            console.log('⚠️ Arquivo já foi deletado:', dados.nomeArquivo);
          }
          
          properties.deleteProperty(chave);
        } catch (error) {
          console.error('❌ Erro ao processar:', chave, error);
        }
      }
    }
    
    console.log('🎯 Limpeza manual concluída - Arquivos removidos:', arquivosRemovidos);
    
    return {
      success: true,
      arquivosRemovidos: arquivosRemovidos,
      message: 'Limpeza manual concluída'
    };
    
  } catch (error) {
    console.error('❌ Erro na limpeza manual:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para listar PDFs pendentes de limpeza (para debug)
function listarPDFsPendentes() {
  try {
    console.log('📋 Listando PDFs pendentes de limpeza...');
    
    var properties = PropertiesService.getScriptProperties();
    var todasAsPropriedades = properties.getProperties();
    var pdfsPendentes = [];
    
    for (var chave in todasAsPropriedades) {
      if (chave.startsWith('limpeza_pdf_')) {
        try {
          var dados = JSON.parse(todasAsPropriedades[chave]);
          var dataCriacao = new Date(dados.dataCriacao);
          var agora = new Date();
          var diferencaHoras = (agora - dataCriacao) / (1000 * 60 * 60);
          
          pdfsPendentes.push({
            nome: dados.nomeArquivo,
            id: dados.copiaId,
            criadoEm: dados.dataCriacao,
            horasAtras: diferencaHoras.toFixed(2),
            prontoParaLimpeza: diferencaHoras >= 24
          });
        } catch (error) {
          console.error('❌ Erro ao processar:', chave, error);
        }
      }
    }
    
    console.log('📋 PDFs pendentes encontrados:', pdfsPendentes.length);
    pdfsPendentes.forEach(function(pdf, index) {
      console.log('   ' + (index + 1) + '. ' + pdf.nome + ' (' + pdf.horasAtras + 'h atrás)');
    });
    
    return {
      success: true,
      total: pdfsPendentes.length,
      pdfs: pdfsPendentes
    };
    
  } catch (error) {
    console.error('❌ Erro ao listar PDFs pendentes:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Gerar PDF otimizado para impressão (A4 horizontal) - MANTIDO COMO FALLBACK
function gerarPDFOtimizado() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var pdfUrl = spreadsheet.getUrl().replace('/edit', '/export') + 
               '?format=pdf&size=A4&portrait=false&fitw=true&sheetnames=false&printtitle=false&pagenumbers=false&gridlines=true&fzr=false&top_margin=0.5&bottom_margin=0.5&left_margin=0.5&right_margin=0.5';
  return { pdfUrl: pdfUrl };
}

// Função para formatar data no padrão brasileiro (dd/mm/aaaa) - CORRIGIDA
function formatarDataBrasileira(dataISO) {
  try {
    // Se já está no formato brasileiro, retorna como está
    if (typeof dataISO === 'string' && dataISO.includes('/')) {
      return dataISO;
    }
    
    var data = new Date(dataISO);
    var dia = String(data.getDate()).padStart(2, '0');
    var mes = String(data.getMonth() + 1).padStart(2, '0');
    var ano = data.getFullYear();
    return dia + '/' + mes + '/' + ano;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return dataISO; // Retorna a data original se houver erro
  }
}

// Buscar perdas de serviço do Supabase para o dia operacional - CORRIGIDO E MELHORADO
function buscarPerdasServico(dataOperacional) {
  try {
    console.log('🔍 Buscando perdas de serviço para:', dataOperacional);
    
    // Converter data operacional para formato correto se necessário
    var dataOperacionalFormatada = dataOperacional;
    if (dataOperacional.includes('/')) {
      // Se está no formato dd/mm/aaaa, converter para aaaa-mm-dd
      var partes = dataOperacional.split('/');
      dataOperacionalFormatada = partes[2] + '-' + partes[1].padStart(2, '0') + '-' + partes[0].padStart(2, '0');
    }
    
    console.log('📅 Data operacional formatada:', dataOperacionalFormatada);
    
    // BUSCA COM LÓGICA DE DIA OPERACIONAL - Considerando timezone UTC-3 (Brasília)
    console.log('🔄 Usando lógica de dia operacional (05:00) com timezone UTC-3...');
    
    // Lógica do frontend: dia operacional vai de 05:00 do dia atual até 04:59:59 do dia seguinte
    // Mas o Supabase armazena em UTC, então precisamos ajustar:
    // 05:00 Brasília = 08:00 UTC
    // 04:59:59 Brasília (dia seguinte) = 07:59:59 UTC (dia seguinte)
    
    var dataInicio = dataOperacionalFormatada + 'T08:00:00.000Z'; // 05:00 Brasília = 08:00 UTC
    var dataFimCompleta = new Date(dataOperacionalFormatada);
    dataFimCompleta.setDate(dataFimCompleta.getDate() + 1);
    var dataFimFormatada = dataFimCompleta.toISOString().split('T')[0] + 'T07:59:59.999Z'; // 04:59:59 Brasília = 07:59:59 UTC
    
    console.log('📅 Período do dia operacional (UTC-3 → UTC):');
    console.log('   Início (05:00 Brasília):', dataInicio);
    console.log('   Fim (04:59:59 Brasília):', dataFimFormatada);
    
    var url = SUPABASE_URL + '/rest/v1/perda_servico' +
              '?created_at=gte.' + dataInicio +
              '&created_at=lte.' + dataFimFormatada +
              '&order=created_at.desc';
    
    console.log('🌐 URL de busca ampla:', url);
    
    // Fazer requisição para Supabase
    var response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status da resposta:', response.getResponseCode());
    console.log('📄 Conteúdo da resposta:', response.getContentText());
    
    if (response.getResponseCode() !== 200) {
      console.error('❌ Erro ao buscar perdas:', response.getContentText());
      return [];
    }
    
    var perdas = JSON.parse(response.getContentText());
    console.log('📋 Perdas encontradas para hoje:', perdas.length);
    
    // Debug: Mostrar detalhes das perdas
    if (perdas.length > 0) {
      console.log('📋 Detalhes das perdas encontradas:');
      perdas.forEach(function(perda, index) {
        console.log('   ' + (index + 1) + '. ' + perda.atendente_nome + ' - Mesa ' + perda.numero_mesa + ' - ' + perda.motivo + ' (' + perda.created_at + ')');
      });
    } else {
      console.log('⚠️ Nenhuma perda encontrada para o dia:', dataOperacionalFormatada);
    }
    
    return perdas;
    
  } catch (error) {
    console.error('❌ Erro ao buscar perdas de serviço:', error);
    return [];
  }
}

// Enviar email COM XLSX E PERDAS DE SERVIÇO
function enviarEmailComPerdas(data, xlsxBase64, fileName) {
  try {
    console.log('📧 Enviando email COM perdas de serviço...');
    console.log('Tamanho do XLSX:', xlsxBase64.length, 'caracteres');
    
    var destinatarios = buscarDestinatariosSupabase();
    console.log('Destinatários:', destinatarios);
    
    if (destinatarios.length === 0) {
      console.log('Nenhum destinatário encontrado, usando email padrão');
      destinatarios = ['compsbz91@girosaas.com.br'];
    }
    
    var emailData = typeof data.emailData === 'string' ? JSON.parse(data.emailData) : data.emailData;
    var assunto = 'Relatório de comps BZ91- ' + emailData.dataOperacional;
    
    // Buscar perdas de serviço para incluir no email
    console.log('🔍 Buscando perdas para o email com data:', emailData.dataOperacional);
    var perdas = buscarPerdasServico(emailData.dataOperacional);
    console.log('📋 Perdas encontradas para o email:', perdas.length);
    console.log('📋 Tipo de perdas:', typeof perdas);
    console.log('📋 Array.isArray(perdas):', Array.isArray(perdas));
    console.log('📋 Conteúdo das perdas:', JSON.stringify(perdas));
    
    // Debug: Mostrar detalhes das perdas encontradas
    if (perdas.length > 0) {
      console.log('📋 Detalhes das perdas:');
      perdas.forEach(function(perda, index) {
        console.log('   ' + (index + 1) + '. ' + perda.atendente_nome + ' - Mesa ' + perda.numero_mesa + ' - ' + perda.motivo);
      });
    } else {
      console.log('⚠️ Nenhuma perda encontrada para o dia:', emailData.dataOperacional);
    }
    
    var corpo = gerarCorpoEmailComPerdas(emailData, perdas);
    
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
    console.log('✅ Email enviado com perdas:', resultado);
    
    return resultado;
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    throw error;
  }
}

// Gerar corpo do email COM perdas de serviço
function gerarCorpoEmailComPerdas(emailData, perdas) {
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
    '<p><strong>Total de Comps:</strong> R$ ' + emailData.totalComps.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '</p>' +
    '</div>' +
    '<div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">' +
    '<h3 style="color: #27ae60; margin-top: 0;">Distribuição por Tipo de Comp</h3>' +
    '<ul style="list-style: none; padding: 0;">' +
    '<li style="margin: 5px 0;">• Comps 2: ' + emailData.porcentagens.comps2 + '</li>' +
    '<li style="margin: 5px 0;">• Comps 4: ' + emailData.porcentagens.comps4 + '</li>' +
    '<li style="margin: 5px 0;">• Comps 8: ' + emailData.porcentagens.comps8 + '</li>' +
    '<li style="margin: 5px 0;">• Comps 11: ' + emailData.porcentagens.comps11 + '</li>' +
    '<li style="margin: 5px 0;">• Comps 12: ' + emailData.porcentagens.comps12 + '</li>' +
    '<li style="margin: 5px 0;">• Comps 13: ' + emailData.porcentagens.comps13 + '</li>' +
    '</ul>' +
    '</div>';
  
  // Adicionar seção de perdas de serviço se houver
  console.log('🔍 Verificando perdas para o email:', perdas);
  console.log('🔍 Tipo de perdas:', typeof perdas);
  console.log('🔍 Tamanho do array perdas:', perdas ? perdas.length : 'undefined');
  console.log('🔍 Array.isArray(perdas):', Array.isArray(perdas));
  console.log('🔍 perdas.length > 0:', perdas && perdas.length > 0);
  
  if (perdas && Array.isArray(perdas) && perdas.length > 0) {
    console.log('📋 Adicionando seção de perdas no email:', perdas.length, 'perdas');
    
    // Agrupar perdas por atendente
    var perdasPorAtendente = {};
    perdas.forEach(function(perda) {
      if (!perdasPorAtendente[perda.atendente_nome]) {
        perdasPorAtendente[perda.atendente_nome] = [];
      }
      perdasPorAtendente[perda.atendente_nome].push(perda);
    });
    
    corpo += '<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">' +
      '<h3 style="color: #856404; margin-top: 0;">⚠️ Perdas de Serviço Registradas</h3>' +
      '<p style="color: #856404; margin-bottom: 15px;"><strong>Total de perdas:</strong> ' + perdas.length + '</p>';
    
    // Adicionar detalhes por atendente
    Object.keys(perdasPorAtendente).forEach(function(atendente) {
      var perdasAtendente = perdasPorAtendente[atendente];
      corpo += '<div style="margin-bottom: 15px; padding: 10px; background-color: #ffffff; border-radius: 3px;">' +
        '<h4 style="color: #856404; margin: 0 0 10px 0;">' + atendente + ' (' + perdasAtendente.length + ' perda' + (perdasAtendente.length > 1 ? 's' : '') + ')</h4>';
      
      perdasAtendente.forEach(function(perda) {
        var dataHora = new Date(perda.created_at).toLocaleString('pt-BR');
        corpo += '<div style="margin: 5px 0; padding: 5px; background-color: #f8f9fa; border-left: 3px solid #ffc107;">' +
          '<strong>Mesa ' + perda.numero_mesa + '</strong> - ' + dataHora + '<br>' +
          '<em>' + perda.motivo + '</em>' +
          '</div>';
      });
      
      corpo += '</div>';
    });
    
    corpo += '</div>';
  } else {
    console.log('✅ Nenhuma perda de serviço encontrada para o dia');
    console.log('🔍 Debug - perdas:', perdas);
    console.log('🔍 Debug - é array:', Array.isArray(perdas));
    console.log('🔍 Debug - length:', perdas ? perdas.length : 'undefined');
    
    corpo += '<div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">' +
      '<h3 style="color: #155724; margin-top: 0;">✅ Nenhuma Perda de Serviço</h3>' +
      '<p style="color: #155724; margin: 0;">Excelente! Não foram registradas perdas de serviço no dia operacional.</p>' +
      '</div>';
  }
  
  corpo += '<div style="margin: 20px 0;">' +
    '<h3 style="color: #2c3e50;">Relatório Completo</h3>' +
    '<p style="color: #7f8c8d; font-size: 14px;">' +
    '   A planilha completa está anexada a este email em formato XLSX' +
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
    '<em>Att: ADM</em>' +
    '</p>' +
    '</div>' +
    '</div>';
  
  return corpo;
}

// ===== FUNÇÕES RESTANTES =====

// Atualizar cabeçalho interno - CORRIGIDO
function updateHeaderInterno(headerData) {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    
    // Formatar data para padrão brasileiro
    var dataFormatada = formatarDataBrasileira(headerData.dataOperacional);
    console.log('Data formatada:', dataFormatada);
    
    sheet.getRange('B1').setValue(dataFormatada);
    sheet.getRange('E1').setValue(headerData.gerenteDia);
    sheet.getRange('E2').setValue(headerData.gerenteNoite);
    sheet.getRange('B2').setValue(headerData.totalComps);
    
    // Converter porcentagens para texto simples (ex: "10%" em vez de "10.00%")
    var comps2Pct = (headerData.porcentagens.comps2 || '0%').toString().replace('.00%', '%');
    var comps4Pct = (headerData.porcentagens.comps4 || '0%').toString().replace('.00%', '%');
    var comps8Pct = (headerData.porcentagens.comps8 || '0%').toString().replace('.00%', '%');
    var comps11Pct = (headerData.porcentagens.comps11 || '0%').toString().replace('.00%', '%');
    var comps12Pct = (headerData.porcentagens.comps12 || '0%').toString().replace('.00%', '%');
    var comps13Pct = (headerData.porcentagens.comps13 || '0%').toString().replace('.00%', '%');
    
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

// Adicionar garçons interno - CORRIGIDO PARA NÃO MOSTRAR ZEROS
function addWaitersInterno(waitersData, totalComps) {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    
    sheet.getRange('A8:I100').clearContent();
    
    var row = 8;
    for (var i = 0; i < waitersData.length; i++) {
      var waiter = waitersData[i];
      
      // Usar valores diretos dos comps (já são valores monetários)
      var comps2Valor = waiter.comps2 || 0;
      var comps4Valor = waiter.comps4 || 0;
      var comps8Valor = waiter.comps8 || 0;
      var comps11Valor = waiter.comps11 || 0;
      var comps12Valor = waiter.comps12 || 0;
      var comps13Valor = waiter.comps13 || 0;
      
      sheet.getRange(row, 1).setValue(waiter.nome);
      sheet.getRange(row, 2).setValue(waiter.total);
      
      // CORREÇÃO: Só inserir valores se não forem zero ou vazios
      if (comps2Valor && comps2Valor !== 0) {
        sheet.getRange(row, 3).setValue(comps2Valor);
      }
      if (comps4Valor && comps4Valor !== 0) {
        sheet.getRange(row, 4).setValue(comps4Valor);
      }
      if (comps8Valor && comps8Valor !== 0) {
        sheet.getRange(row, 5).setValue(comps8Valor);
      }
      if (comps11Valor && comps11Valor !== 0) {
        sheet.getRange(row, 6).setValue(comps11Valor);
      }
      if (comps12Valor && comps12Valor !== 0) {
        sheet.getRange(row, 7).setValue(comps12Valor);
      }
      if (comps13Valor && comps13Valor !== 0) {
        sheet.getRange(row, 8).setValue(comps13Valor);
      }
      
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

// Enviar notificação COM PDF para gerentes - FUNÇÃO CORRIGIDA
function enviarNotificacaoComPDFCorrigida(data, pdfUrl) {
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
        // CORREÇÃO: Verificar se há conteúdo antes de fazer parse
        var responseText = response.getContentText();
        console.log('Conteúdo da resposta:', responseText);
        
        var resultado = {};
        if (responseText && responseText.trim() !== '') {
          try {
            resultado = JSON.parse(responseText);
          } catch (parseError) {
            console.log('Erro ao fazer parse da resposta, mas notificação foi criada:', parseError);
            resultado = { id: 'created_successfully' };
          }
        } else {
          console.log('Resposta vazia, mas status code indica sucesso');
          resultado = { id: 'created_successfully' };
        }
        
        notificacoes.push({ 
          gerente: gerente.nome, 
          success: true, 
          notificationId: resultado.id || 'created'
        });
      } else {
        var errorText = response.getContentText();
        console.log('Erro na notificação:', errorText);
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

// Agendar limpeza - CORRIGIDO PARA GARANTIR CRIAÇÃO DO TRIGGER
function agendarLimpeza() {
  try {
    console.log('🔄 Agendando limpeza da planilha...');
    
    // Verificar se já existe um trigger de limpeza ativo
    var triggers = ScriptApp.getProjectTriggers();
    var triggersLimpezaExistentes = 0;
    
    for (var i = 0; i < triggers.length; i++) {
      var trigger = triggers[i];
      if (trigger.getHandlerFunction() === 'executarLimpeza') {
        triggersLimpezaExistentes++;
        console.log('⚠️ Trigger de limpeza já existe:', trigger.getUniqueId());
      }
    }
    
    // Se já existe um trigger, não criar outro
    if (triggersLimpezaExistentes > 0) {
      console.log('ℹ️ Trigger de limpeza já existe, não criando novo');
      return true;
    }
    
    // Criar novo trigger apenas se não existir
    console.log('🆕 Criando novo trigger de limpeza...');
    var novoTrigger = ScriptApp.newTrigger('executarLimpeza')
      .timeBased()
      .after(10 * 60 * 1000) // 10 minutos
      .create();
    
    console.log('✅ Trigger de limpeza criado com sucesso');
    console.log('🆔 ID do trigger:', novoTrigger.getUniqueId());
    console.log('⏰ Limpeza será executada em 10 minutos');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao agendar limpeza:', error);
    console.log('⚠️ Tentando método alternativo...');
    
    // Método alternativo - criar trigger imediatamente
    try {
      var triggerAlternativo = ScriptApp.newTrigger('executarLimpeza')
        .timeBased()
        .after(5 * 60 * 1000) // 5 minutos
        .create();
      
      console.log('✅ Trigger alternativo criado (5 minutos)');
      console.log('🆔 ID do trigger alternativo:', triggerAlternativo.getUniqueId());
      return true;
    } catch (errorAlternativo) {
      console.error('❌ Erro no método alternativo:', errorAlternativo);
      return false;
    }
  }
}

// Executar limpeza - CORRIGIDA PARA LIMPAR CABEÇALHO TAMBÉM
function executarLimpeza() {
  try {
    console.log('🧹 Iniciando limpeza da planilha...');
    var sheet = SpreadsheetApp.getActiveSheet();
    
    // Limpar cabeçalho
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
    
    // Limpar área dos waiters
    sheet.getRange('A8:I100').clearContent();
    sheet.getRange('A8:I100').clearFormat();
    
    SpreadsheetApp.flush();
    console.log('✅ Limpeza executada - cabeçalho e waiters limpos');
    
    // IMPORTANTE: Auto-excluir este trigger APÓS a execução
    console.log('🗑️ Auto-excluindo trigger após execução...');
    var triggers = ScriptApp.getProjectTriggers();
    var triggersRemovidos = 0;
    
    for (var i = triggers.length - 1; i >= 0; i--) {
      var trigger = triggers[i];
      if (trigger.getHandlerFunction() === 'executarLimpeza') {
        console.log('🗑️ Removendo trigger:', trigger.getUniqueId());
        ScriptApp.deleteTrigger(trigger);
        triggersRemovidos++;
      }
    }
    
    console.log('✅ Triggers removidos após execução:', triggersRemovidos);
    console.log('🎯 Limpeza concluída e trigger auto-excluído');
    
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
  }
}

// Limpar triggers antigos para evitar acúmulo
function limparTriggersAntigos() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    var triggersRemovidos = 0;
    
    console.log('🔍 Total de triggers encontrados:', triggers.length);
    
    for (var i = triggers.length - 1; i >= 0; i--) {
      var trigger = triggers[i];
      if (trigger.getHandlerFunction() === 'executarLimpeza') {
        ScriptApp.deleteTrigger(trigger);
        triggersRemovidos++;
      }
    }
    
    if (triggersRemovidos > 0) {
      console.log('🧹 Triggers antigos removidos:', triggersRemovidos);
    } else {
      console.log('✅ Nenhum trigger antigo encontrado');
    }
  } catch (error) {
    console.error('❌ Erro ao limpar triggers antigos:', error);
  }
}

// Função para limpar TODOS os triggers (usar com cuidado)
function limparTodosTriggers() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    console.log('🧹 Limpando todos os triggers:', triggers.length);
    
    for (var i = 0; i < triggers.length; i++) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
    
    console.log('✅ Todos os triggers foram removidos');
  } catch (error) {
    console.error('❌ Erro ao limpar todos os triggers:', error);
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

// FUNÇÃO LIMPARTUDO CORRIGIDA CONFORME ESPECIFICAÇÕES
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

// Função para testar busca de perdas - DEBUG
function testarPerdas(data) {
  try {
    var dataOperacional = data.dataOperacional || new Date().toLocaleDateString('pt-BR');
    console.log('🧪 TESTE: Buscando perdas para:', dataOperacional);
    
    var perdas = buscarPerdasServico(dataOperacional);
    
    var resultado = {
      success: true,
      dataOperacional: dataOperacional,
      perdasEncontradas: perdas.length,
      perdas: perdas,
      detalhes: perdas.map(function(perda, index) {
        return {
          numero: index + 1,
          atendente: perda.atendente_nome,
          mesa: perda.numero_mesa,
          motivo: perda.motivo,
          data: perda.created_at
        };
      })
    };
    
    console.log('🧪 Resultado do teste:', resultado);
    
    return ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro no teste de perdas: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para testar criação de triggers - DEBUG
function testarTrigger() {
  try {
    console.log('🧪 TESTE: Verificando triggers de limpeza...');
    
    // Verificar triggers existentes
    var triggers = ScriptApp.getProjectTriggers();
    var triggersLimpeza = 0;
    
    console.log('🔍 Total de triggers encontrados:', triggers.length);
    
    for (var i = 0; i < triggers.length; i++) {
      var trigger = triggers[i];
      if (trigger.getHandlerFunction() === 'executarLimpeza') {
        triggersLimpeza++;
        console.log('   - Trigger de limpeza encontrado:', trigger.getUniqueId());
      }
    }
    
    console.log('📋 Triggers de limpeza encontrados:', triggersLimpeza);
    
    // Tentar criar um trigger de teste
    console.log('🔄 Tentando criar trigger de teste...');
    var triggerTeste = ScriptApp.newTrigger('executarLimpeza')
      .timeBased()
      .after(1 * 60 * 1000) // 1 minuto
      .create();
    
    console.log('✅ Trigger de teste criado com sucesso');
    
    var resultado = {
      success: true,
      totalTriggers: triggers.length,
      triggersLimpeza: triggersLimpeza,
      triggerTesteCriado: true,
      triggerTesteId: triggerTeste.getUniqueId()
    };
    
    console.log('🧪 Resultado do teste:', resultado);
    
    return ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Erro no teste de trigger: ' + error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
