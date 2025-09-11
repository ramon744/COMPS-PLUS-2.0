// Teste simples para verificar se as notificações estão funcionando
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mywxfyfzonzsnfplyogv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im15d3hmeWZ6b25ac25mcGx5b2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzQ0MDAsImV4cCI6MjA1MTI1MDQwMH0.8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q8Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNotification() {
  try {
    // Inserir notificação de teste
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: '4728cc7d-d9c0-4f37-8eff-d3d1b511ca85', // ID do usuário de teste
        closing_id: null,
        title: 'Teste de Notificação',
        message: 'Esta é uma notificação de teste para verificar se o sistema está funcionando.',
        type: 'info',
        pdf_url: null
      })
      .select();

    if (error) {
      console.error('Erro ao inserir notificação:', error);
    } else {
      console.log('Notificação inserida com sucesso:', data);
    }
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testNotification();
