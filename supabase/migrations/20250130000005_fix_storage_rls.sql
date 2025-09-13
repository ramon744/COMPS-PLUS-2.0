-- Corrigir políticas RLS do Supabase Storage para permitir uploads do N8N
-- Este arquivo corrige as políticas de segurança do storage para permitir uploads de PDFs

-- 1. Verificar se o bucket 'reports' existe
-- Se não existir, criar o bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Remover políticas existentes do bucket reports
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;

-- 3. Criar políticas corretas para o bucket reports
-- Política para permitir visualização pública de arquivos PDF
CREATE POLICY "Public can view PDF files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'reports' 
    AND name LIKE 'pdfs/%.pdf'
  );

-- Política para permitir upload de arquivos PDF (incluindo N8N)
CREATE POLICY "Allow PDF uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'reports' 
    AND name LIKE 'pdfs/relatorio_%.pdf'
  );

-- Política para permitir atualização de arquivos PDF
CREATE POLICY "Allow PDF updates" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'reports' 
    AND name LIKE 'pdfs/%.pdf'
  );

-- Política para permitir exclusão de arquivos PDF
CREATE POLICY "Allow PDF deletion" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'reports' 
    AND name LIKE 'pdfs/%.pdf'
  );

-- 4. Verificar se as políticas foram criadas corretamente
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

-- 5. Comentários explicativos
COMMENT ON POLICY "Public can view PDF files" ON storage.objects IS 'Permite visualização pública de arquivos PDF no bucket reports';
COMMENT ON POLICY "Allow PDF uploads" ON storage.objects IS 'Permite upload de arquivos PDF no formato relatorio_[uuid]_[timestamp].pdf';
COMMENT ON POLICY "Allow PDF updates" ON storage.objects IS 'Permite atualização de arquivos PDF existentes';
COMMENT ON POLICY "Allow PDF deletion" ON storage.objects IS 'Permite exclusão de arquivos PDF';
