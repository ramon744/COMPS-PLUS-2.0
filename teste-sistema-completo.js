/**
 * Teste Completo do Sistema - Verificação Final
 * Este script testa todas as funcionalidades principais
 */

import fetch from 'node-fetch';

// URL do Google Apps Script (substitua pela sua URL real)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwZMzPRK19A07IiESRd_qe_yt0QFLsXql9dZ5PhO3qsCLf0O5NIKNqRCnNb_pazCAbhQ/exec';

async function testarSistemaCompleto() {
  console.log('🧪 INICIANDO TESTE COMPLETO DO SISTEMA');
  console.log('=====================================\n');

  const testes = [
    { nome: 'Conexão Básica', action: 'status' },
    { nome: 'Teste de Conexão', action: 'testeConexao' },
    { nome: 'Busca de Perdas', action: 'testarPerdas', params: { dataOperacional: '25/09/2025' } },
    { nome: 'Verificar Triggers', action: 'testarTrigger' },
    { nome: 'Listar PDFs Pendentes', action: 'listarPDFsPendentes' }
  ];

  let sucessos = 0;
  let falhas = 0;

  for (const teste of testes) {
    try {
      console.log(`🔄 Testando: ${teste.nome}...`);
      
      const params = new URLSearchParams({
        action: teste.action,
        ...teste.params
      });

      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });

      const resultado = await response.json();
      
      if (resultado.success) {
        console.log(`✅ ${teste.nome}: SUCESSO`);
        if (resultado.message) {
          console.log(`   📝 ${resultado.message}`);
        }
        sucessos++;
      } else {
        console.log(`❌ ${teste.nome}: FALHA`);
        console.log(`   🔍 Erro: ${resultado.error}`);
        falhas++;
      }
      
    } catch (error) {
      console.log(`❌ ${teste.nome}: ERRO DE CONEXÃO`);
      console.log(`   🔍 ${error.message}`);
      falhas++;
    }
    
    console.log(''); // Linha em branco
  }

  // Resumo final
  console.log('📊 RESUMO DOS TESTES');
  console.log('====================');
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
  console.log(`📈 Taxa de sucesso: ${((sucessos / (sucessos + falhas)) * 100).toFixed(1)}%`);

  if (falhas === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema pronto para produção.');
  } else {
    console.log('\n⚠️ Alguns testes falharam. Verifique a configuração do Google Apps Script.');
  }
}

// Executar testes
testarSistemaCompleto().catch(console.error);
