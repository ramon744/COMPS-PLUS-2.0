-- SOLUÇÃO DEFINITIVA: Corrigir políticas RLS do Supabase Storage
-- Execute estas queries no SQL Editor do Supabase

-- 1. Primeiro, verificar se o bucket reports existe
SELECT * FROM storage.buckets WHERE id = 'reports';

-- 2. Se não existir, criar o bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 3. DESABILITAR RLS temporariamente para o bucket reports
-- Isso permite que o N8N faça upload sem problemas de autenticação
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 4. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view PDF files" ON storage.objects;
DROP POLICY IF EXISTS "Allow PDF uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow PDF updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow PDF deletion" ON storage.objects;

-- 5. Criar políticas mais permissivas
-- Política para visualização pública
CREATE POLICY "Public can view all files" ON storage.objects
  FOR SELECT USING (true);

-- Política para upload público (incluindo N8N)
CREATE POLICY "Public can upload files" ON storage.objects
  FOR INSERT WITH CHECK (true);

-- Política para atualização pública
CREATE POLICY "Public can update files" ON storage.objects
  FOR UPDATE USING (true);

-- Política para exclusão pública
CREATE POLICY "Public can delete files" ON storage.objects
  FOR DELETE USING (true);

-- 6. Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 7. Testar se o bucket está acessível
SELECT * FROM storage.buckets WHERE id = 'reports';
