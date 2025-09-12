import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ConfigData {
  emailsDestino: string[];
  horaCorte: string;
  logoUrl: string;
  textoEmailPadrao: string;
  hapticFeedback: boolean;
  valorMaximoComp: number;
  webhookUrl: string;
  webhookAtivo: boolean;
}

const defaultConfig: ConfigData = {
  emailsDestino: ["proprietario@restaurante.com"],
  horaCorte: "05:00",
  logoUrl: "",
  textoEmailPadrao: "Segue em anexo o relatório de COMPs do dia operacional.",
  hapticFeedback: true,
  valorMaximoComp: 999999999,
  webhookUrl: "",
  webhookAtivo: false,
};

export function useSettings() {
  // Verificação de segurança para o contexto de auth
  let user = null;
  let authError = false;
  
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch (error) {
    console.warn('⚠️ useSettings: AuthContext não disponível, usando configurações padrão');
    authError = true;
  }
  
  const { toast } = useToast();
  const [config, setConfig] = useState<ConfigData>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configurações do banco de dados
  const loadSettings = useCallback(async () => {
    if (!user || authError) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Carregar configurações pessoais do usuário
      const { data: userSettings, error: userError } = await supabase
        .from('settings')
        .select('config_value')
        .eq('user_id', user.id)
        .eq('config_key', 'app_settings')
        .maybeSingle(); // Usar maybeSingle em vez de single para evitar erro 406

      // Carregar configurações globais (webhook e emails)
      let globalSettings = null;
      let globalError = null;
      
      try {
        const result = await supabase
          .from('global_settings')
          .select('config_value')
          .eq('config_key', 'global_webhook_settings')
          .single();
        globalSettings = result.data;
        globalError = result.error;
      } catch (error) {
        console.warn('Aviso: Erro ao carregar configurações globais:', error);
        globalError = error;
      }

      let finalConfig = { ...defaultConfig };

      // Aplicar configurações pessoais se existirem
      if (userSettings && !userError) {
        finalConfig = { ...finalConfig, ...(userSettings.config_value as ConfigData) };
        console.log('✅ Configurações pessoais carregadas para usuário:', user.id);
      } else if (userError) {
        console.warn('⚠️ Nenhuma configuração pessoal encontrada para usuário:', user.id, userError);
      } else {
        console.log('ℹ️ Usando configurações padrão para usuário:', user.id);
      }

      // Aplicar configurações globais se existirem (sobrescrever webhook e emails)
      if (globalSettings && !globalError) {
        const globalConfig = globalSettings.config_value as any;
        if (import.meta.env.DEV) {
          console.log('🌍 DEBUG - Configurações globais encontradas:', globalConfig);
        }
        finalConfig = {
          ...finalConfig,
          webhookUrl: globalConfig.webhookUrl || '',
          webhookAtivo: globalConfig.webhookAtivo || false,
          emailsDestino: globalConfig.emailsDestino || defaultConfig.emailsDestino
        };
        if (import.meta.env.DEV) {
          console.log('🌍 DEBUG - Config final após aplicar globais:', {
            webhookUrl: finalConfig.webhookUrl,
            webhookAtivo: finalConfig.webhookAtivo,
            emailsDestino: finalConfig.emailsDestino
          });
        }
      } else if (globalError && globalError.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações globais:', globalError);
      } else if (globalError?.code === 'PGRST116') {
        console.warn('⚠️ Configurações globais não encontradas, usando configurações pessoais ou padrão');
      }

      if (import.meta.env.DEV) {
        console.log('🔍 DEBUG - Configurações carregadas (pessoais + globais)');
        console.log('🔍 DEBUG - Config final completo:', finalConfig);
      }
      
      setConfig(finalConfig);
      
      // Atualizar localStorage com as configurações finais
      localStorage.setItem('app-settings', JSON.stringify(finalConfig));
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: "Usando configurações padrão.",
        variant: "destructive",
      });
      setConfig(defaultConfig);
    } finally {
      setIsLoading(false);
    }
  }, [user, authError, toast]);

  // Função interna para salvar sem dependência circular
  const saveSettingsInternal = useCallback(async (newConfig: ConfigData, showToast = true) => {
    if (!user || authError) return;

    if (import.meta.env.DEV) {
      console.log('🔍 DEBUG - Salvando configurações');
    }

    try {
      // Separar configurações pessoais das globais
      const { webhookUrl, webhookAtivo, emailsDestino, ...personalConfig } = newConfig;
      
      // Salvar configurações globais (webhook e emails)
      const globalConfigData = {
        webhookUrl,
        webhookAtivo,
        emailsDestino
      };

      // Tentar atualizar configurações globais com verificações de segurança
      try {
        const { error: globalUpdateError } = await supabase
          .from('global_settings')
          .update({
            config_value: globalConfigData as any,
            updated_by: user.id
          })
          .eq('config_key', 'global_webhook_settings');

        // Se não conseguiu fazer update global, fazer insert
        if (globalUpdateError?.code === 'PGRST116') {
          const { error: globalInsertError } = await supabase
            .from('global_settings')
            .insert({
              config_key: 'global_webhook_settings',
              config_value: globalConfigData as any,
              created_by: user.id,
              updated_by: user.id
            });

          if (globalInsertError) {
            console.error('Erro ao inserir configurações globais:', globalInsertError);
            // Não falhar completamente, apenas avisar
            console.warn('Continuando com salvamento das configurações pessoais...');
          }
        } else if (globalUpdateError) {
          console.error('Erro ao atualizar configurações globais:', globalUpdateError);
          // Não falhar completamente, apenas avisar
          console.warn('Continuando com salvamento das configurações pessoais...');
        }
      } catch (globalSaveError) {
        console.warn('Aviso: Erro ao salvar configurações globais:', globalSaveError);
        // Continuar com salvamento pessoal mesmo se global falhar
      }

      // Salvar configurações pessoais (incluindo webhook para compatibilidade)
      const personalConfigWithWebhook = { ...personalConfig, webhookUrl, webhookAtivo, emailsDestino };
      
      // Primeiro tenta fazer update das configurações pessoais
      const { error: updateError } = await supabase
        .from('settings')
        .update({
          config_value: personalConfigWithWebhook as any,
        })
        .eq('user_id', user.id)
        .eq('config_key', 'app_settings');

      if (import.meta.env.DEV) {
        console.log('📝 DEBUG - Resultado do update pessoal:', { updateError });
      }

      // Se não conseguiu fazer update (registro não existe), faz insert
      if (updateError?.code === 'PGRST116') {
        if (import.meta.env.DEV) {
          console.log('📝 DEBUG - Registro não existe, fazendo insert...');
        }
        const { error: insertError } = await supabase
          .from('settings')
          .insert({
            user_id: user.id,
            config_key: 'app_settings',
            config_value: personalConfigWithWebhook as any,
          });

        if (import.meta.env.DEV) {
          console.log('📝 DEBUG - Resultado do insert pessoal:', { insertError });
        }
        if (insertError) {
          console.error('Erro ao inserir configurações:', insertError);
          throw insertError;
        }
      } else if (updateError) {
        console.error('Erro ao atualizar configurações:', updateError);
        throw updateError;
      }

      setConfig(newConfig);

      // Manter compatibilidade com localStorage para componentes que ainda usam
      localStorage.setItem('app-settings', JSON.stringify(newConfig));

      if (import.meta.env.DEV) {
        console.log('✅ DEBUG - Configurações salvas com sucesso (pessoais + globais)');
      }

      if (showToast) {
        toast({
          title: "Configurações salvas",
          description: "Suas configurações foram atualizadas com sucesso.",
        });
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      if (showToast) {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar as configurações.",
          variant: "destructive",
        });
      }
    }
  }, [user, authError, toast]);

  // Salvar configurações no banco de dados
  const saveSettings = useCallback(async (newConfig: ConfigData) => {
    await saveSettingsInternal(newConfig, true);
  }, [saveSettingsInternal]);

  // Carregar configurações quando o usuário está autenticado
  useEffect(() => {
    if (user && !authError) {
      loadSettings();
    }
  }, [user, authError, loadSettings]);

  // Real-time subscription para mudanças nas configurações
  useEffect(() => {
    if (!user || authError) return;

    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'settings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).config_key === 'app_settings') {
            // Recarregar todas as configurações para combinar pessoais + globais
            loadSettings();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_settings',
          filter: `config_key=eq.global_webhook_settings`,
        },
        (payload) => {
          // Quando configurações globais mudam, recarregar tudo
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, authError, loadSettings]);

  return {
    config,
    setConfig,
    saveSettings,
    isLoading,
  };
}