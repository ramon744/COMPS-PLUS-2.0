-- Corrigir foreign key da tabela manager_permissions para referenciar profiles.id
-- em vez de auth.users.id

-- Remover as foreign keys existentes
ALTER TABLE manager_permissions 
DROP CONSTRAINT IF EXISTS manager_permissions_manager_id_fkey;

ALTER TABLE manager_permissions 
DROP CONSTRAINT IF EXISTS manager_permissions_created_by_fkey;

ALTER TABLE manager_permissions 
DROP CONSTRAINT IF EXISTS manager_permissions_updated_by_fkey;

-- Adicionar as foreign keys corretas para profiles
ALTER TABLE manager_permissions 
ADD CONSTRAINT manager_permissions_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE manager_permissions 
ADD CONSTRAINT manager_permissions_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE manager_permissions 
ADD CONSTRAINT manager_permissions_updated_by_fkey 
FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;

-- Atualizar os dados existentes para usar profiles.id em vez de auth.users.id
-- Primeiro, vamos verificar se há dados para migrar
UPDATE manager_permissions 
SET manager_id = profiles.id
FROM profiles 
WHERE manager_permissions.manager_id = profiles.id::text::uuid;

-- Atualizar created_by e updated_by se necessário
UPDATE manager_permissions 
SET created_by = profiles.id
FROM profiles 
WHERE manager_permissions.created_by = profiles.id::text::uuid;

UPDATE manager_permissions 
SET updated_by = profiles.id
FROM profiles 
WHERE manager_permissions.updated_by = profiles.id::text::uuid;
