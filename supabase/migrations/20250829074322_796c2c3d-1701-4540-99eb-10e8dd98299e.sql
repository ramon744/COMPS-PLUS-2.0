-- Remove a foreign key constraint que está causando problemas
-- A tabela managers deve ser independente da tabela profiles
ALTER TABLE public.managers DROP CONSTRAINT IF EXISTS fk_managers_profile;

-- Verificar se há dados existentes e limpar se necessário
DELETE FROM public.managers WHERE id NOT IN (SELECT id FROM auth.users);

-- A tabela managers agora funcionará independentemente