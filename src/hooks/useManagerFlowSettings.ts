import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ManagerFlowSettings {
  id: string;
  manager_id: string;
  manter_tipo_selecionado: boolean;
  manter_waiter_selecionado: boolean;
  foco_apos_salvar: 'valor' | 'motivo';
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useManagerFlowSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ManagerFlowSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Forçar recarregamento

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
        .from('manager_flow_settings')
        .select('*')
        .eq('manager_id', user.id)
        .eq('ativo', true)
        .maybeSingle();

      if (fetchError) {
        console.error('❌ Erro ao carregar configurações:', fetchError);
        throw fetchError;
      }

      console.log('📥 Configurações carregadas:', data);
      setSettings(data);
    } catch (err) {
      console.error('Erro ao carregar configurações de fluxo:', err);
      setError('Erro ao carregar configurações de fluxo');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Salvar configurações
  const saveSettings = useCallback(async (newSettings: Partial<ManagerFlowSettings>) => {
    if (!user?.id) {
      setError('Usuário não autenticado');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Se já existe configuração, atualizar
      if (settings?.id) {
        console.log('🔄 Atualizando configurações existentes:', { settingsId: settings.id, newSettings });
        
        const { error: updateError } = await supabase
          .from('manager_flow_settings')
          .update({
            ...newSettings,
            updated_at: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', settings.id);

        if (updateError) {
          console.error('❌ Erro ao atualizar configurações:', updateError);
          throw updateError;
        }
        
        console.log('✅ Configurações atualizadas com sucesso');
      } else {
        // Se não existe, criar nova
        const { error: insertError } = await supabase
          .from('manager_flow_settings')
          .insert({
            manager_id: user.id,
            manter_tipo_selecionado: newSettings.manter_tipo_selecionado ?? true,
            manter_waiter_selecionado: newSettings.manter_waiter_selecionado ?? false,
            foco_apos_salvar: newSettings.foco_apos_salvar ?? 'valor',
            ativo: true,
            created_by: user.id,
            updated_by: user.id
          });

        if (insertError) throw insertError;
      }

      // Forçar recarregamento das configurações
      console.log('🔄 Forçando recarregamento das configurações...');
      setRefreshKey(prev => prev + 1);
      await loadSettings();
      console.log('✅ Configurações recarregadas após salvamento');
      return true;
    } catch (err) {
      console.error('Erro ao salvar configurações de fluxo:', err);
      setError('Erro ao salvar configurações de fluxo');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, settings?.id]); // Remover loadSettings da dependência

  // Carregar configurações quando o usuário estiver autenticado ou refreshKey mudar
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Hook: Carregando configurações para usuário:', user.id, 'refreshKey:', refreshKey);
      loadSettings();
    }
  }, [user?.id, refreshKey]); // Incluir refreshKey para forçar recarregamento

  // Forçar recarregamento quando settings mudarem
  useEffect(() => {
    console.log('🔄 Hook: Settings mudaram:', settings);
  }, [settings]);

  return {
    settings,
    isLoading,
    isSaving,
    error,
    saveSettings,
    refreshSettings: loadSettings
  };
}
