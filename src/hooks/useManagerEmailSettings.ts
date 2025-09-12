import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ManagerEmailSettings {
  id: string;
  manager_id: string;
  texto_padrao: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useManagerEmailSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ManagerEmailSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar configurações do gerente logado
  const loadSettings = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('manager_email_settings')
        .select('*')
        .eq('manager_id', user.id)
        .eq('ativo', true)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw fetchError;
      }

      setSettings(data);
    } catch (err) {
      console.error('Erro ao carregar configurações de email:', err);
      setError('Erro ao carregar configurações de email');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Salvar configurações
  const saveSettings = useCallback(async (newSettings: Partial<ManagerEmailSettings>) => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Se já existe configuração, atualizar
      if (settings?.id) {
        const { error: updateError } = await supabase
          .from('manager_email_settings')
          .update({
            ...newSettings,
            updated_at: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', settings.id);

        if (updateError) throw updateError;
      } else {
        // Se não existe, criar nova
        const { error: insertError } = await supabase
          .from('manager_email_settings')
          .insert({
            manager_id: user.id,
            texto_padrao: newSettings.texto_padrao || 'Relatório de fechamento do dia operacional {data_operacional}',
            ativo: true,
            created_by: user.id,
            updated_by: user.id
          });

        if (insertError) throw insertError;
      }

      // Recarregar configurações
      await loadSettings();
      return true;
    } catch (err) {
      console.error('Erro ao salvar configurações de email:', err);
      setError('Erro ao salvar configurações de email');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, settings?.id, loadSettings]);

  // Carregar configurações quando o usuário estiver autenticado
  useEffect(() => {
    if (user?.id) {
      loadSettings();
    }
  }, [user?.id, loadSettings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    saveSettings,
    refreshSettings: loadSettings
  };
}
