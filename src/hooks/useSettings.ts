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
  webhookInterval: number;
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
  webhookInterval: 2,
};

export function useSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<ConfigData>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Carregar configurações do banco de dados
  const loadSettings = useCallback(async () => {
    if (!user) {
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
        const userConfig = userSettings.config_value as any;
        // Criar uma cópia limpa para evitar referências circulares
        finalConfig = {
          ...finalConfig,
          emailsDestino: userConfig.emailsDestino || finalConfig.emailsDestino,
          horaCorte: userConfig.horaCorte || finalConfig.horaCorte,
          logoUrl: userConfig.logoUrl || finalConfig.logoUrl,
          textoEmailPadrao: userConfig.textoEmailPadrao || finalConfig.textoEmailPadrao,
          hapticFeedback: userConfig.hapticFeedback !== undefined ? userConfig.hapticFeedback : finalConfig.hapticFeedback,
          valorMaximoComp: userConfig.valorMaximoComp || finalConfig.valorMaximoComp,
          webhookUrl: userConfig.webhookUrl || finalConfig.webhookUrl,
          webhookAtivo: userConfig.webhookAtivo !== undefined ? userConfig.webhookAtivo : finalConfig.webhookAtivo,
          webhookInterval: userConfig.webhookInterval || finalConfig.webhookInterval
        };
      }

      // Aplicar configurações globais se existirem (sobrescrever webhook e emails)
      if (globalSettings && !globalError) {
        const globalConfig = globalSettings.config_value as any;
        finalConfig = {
          ...finalConfig,
          webhookUrl: globalConfig.webhookUrl || '',
          webhookAtivo: globalConfig.webhookAtivo || false,
          webhookInterval: globalConfig.webhookInterval || 2,
          emailsDestino: globalConfig.emailsDestino || defaultConfig.emailsDestino
        };
      } else if (globalError && globalError.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações globais:', globalError);
      }

      
      // Só atualizar se as configurações realmente mudaram
      setConfig(prevConfig => {
        // Criar cópias limpas para comparação
        const cleanPrevConfig = {
          emailsDestino: prevConfig.emailsDestino,
          horaCorte: prevConfig.horaCorte,
          logoUrl: prevConfig.logoUrl,
          textoEmailPadrao: prevConfig.textoEmailPadrao,
          hapticFeedback: prevConfig.hapticFeedback,
          valorMaximoComp: prevConfig.valorMaximoComp,
          webhookUrl: prevConfig.webhookUrl,
          webhookAtivo: prevConfig.webhookAtivo,
          webhookInterval: prevConfig.webhookInterval
        };
        
        const cleanFinalConfig = {
          emailsDestino: finalConfig.emailsDestino,
          horaCorte: finalConfig.horaCorte,
          logoUrl: finalConfig.logoUrl,
          textoEmailPadrao: finalConfig.textoEmailPadrao,
          hapticFeedback: finalConfig.hapticFeedback,
          valorMaximoComp: finalConfig.valorMaximoComp,
          webhookUrl: finalConfig.webhookUrl,
          webhookAtivo: finalConfig.webhookAtivo,
          webhookInterval: finalConfig.webhookInterval
        };
        
        if (JSON.stringify(cleanPrevConfig) !== JSON.stringify(cleanFinalConfig)) {
          return finalConfig;
        }
        return prevConfig;
      });
      
      // Atualizar localStorage com as configurações finais (cópia limpa)
      const cleanFinalConfig = {
        emailsDestino: finalConfig.emailsDestino,
        horaCorte: finalConfig.horaCorte,
        logoUrl: finalConfig.logoUrl,
        textoEmailPadrao: finalConfig.textoEmailPadrao,
        hapticFeedback: finalConfig.hapticFeedback,
        valorMaximoComp: finalConfig.valorMaximoComp,
        webhookUrl: finalConfig.webhookUrl,
        webhookAtivo: finalConfig.webhookAtivo,
        webhookInterval: finalConfig.webhookInterval
      };
      
      localStorage.setItem('app-settings', JSON.stringify(cleanFinalConfig));
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
  }, [user, toast]);

  // Função interna para salvar sem dependência circular
  const saveSettingsInternal = useCallback(async (newConfig: ConfigData, showToast = true) => {
    if (!user) {
      console.error('❌ Usuário não autenticado:', { user });
      if (showToast) {
        toast({
          title: "Erro de autenticação",
          description: "Usuário não está autenticado.",
          variant: "destructive",
        });
      }
      return;
    }


    try {
      setIsSaving(true);
      // Separar configurações pessoais das globais
      const { webhookUrl, webhookAtivo, webhookInterval, emailsDestino, ...personalConfig } = newConfig;
      
      // Garantir que personalConfig tenha emailsDestino
      const personalConfigWithEmails = {
        emailsDestino: (personalConfig as any).emailsDestino || defaultConfig.emailsDestino,
        horaCorte: personalConfig.horaCorte || defaultConfig.horaCorte,
        logoUrl: personalConfig.logoUrl || defaultConfig.logoUrl,
        textoEmailPadrao: personalConfig.textoEmailPadrao || defaultConfig.textoEmailPadrao,
        hapticFeedback: personalConfig.hapticFeedback !== undefined ? personalConfig.hapticFeedback : defaultConfig.hapticFeedback,
        valorMaximoComp: personalConfig.valorMaximoComp || defaultConfig.valorMaximoComp
      };
      
      // Salvar configurações globais (webhook e emails) - garantir valores não undefined
      const globalConfigData = {
        webhookUrl: webhookUrl || '',
        webhookAtivo: webhookAtivo || false,
        webhookInterval: webhookInterval || 2,
        emailsDestino: emailsDestino || defaultConfig.emailsDestino
      };

      console.log('🔍 DEBUG - globalConfigData antes da serialização:', globalConfigData);
      console.log('🔍 DEBUG - JSON.stringify(globalConfigData):', JSON.stringify(globalConfigData));

      // Tentar atualizar configurações globais com verificações de segurança
      try {
        
        const { error: globalUpdateError } = await supabase
          .from('global_settings')
          .update({
            config_value: JSON.parse(JSON.stringify(globalConfigData)),
            updated_by: user.id
          })
          .eq('config_key', 'global_webhook_settings');

        // Se não conseguiu fazer update global, fazer insert
        if (globalUpdateError?.code === 'PGRST116') {
          const { error: globalInsertError } = await supabase
            .from('global_settings')
            .insert({
              config_key: 'global_webhook_settings',
              config_value: JSON.parse(JSON.stringify(globalConfigData)),
              created_by: user.id,
              updated_by: user.id
            });

          if (globalInsertError) {
            console.error('❌ Erro ao inserir configurações globais:', globalInsertError);
            throw new Error(`Erro ao inserir configurações globais: ${globalInsertError.message}`);
          }
        } else if (globalUpdateError) {
          console.error('❌ Erro ao atualizar configurações globais:', globalUpdateError);
          throw new Error(`Erro ao atualizar configurações globais: ${globalUpdateError.message}`);
        }
      } catch (globalSaveError) {
        console.error('❌ Erro ao salvar configurações globais:', globalSaveError);
        throw new Error(`Erro ao salvar configurações globais: ${globalSaveError instanceof Error ? globalSaveError.message : 'Erro desconhecido'}`);
      }

      // Salvar configurações pessoais (incluindo webhook para compatibilidade)
      // Criar uma cópia limpa para evitar referências circulares
      const personalConfigWithWebhook = {
        emailsDestino: personalConfigWithEmails.emailsDestino,
        horaCorte: personalConfigWithEmails.horaCorte || defaultConfig.horaCorte,
        logoUrl: personalConfigWithEmails.logoUrl || defaultConfig.logoUrl,
        textoEmailPadrao: personalConfigWithEmails.textoEmailPadrao || defaultConfig.textoEmailPadrao,
        hapticFeedback: personalConfigWithEmails.hapticFeedback !== undefined ? personalConfigWithEmails.hapticFeedback : defaultConfig.hapticFeedback,
        valorMaximoComp: personalConfigWithEmails.valorMaximoComp || defaultConfig.valorMaximoComp,
        webhookUrl,
        webhookAtivo,
        webhookInterval
      };
      
      // Primeiro tenta fazer update das configurações pessoais
      const { error: updateError } = await supabase
        .from('settings')
        .update({
          config_value: JSON.parse(JSON.stringify(personalConfigWithWebhook)),
        })
        .eq('user_id', user.id)
        .eq('config_key', 'app_settings');

      // Se não conseguiu fazer update (registro não existe), faz insert
      if (updateError?.code === 'PGRST116') {
        const { error: insertError } = await supabase
          .from('settings')
          .insert({
            user_id: user.id,
            config_key: 'app_settings',
            config_value: JSON.parse(JSON.stringify(personalConfigWithWebhook)),
          });

        if (insertError) {
          console.error('❌ Erro ao inserir configurações pessoais:', insertError);
          throw new Error(`Erro ao inserir configurações pessoais: ${insertError.message}`);
        }
      } else if (updateError) {
        console.error('❌ Erro ao atualizar configurações pessoais:', updateError);
        throw new Error(`Erro ao atualizar configurações pessoais: ${updateError.message}`);
      }

      setConfig(newConfig);

      // Manter compatibilidade com localStorage para componentes que ainda usam
      // Criar uma cópia limpa para evitar referências circulares
      const cleanConfig = {
        emailsDestino: newConfig.emailsDestino,
        horaCorte: newConfig.horaCorte,
        logoUrl: newConfig.logoUrl,
        textoEmailPadrao: newConfig.textoEmailPadrao,
        hapticFeedback: newConfig.hapticFeedback,
        valorMaximoComp: newConfig.valorMaximoComp,
        webhookUrl: newConfig.webhookUrl,
        webhookAtivo: newConfig.webhookAtivo,
        webhookInterval: newConfig.webhookInterval
      };
      
      localStorage.setItem('app-settings', JSON.stringify(cleanConfig));

      if (showToast) {
        toast({
          title: "Configurações salvas",
          description: "Suas configurações foram atualizadas com sucesso.",
        });
      }
    } catch (error) {
      console.error('❌ Erro ao salvar configurações:', error);
      if (showToast) {
        toast({
          title: "Erro ao salvar",
          description: error instanceof Error ? error.message : "Não foi possível salvar as configurações.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  }, [user, toast]);

  // Salvar configurações no banco de dados
  const saveSettings = useCallback(async (newConfig: ConfigData) => {
    await saveSettingsInternal(newConfig, true);
  }, [saveSettingsInternal]);

  // Carregar configurações quando o usuário está autenticado
  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]); // Removido loadSettings da dependência para evitar loop

  // Real-time subscription para mudanças nas configurações
  useEffect(() => {
    if (!user) return;

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
  }, [user]); // Removido loadSettings da dependência para evitar loop

  return {
    config,
    setConfig,
    saveSettings,
    isLoading,
    isSaving,
  };
}