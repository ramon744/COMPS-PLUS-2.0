-- Migrar configurações de webhook existentes para configurações globais
-- Esta migração pega a primeira configuração de webhook encontrada e a torna global

DO $$
DECLARE
    webhook_config JSONB;
    first_user_id UUID;
BEGIN
    -- Procurar a primeira configuração de webhook ativa
    SELECT 
        s.user_id,
        s.config_value
    INTO first_user_id, webhook_config
    FROM public.settings s
    WHERE s.config_key = 'app_settings'
    AND (s.config_value->>'webhookAtivo')::boolean = true
    AND s.config_value->>'webhookUrl' IS NOT NULL
    AND s.config_value->>'webhookUrl' != ''
    LIMIT 1;

    -- Se encontrou configuração de webhook ativa, migrar para global
    IF webhook_config IS NOT NULL THEN
        -- Extrair apenas as configurações relacionadas ao webhook
        INSERT INTO public.global_settings (
            config_key,
            config_value,
            created_by,
            updated_by
        )
        VALUES (
            'global_webhook_settings',
            jsonb_build_object(
                'webhookUrl', webhook_config->>'webhookUrl',
                'webhookAtivo', (webhook_config->>'webhookAtivo')::boolean,
                'emailsDestino', COALESCE(webhook_config->'emailsDestino', '["proprietario@restaurante.com"]'::jsonb)
            ),
            first_user_id,
            first_user_id
        )
        ON CONFLICT (config_key) 
        DO UPDATE SET
            config_value = EXCLUDED.config_value,
            updated_by = EXCLUDED.updated_by,
            updated_at = now();
            
        RAISE NOTICE 'Configurações de webhook migradas para configurações globais';
    ELSE
        -- Se não há configuração de webhook, criar configuração padrão
        INSERT INTO public.global_settings (
            config_key,
            config_value,
            created_by,
            updated_by
        )
        VALUES (
            'global_webhook_settings',
            '{"webhookUrl": "", "webhookAtivo": false, "emailsDestino": ["proprietario@restaurante.com"]}'::jsonb,
            COALESCE((SELECT id FROM auth.users LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
            COALESCE((SELECT id FROM auth.users LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid)
        )
        ON CONFLICT (config_key) DO NOTHING;
        
        RAISE NOTICE 'Configuração padrão de webhook criada';
    END IF;
END $$;
