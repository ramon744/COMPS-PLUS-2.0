// Teste direto de autenticação com Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hivxzwvqzfelhbijiuzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhpdnh6d3ZxemZlbGhiaWppdXptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNDU1MjQsImV4cCI6MjA3MzkyMTUyNH0.5lU7K9ZJP-KE7668a4Guf3iiHhEHF-XjXQnhoz5bxfI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarAuth() {
  console.log('🔍 Testando autenticação direta...');
  
  try {
    // Teste 1: Verificar se consegue conectar
    console.log('📡 Testando conexão...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('📊 Sessão atual:', sessionData);
    console.log('❌ Erro sessão:', sessionError);
    
    // Teste 2: Tentar login
    console.log('🔐 Tentando login...');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'teste@comps.local',
      password: '123456'
    });
    
    console.log('✅ Login data:', loginData);
    console.log('❌ Login error:', loginError);
    
    if (loginError) {
      console.log('🔍 Detalhes do erro:');
      console.log('- Status:', loginError.status);
      console.log('- Message:', loginError.message);
      console.log('- Name:', loginError.name);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testarAuth();
