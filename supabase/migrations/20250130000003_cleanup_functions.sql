-- Função para limpar notificações do dia anterior
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_operational_day date;
    yesterday_operational_day date;
BEGIN
    -- Obter o dia operacional atual (considerando que o dia começa às 5h)
    current_operational_day := CASE 
        WHEN EXTRACT(hour FROM NOW()) >= 5 THEN CURRENT_DATE
        ELSE CURRENT_DATE - INTERVAL '1 day'
    END;
    
    -- Calcular o dia operacional anterior
    yesterday_operational_day := current_operational_day - INTERVAL '1 day';
    
    -- Deletar notificações do dia operacional anterior
    DELETE FROM notifications 
    WHERE DATE(created_at) < current_operational_day;
    
    -- Log da operação
    RAISE NOTICE 'Notificações limpas. Dia operacional atual: %, Notificações anteriores a % foram removidas.', 
        current_operational_day, current_operational_day;
END;
$$;

-- Função para limpar PDFs antigos (mais de 72 horas)
CREATE OR REPLACE FUNCTION cleanup_old_pdfs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cutoff_time timestamp;
    deleted_count integer := 0;
BEGIN
    -- Calcular timestamp de 72 horas atrás
    cutoff_time := NOW() - INTERVAL '72 hours';
    
    -- Deletar registros de fechamento antigos (que também removem os PDFs do storage)
    DELETE FROM closings 
    WHERE created_at < cutoff_time;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da operação
    RAISE NOTICE 'PDFs antigos limpos. % registros de fechamento removidos (anteriores a %)', 
        deleted_count, cutoff_time;
END;
$$;

-- Função combinada para limpeza geral
CREATE OR REPLACE FUNCTION cleanup_system_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notifications_deleted integer := 0;
    closings_deleted integer := 0;
    result json;
BEGIN
    -- Limpar notificações antigas
    PERFORM cleanup_old_notifications();
    
    -- Contar notificações deletadas
    SELECT COUNT(*) INTO notifications_deleted 
    FROM notifications 
    WHERE created_at < (CASE 
        WHEN EXTRACT(hour FROM NOW()) >= 5 THEN CURRENT_DATE
        ELSE CURRENT_DATE - INTERVAL '1 day'
    END);
    
    -- Limpar PDFs antigos
    PERFORM cleanup_old_pdfs();
    
    -- Contar fechamentos deletados
    SELECT COUNT(*) INTO closings_deleted 
    FROM closings 
    WHERE created_at < (NOW() - INTERVAL '72 hours');
    
    -- Retornar resultado
    result := json_build_object(
        'success', true,
        'notifications_deleted', notifications_deleted,
        'closings_deleted', closings_deleted,
        'cleanup_time', NOW(),
        'message', 'Limpeza do sistema executada com sucesso'
    );
    
    RETURN result;
END;
$$;

-- Criar política para permitir execução das funções de limpeza
CREATE POLICY "System can execute cleanup functions" ON notifications
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "System can execute cleanup functions" ON closings
FOR ALL
TO authenticated
USING (true);

-- Comentários das funções
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Remove notificações do dia operacional anterior (reset às 5h)';
COMMENT ON FUNCTION cleanup_old_pdfs() IS 'Remove PDFs e fechamentos com mais de 72 horas';
COMMENT ON FUNCTION cleanup_system_data() IS 'Executa limpeza completa do sistema (notificações + PDFs)';
