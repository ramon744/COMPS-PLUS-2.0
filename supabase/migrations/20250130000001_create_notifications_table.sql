-- Criar tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  closing_id UUID REFERENCES closings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf_ready', 'error', 'info')),
  read BOOLEAN DEFAULT FALSE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_closing_id ON notifications(closing_id);

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver suas próprias notificações
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários podem atualizar suas próprias notificações
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: sistema pode inserir notificações para qualquer usuário
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Função para notificar quando PDF está pronto
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para notificar erro no processamento
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
