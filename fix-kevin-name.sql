-- Script SQL para corrigir especificamente o nome do Kevin Cavalcante
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar o estado atual
SELECT 
  'ANTES DA CORREÇÃO' as status,
  p.email,
  p.nome as nome_profile,
  m.nome as nome_manager
FROM profiles p
JOIN managers m ON p.email = m.usuario
WHERE p.email = 'ramonflora2@gmail.com' OR m.usuario = 'ramonflora2@gmail.com';

-- 2. Corrigir o nome na tabela managers (remover espaços extras e corrigir)
UPDATE managers 
SET nome = 'Kevin Cavalcante'
WHERE usuario = 'ramonflora2@gmail.com' 
AND nome LIKE '%Kevin%';

-- 3. Sincronizar com a tabela profiles
UPDATE profiles 
SET nome = 'Kevin Cavalcante'
WHERE email = 'ramonflora2@gmail.com';

-- 4. Verificar o resultado
SELECT 
  'APÓS A CORREÇÃO' as status,
  p.email,
  p.nome as nome_profile,
  m.nome as nome_manager,
  CASE 
    WHEN p.nome = m.nome THEN '✅ SINCRONIZADO'
    ELSE '❌ AINDA DESATUALIZADO'
  END as resultado
FROM profiles p
JOIN managers m ON p.email = m.usuario
WHERE p.email = 'ramonflora2@gmail.com' OR m.usuario = 'ramonflora2@gmail.com';

-- 5. Verificar todos os gerentes para garantir que estão sincronizados
SELECT 
  p.email,
  p.nome as nome_profile,
  m.nome as nome_manager,
  CASE 
    WHEN p.nome = m.nome THEN '✅ OK'
    ELSE '⚠️ PRECISA SINCRONIZAR'
  END as status
FROM profiles p
JOIN managers m ON p.email = m.usuario
WHERE m.ativo = true
ORDER BY p.email;
