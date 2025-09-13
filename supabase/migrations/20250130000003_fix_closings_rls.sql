-- Corrigir políticas RLS da tabela closings
-- Permitir inserção de fechamentos para usuários autenticados

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view closings" ON closings;
DROP POLICY IF EXISTS "Users can insert closings" ON closings;
DROP POLICY IF EXISTS "Users can update closings" ON closings;
DROP POLICY IF EXISTS "Users can delete closings" ON closings;

-- Criar políticas corretas
CREATE POLICY "Users can view closings" ON closings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert closings" ON closings
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update closings" ON closings
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete closings" ON closings
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Verificar se a função notify_pdf_ready existe e está funcionando
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
  SELECT ARRAY_AGG(id) INTO v_users FROM auth.users WHERE email_confirmed_at IS NOT NULL;
  
  -- Criar notificação para cada usuário
  FOREACH v_user_id IN ARRAY v_users LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      pdf_url,
      closing_id,
      read
    ) VALUES (
      v_user_id,
      'pdf_ready',
      'Relatório PDF Pronto',
      'O relatório do fechamento está disponível para visualização.',
      p_pdf_url,
      p_closing_id,
      false
    );
  END LOOP;
  
  RAISE NOTICE 'Notificações criadas para % usuários', array_length(v_users, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir que a função seja executada por usuários anônimos (para N8N)
GRANT EXECUTE ON FUNCTION notify_pdf_ready(UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION notify_pdf_ready(UUID, TEXT) TO authenticated;
