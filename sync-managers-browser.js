// Script para sincronizar gerentes via browser console
// Execute este código no console do navegador (F12) na página da aplicação

async function syncManagersWithProfiles() {
  try {
    console.log('🔄 Iniciando sincronização de gerentes...');
    
    // Importar o cliente Supabase (assumindo que está disponível globalmente)
    const { supabase } = window;
    
    if (!supabase) {
      console.error('❌ Cliente Supabase não encontrado');
      return;
    }
    
    // 1. Buscar todos os gerentes ativos
    const { data: managers, error: managersError } = await supabase
      .from('managers')
      .select('id, nome, usuario, ativo')
      .eq('ativo', true);
    
    if (managersError) {
      console.error('❌ Erro ao buscar gerentes:', managersError);
      return;
    }
    
    console.log(`📋 Encontrados ${managers.length} gerentes ativos`);
    
    // 2. Para cada gerente, atualizar ou criar perfil
    let syncedCount = 0;
    let createdCount = 0;
    let errorCount = 0;
    
    for (const manager of managers) {
      try {
        // Verificar se já existe um perfil para este gerente
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .eq('email', manager.usuario)
          .single();
        
        if (existingProfile) {
          // Atualizar perfil existente se o nome estiver diferente
          if (existingProfile.nome !== manager.nome) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ nome: manager.nome })
              .eq('email', manager.usuario);
            
            if (updateError) {
              console.error(`❌ Erro ao atualizar perfil de ${manager.nome}:`, updateError);
              errorCount++;
            } else {
              console.log(`✅ Perfil atualizado: ${existingProfile.nome} → ${manager.nome}`);
              syncedCount++;
            }
          } else {
            console.log(`✓ Perfil já sincronizado: ${manager.nome}`);
          }
        } else {
          // Criar novo perfil
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              nome: manager.nome,
              email: manager.usuario,
              role: 'manager'
            });
          
          if (insertError) {
            console.error(`❌ Erro ao criar perfil para ${manager.nome}:`, insertError);
            errorCount++;
          } else {
            console.log(`➕ Novo perfil criado: ${manager.nome}`);
            createdCount++;
          }
        }
      } catch (error) {
        console.error(`❌ Erro ao processar gerente ${manager.nome}:`, error);
        errorCount++;
      }
    }
    
    // 3. Relatório final
    console.log('\n📊 RELATÓRIO DE SINCRONIZAÇÃO:');
    console.log(`✅ Perfis atualizados: ${syncedCount}`);
    console.log(`➕ Perfis criados: ${createdCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📋 Total processado: ${managers.length}`);
    
    if (errorCount === 0) {
      console.log('🎉 SINCRONIZAÇÃO CONCLUÍDA COM SUCESSO!');
      
      // Recarregar a página para refletir as mudanças
      if (confirm('Sincronização concluída! Deseja recarregar a página para ver as mudanças?')) {
        window.location.reload();
      }
    } else {
      console.log('⚠️ Sincronização concluída com alguns erros. Verifique os logs acima.');
    }
    
  } catch (error) {
    console.error('❌ Erro geral na sincronização:', error);
  }
}

// Executar a sincronização
console.log('🚀 SCRIPT DE SINCRONIZAÇÃO DE GERENTES CARREGADO');
console.log('📝 Para executar, digite: syncManagersWithProfiles()');
console.log('');
console.log('⚠️  IMPORTANTE: Execute este script na página da aplicação (http://localhost:8080)');
console.log('   onde o cliente Supabase está disponível.');
console.log('');

// Auto-executar se estivermos na página correta
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('🔍 Detectada execução local. Aguardando confirmação...');
  if (confirm('Executar sincronização de gerentes agora?')) {
    syncManagersWithProfiles();
  }
}
