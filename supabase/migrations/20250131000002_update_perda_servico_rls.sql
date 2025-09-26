-- Atualizar políticas RLS para perda_servico - permitir visualização para todos
-- Similar ao comportamento dos COMPs

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view their own perda_servico" ON perda_servico;
DROP POLICY IF EXISTS "Users can insert their own perda_servico" ON perda_servico;
DROP POLICY IF EXISTS "Users can update their own perda_servico" ON perda_servico;
DROP POLICY IF EXISTS "Users can delete their own perda_servico" ON perda_servico;
DROP POLICY IF EXISTS "System can insert perda_servico" ON perda_servico;

-- Nova política: todos os usuários autenticados podem ver todas as perdas
CREATE POLICY "Authenticated users can view all perda_servico" ON perda_servico
  FOR SELECT USING (auth.role() = 'authenticated');

-- Nova política: usuários autenticados podem inserir perdas
CREATE POLICY "Authenticated users can insert perda_servico" ON perda_servico
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Nova política: usuários autenticados podem atualizar perdas
CREATE POLICY "Authenticated users can update perda_servico" ON perda_servico
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Nova política: usuários autenticados podem deletar perdas
CREATE POLICY "Authenticated users can delete perda_servico" ON perda_servico
  FOR DELETE USING (auth.role() = 'authenticated');

-- Política adicional: sistema pode inserir registros (para webhooks, etc.)
CREATE POLICY "System can insert perda_servico" ON perda_servico
  FOR INSERT WITH CHECK (true);
