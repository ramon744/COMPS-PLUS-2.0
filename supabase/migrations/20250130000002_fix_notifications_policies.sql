-- Corrigir políticas RLS para notificações
-- Esta migração corrige possíveis problemas com as políticas de notificações

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- Recriar políticas com permissões corretas
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para permitir inserção de notificações pelo sistema (N8N)
-- Esta política permite que o sistema insira notificações para qualquer usuário
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Política para permitir que usuários insiram suas próprias notificações (para testes)
CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários deletem suas próprias notificações
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Verificar se a função notify_pdf_ready existe e está funcionando
-- Se não existir, recriar
CREATE OR REPLACE FUNCTION notify_pdf_ready(
  p_closing_id UUID,
  p_pdf_url TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_closing closings%ROWTYPE;
  v_users UUID[];
  v_user_id UUID;
BEGIN
  -- Buscar dados do fechamento
  SELECT * INTO v_closing FROM closings WHERE id = p_closing_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fechamento não encontrado: %', p_closing_id;
  END IF;
  
  -- Buscar todos os usuários que têm permissão para ver notificações
  -- Por enquanto, vamos notificar todos os usuários autenticados
  -- Em uma implementação mais robusta, você filtraria por permissões específicas
  SELECT ARRAY_AGG(id) INTO v_users FROM auth.users WHERE email_confirmed_at IS NOT NULL;
  
  -- Se não houver usuários, criar notificação para um usuário padrão
  IF v_users IS NULL OR array_length(v_users, 1) = 0 THEN
    v_users := ARRAY['4728cc7d-d9c0-4f37-8eff-d3d1b511ca85'::UUID];
  END IF;
  
  -- Criar notificação para cada usuário
  FOREACH v_user_id IN ARRAY v_users LOOP
    INSERT INTO notifications (
      user_id,
      closing_id,
      title,
      message,
      type,
      pdf_url
    ) VALUES (
      v_user_id,
      p_closing_id,
      'PDF do Relatório Disponível',
      'O relatório do dia operacional ' || v_closing.dia_operacional || ' está pronto para visualização.',
      'pdf_ready',
      p_pdf_url
    );
  END LOOP;
  
  -- Log para debug
  RAISE NOTICE 'Notificações criadas para % usuários', array_length(v_users, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar se a função notify_processing_error existe e está funcionando
CREATE OR REPLACE FUNCTION notify_processing_error(
  p_closing_id UUID,
  p_error_message TEXT
) RETURNS VOID AS $$
DECLARE
  v_closing closings%ROWTYPE;
  v_users UUID[];
  v_user_id UUID;
BEGIN
  -- Buscar dados do fechamento
  SELECT * INTO v_closing FROM closings WHERE id = p_closing_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Fechamento não encontrado: %', p_closing_id;
  END IF;
  
  -- Buscar todos os usuários
  SELECT ARRAY_AGG(id) INTO v_users FROM auth.users WHERE email_confirmed_at IS NOT NULL;
  
  -- Se não houver usuários, criar notificação para um usuário padrão
  IF v_users IS NULL OR array_length(v_users, 1) = 0 THEN
    v_users := ARRAY['4728cc7d-d9c0-4f37-8eff-d3d1b511ca85'::UUID];
  END IF;
  
  -- Criar notificação de erro para cada usuário
  FOREACH v_user_id IN ARRAY v_users LOOP
    INSERT INTO notifications (
      user_id,
      closing_id,
      title,
      message,
      type
    ) VALUES (
      v_user_id,
      p_closing_id,
      'Erro no Processamento do Relatório',
      'Houve um erro ao processar o relatório do dia ' || v_closing.dia_operacional || ': ' || p_error_message,
      'error'
    );
  END LOOP;
  
  -- Log para debug
  RAISE NOTICE 'Notificações de erro criadas para % usuários', array_length(v_users, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que a tabela notifications tenha todas as colunas necessárias
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS closing_id UUID REFERENCES closings(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS message TEXT NOT NULL,
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL CHECK (type IN ('pdf_ready', 'error', 'info')),
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Garantir que os índices existam
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_closing_id ON notifications(closing_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Garantir que RLS esteja habilitado
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
