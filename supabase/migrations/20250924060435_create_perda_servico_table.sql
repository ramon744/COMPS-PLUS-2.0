-- Criar tabela para registro de perda de serviço
CREATE TABLE IF NOT EXISTS perda_servico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  atendente_nome TEXT NOT NULL,
  numero_mesa TEXT NOT NULL,
  motivo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_perda_servico_user_id ON perda_servico(user_id);
CREATE INDEX IF NOT EXISTS idx_perda_servico_created_at ON perda_servico(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perda_servico_atendente ON perda_servico(atendente_nome);
CREATE INDEX IF NOT EXISTS idx_perda_servico_mesa ON perda_servico(numero_mesa);

-- RLS (Row Level Security)
ALTER TABLE perda_servico ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver seus próprios registros
CREATE POLICY "Users can view their own perda_servico" ON perda_servico
  FOR SELECT USING (auth.uid() = user_id);

-- Política: usuários podem inserir seus próprios registros
CREATE POLICY "Users can insert their own perda_servico" ON perda_servico
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem atualizar seus próprios registros
CREATE POLICY "Users can update their own perda_servico" ON perda_servico
  FOR UPDATE USING (auth.uid() = user_id);

-- Política: usuários podem deletar seus próprios registros
CREATE POLICY "Users can delete their own perda_servico" ON perda_servico
  FOR DELETE USING (auth.uid() = user_id);

-- Política: sistema pode inserir registros para qualquer usuário
CREATE POLICY "System can insert perda_servico" ON perda_servico
  FOR INSERT WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_perda_servico_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_perda_servico_updated_at
  BEFORE UPDATE ON perda_servico
  FOR EACH ROW
  EXECUTE FUNCTION update_perda_servico_updated_at();

-- Comentários da tabela
COMMENT ON TABLE perda_servico IS 'Registros de perda de serviço dos atendentes';
COMMENT ON COLUMN perda_servico.atendente_nome IS 'Nome do atendente que perdeu o serviço';
COMMENT ON COLUMN perda_servico.numero_mesa IS 'Número da mesa (aceita letras e números, ex: V91)';
COMMENT ON COLUMN perda_servico.motivo IS 'Motivo da perda de serviço';

