-- Criar trigger automático para notificar quando PDF for gerado
-- Este trigger detecta quando um arquivo é adicionado ao storage e chama notify_pdf_ready

-- Função para extrair closing_id do nome do arquivo
CREATE OR REPLACE FUNCTION extract_closing_id_from_filename(filename TEXT)
RETURNS UUID AS $$
DECLARE
  closing_id TEXT;
BEGIN
  -- Extrair closing_id do nome do arquivo
  -- Formato esperado: relatorio_[closing_id]_[timestamp].pdf
  -- Exemplo: relatorio_fde1beef-86d2-45e2-a30b-e24ce0a30304_1757738201343.pdf
  
  -- Usar regex para extrair o UUID do nome do arquivo
  SELECT (regexp_match(filename, 'relatorio_([a-f0-9-]{36})_'))[1] INTO closing_id;
  
  -- Se não conseguir extrair, retornar NULL
  IF closing_id IS NULL THEN
    RAISE WARNING 'Não foi possível extrair closing_id do arquivo: %', filename;
    RETURN NULL;
  END IF;
  
  RETURN closing_id::UUID;
END;
$$ LANGUAGE plpgsql;

-- Função para processar upload de PDF
CREATE OR REPLACE FUNCTION handle_pdf_upload()
RETURNS TRIGGER AS $$
DECLARE
  v_closing_id UUID;
  v_pdf_url TEXT;
  v_filename TEXT;
BEGIN
  -- Verificar se é um arquivo PDF na pasta reports/pdfs
  IF NEW.bucket_id = 'reports' AND NEW.name LIKE 'pdfs/relatorio_%.pdf' THEN
    -- Extrair closing_id do nome do arquivo
    v_filename := split_part(NEW.name, '/', 2); -- Remove 'pdfs/' do nome
    v_closing_id := extract_closing_id_from_filename(v_filename);
    
    -- Construir URL do PDF
    v_pdf_url := 'https://' || current_setting('app.settings.supabase_url') || '/storage/v1/object/public/' || NEW.bucket_id || '/' || NEW.name;
    
    -- Se conseguiu extrair o closing_id, chamar notify_pdf_ready
    IF v_closing_id IS NOT NULL THEN
      RAISE NOTICE 'PDF detectado: % - Closing ID: % - URL: %', v_filename, v_closing_id, v_pdf_url;
      
      -- Chamar a função notify_pdf_ready
      PERFORM notify_pdf_ready(v_closing_id, v_pdf_url);
      
      RAISE NOTICE 'Notificação enviada para closing_id: %', v_closing_id;
    ELSE
      RAISE WARNING 'Não foi possível processar PDF: % - closing_id não encontrado', v_filename;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para detectar uploads de PDF
DROP TRIGGER IF EXISTS pdf_upload_trigger ON storage.objects;
CREATE TRIGGER pdf_upload_trigger
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION handle_pdf_upload();

-- Configurar URL do Supabase (ajustar conforme necessário)
-- Esta configuração pode ser feita via SQL ou via variável de ambiente
-- ALTER SYSTEM SET app.settings.supabase_url = 'dplfodkrsaffzljmteub.supabase.co';

-- Função para testar o trigger manualmente
CREATE OR REPLACE FUNCTION test_pdf_trigger(filename TEXT, closing_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_pdf_url TEXT;
BEGIN
  v_pdf_url := 'https://dplfodkrsaffzljmteub.supabase.co/storage/v1/object/public/reports/' || filename;
  
  -- Simular o trigger chamando notify_pdf_ready
  PERFORM notify_pdf_ready(closing_id, v_pdf_url);
  
  RETURN 'Trigger testado com sucesso para: ' || filename;
END;
$$ LANGUAGE plpgsql;

-- Comentários explicativos
COMMENT ON FUNCTION extract_closing_id_from_filename(TEXT) IS 'Extrai o closing_id do nome do arquivo PDF';
COMMENT ON FUNCTION handle_pdf_upload() IS 'Processa uploads de PDF e chama notify_pdf_ready automaticamente';
COMMENT ON FUNCTION test_pdf_trigger(TEXT, UUID) IS 'Função para testar o trigger manualmente';
COMMENT ON TRIGGER pdf_upload_trigger ON storage.objects IS 'Trigger que detecta uploads de PDF e notifica automaticamente';
