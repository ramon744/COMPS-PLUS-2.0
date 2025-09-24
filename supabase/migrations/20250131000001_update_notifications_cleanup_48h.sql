-- Atualizar função de limpeza para remover notificações após 48 horas
-- Esta migração modifica a lógica de limpeza para ser baseada em tempo (48h) 
-- em vez de dia operacional

-- Nova função para limpar notificações com mais de 48 horas
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cutoff_time timestamp;
    deleted_count integer := 0;
BEGIN
    -- Calcular timestamp de 48 horas atrás
    cutoff_time := NOW() - INTERVAL '48 hours';
    
    -- Deletar notificações com mais de 48 horas
    DELETE FROM notifications 
    WHERE created_at < cutoff_time;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da operação
    RAISE NOTICE 'Notificações com mais de 48 horas limpas. % notificações removidas (anteriores a %)', 
        deleted_count, cutoff_time;
END;
$$;

-- Atualizar função combinada para usar nova lógica de 48h
CREATE OR REPLACE FUNCTION cleanup_system_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notifications_deleted integer := 0;
    closings_deleted integer := 0;
    result json;
    cutoff_time timestamp;
BEGIN
    -- Calcular timestamp de 48 horas atrás para notificações
    cutoff_time := NOW() - INTERVAL '48 hours';
    
    -- Limpar notificações antigas (48h)
    PERFORM cleanup_old_notifications();
    
    -- Contar notificações deletadas
    SELECT COUNT(*) INTO notifications_deleted 
    FROM notifications 
    WHERE created_at < cutoff_time;
    
    -- Limpar PDFs antigos (72h - mantém por mais tempo)
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
        'message', 'Limpeza do sistema executada com sucesso (notificações: 48h, PDFs: 72h)'
    );
    
    RETURN result;
END;
$$;

-- Comentários atualizados
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Remove notificações com mais de 48 horas (limpeza automática)';
COMMENT ON FUNCTION cleanup_system_data() IS 'Executa limpeza completa do sistema (notificações: 48h, PDFs: 72h)';

-- Criar função específica para limpeza de notificações por tempo
CREATE OR REPLACE FUNCTION cleanup_notifications_by_time(hours_ago integer DEFAULT 48)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cutoff_time timestamp;
    deleted_count integer := 0;
    result json;
BEGIN
    -- Calcular timestamp baseado no parâmetro
    cutoff_time := NOW() - (hours_ago || ' hours')::INTERVAL;
    
    -- Deletar notificações antigas
    DELETE FROM notifications 
    WHERE created_at < cutoff_time;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Retornar resultado
    result := json_build_object(
        'success', true,
        'deleted_count', deleted_count,
        'cutoff_time', cutoff_time,
        'hours_ago', hours_ago,
        'message', 'Notificações limpas com sucesso'
    );
    
    RETURN result;
END;
$$;

COMMENT ON FUNCTION cleanup_notifications_by_time(integer) IS 'Remove notificações com mais de X horas (parâmetro configurável)';
