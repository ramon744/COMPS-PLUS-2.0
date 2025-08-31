import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ManagerStatus {
  isActive: boolean;
  isLoading: boolean;
  error: string | null;
  managerData: any | null;
}

export function useManagerStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<ManagerStatus>({
    isActive: false,
    isLoading: true,
    error: null,
    managerData: null
  });

  const checkManagerStatus = useCallback(async () => {
    if (!user?.email) {
      setStatus({
        isActive: false,
        isLoading: false,
        error: 'Usuário não autenticado',
        managerData: null
      });
      return;
    }

    try {
      console.log('🔍 Iniciando verificação de status para:', user?.email);
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      const { data: managerData, error } = await supabase
        .from('managers')
        .select('id, nome, ativo, tipo_acesso, ip_permitido')
        .eq('usuario', user?.email)
        .eq('ativo', true)
        .single();

      console.log('📊 Resultado da consulta:', { managerData, error });

      if (error) {
        console.log('❌ Erro na consulta:', error);
        
        // Tratar diferentes tipos de erro
        let errorMessage = 'Erro ao verificar status';
        if (error.code === 'PGRST116') {
          errorMessage = 'Gerente não encontrado';
        } else if (error.code === 'PGRST116') {
          errorMessage = 'Gerente não encontrado';
        } else if (error.message) {
          errorMessage = error.message;
        }

        setStatus({
          isActive: false,
          isLoading: false,
          error: errorMessage,
          managerData: null
        });
        return;
      }

      if (!managerData) {
        console.log('❌ Gerente não encontrado ou inativo:', user?.email);
        setStatus({
          isActive: false,
          isLoading: false,
          error: 'Gerente não encontrado ou inativo',
          managerData: null
        });
        return;
      }

      console.log('✅ Gerente ativo encontrado:', managerData);
      setStatus({
        isActive: true,
        isLoading: false,
        error: null,
        managerData
      });
    } catch (error) {
      console.error('💥 Erro ao verificar status do gerente:', error);
      
      let errorMessage = 'Erro ao verificar status';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setStatus({
        isActive: false,
        isLoading: false,
        error: errorMessage,
        managerData: null
      });
    }
  }, [user?.email]);

  // Verificar status quando o usuário mudar
  useEffect(() => {
    if (user?.email) {
      checkManagerStatus();
    } else {
      setStatus({
        isActive: false,
        isLoading: false,
        error: 'Usuário não autenticado',
        managerData: null
      });
    }
  }, [user?.email, checkManagerStatus]);

  // Função para refresh manual
  const refreshStatus = useCallback(async () => {
    console.log('🔄 Refresh manual solicitado');
    await checkManagerStatus();
  }, [checkManagerStatus]);

  // Função para resetar status
  const resetStatus = useCallback(() => {
    console.log('🔄 Resetando status');
    setStatus({
      isActive: false,
      isLoading: true,
      error: null,
      managerData: null
    });
  }, []);

  return {
    ...status,
    refreshStatus,
    resetStatus,
    checkManagerStatus
  };
}
