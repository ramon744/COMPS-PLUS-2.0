import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ConfigData {
  emailsDestino: string[];
  horaCorte: string;
  logoUrl: string;
  textoEmailPadrao: string;
  manterTipoSelecionado: boolean;
  manterWaiterSelecionado: boolean;
  focoAposSalvar: "valor" | "motivo";
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
  manterTipoSelecionado: true,
  manterWaiterSelecionado: false,
  focoAposSalvar: "valor",
  hapticFeedback: true,
  valorMaximoComp: 999999999,
  webhookUrl: "",
  webhookAtivo: false,
};

export function useSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<ConfigData>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar configurações do banco de dados
  const loadSettings = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('config_value')
        .eq('user_id', user.id)
        .eq('config_key', 'app_settings')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar configurações:', error);
        throw error;
      }

      if (data) {
        setConfig(data.config_value as any as ConfigData);
      } else {
        // Se não existe configuração, usar padrão
        setConfig(defaultConfig);
      }
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
    if (!user) return;

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          user_id: user.id,
          config_key: 'app_settings',
          config_value: newConfig as any,
        });

      if (error) {
        console.error('Erro ao salvar configurações:', error);
        throw error;
      }

      setConfig(newConfig);

      // Manter compatibilidade com localStorage para componentes que ainda usam
      localStorage.setItem('app-settings', JSON.stringify(newConfig));

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
  }, [user, loadSettings]);

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
            setConfig((payload.new as any).config_value as ConfigData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    config,
    setConfig,
    saveSettings,
    isLoading,
  };
}