-- Criar tabela para configurações globais compartilhadas
CREATE TABLE public.global_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso - todos os usuários autenticados podem ler
CREATE POLICY "Authenticated users can view global settings" 
ON public.global_settings 
FOR SELECT 
TO authenticated 
USING (true);

-- Apenas usuários autenticados podem inserir
CREATE POLICY "Authenticated users can create global settings" 
ON public.global_settings 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- Apenas usuários autenticados podem atualizar
CREATE POLICY "Authenticated users can update global settings" 
ON public.global_settings 
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (auth.uid() = updated_by);

-- Trigger para atualizar timestamp e updated_by
CREATE OR REPLACE FUNCTION update_global_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_global_settings_updated_at
BEFORE UPDATE ON public.global_settings
FOR EACH ROW
EXECUTE FUNCTION update_global_settings_updated_at();

-- Inserir configuração global padrão para webhook
INSERT INTO public.global_settings (config_key, config_value, created_by, updated_by)
VALUES (
  'global_webhook_settings',
  '{"webhookUrl": "", "webhookAtivo": false, "emailsDestino": ["proprietario@restaurante.com"]}'::jsonb,
  '00000000-0000-0000-0000-000000000000'::uuid, -- Será atualizado pelo primeiro usuário que modificar
  '00000000-0000-0000-0000-000000000000'::uuid
);
