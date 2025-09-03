-- Script SQL para sincronizar nomes dos gerentes entre tabelas managers e profiles
-- Execute este script diretamente no Supabase para corrigir os nomes desatualizados

-- Atualizar a tabela profiles com os nomes corretos da tabela managers
UPDATE profiles 
SET nome = managers.nome
FROM managers 
WHERE profiles.email = managers.usuario 
AND profiles.nome != managers.nome;

-- Verificar quantos registros foram atualizados
SELECT 
  p.email,
  p.nome as nome_profile_antigo,
  m.nome as nome_manager_atual,
  CASE 
    WHEN p.nome != m.nome THEN 'PRECISA ATUALIZAR'
    ELSE 'SINCRONIZADO'
  END as status
FROM profiles p
JOIN managers m ON p.email = m.usuario
ORDER BY p.email;

-- Inserir perfis para gerentes que não têm perfil ainda
INSERT INTO profiles (id, nome, email, role, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  m.nome,
  m.usuario,
  'manager',
  NOW(),
  NOW()
FROM managers m
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.email = m.usuario
)
AND m.ativo = true;

-- Verificação final
SELECT 
  'TOTAL GERENTES' as tipo,
  COUNT(*) as quantidade
FROM managers
WHERE ativo = true

UNION ALL

SELECT 
  'TOTAL PROFILES DE GERENTES' as tipo,
  COUNT(*) as quantidade
FROM profiles p
JOIN managers m ON p.email = m.usuario
WHERE m.ativo = true

UNION ALL

SELECT 
  'GERENTES SINCRONIZADOS' as tipo,
  COUNT(*) as quantidade
FROM profiles p
JOIN managers m ON p.email = m.usuario
WHERE p.nome = m.nome AND m.ativo = true

UNION ALL

SELECT 
  'GERENTES DESATUALIZADOS' as tipo,
  COUNT(*) as quantidade
FROM profiles p
JOIN managers m ON p.email = m.usuario
WHERE p.nome != m.nome AND m.ativo = true;
