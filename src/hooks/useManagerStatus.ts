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
  // Verificação de segurança para o contexto de auth
  let user = null;
  let authError = false;
  
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch (error) {
    console.warn('⚠️ useManagerStatus: AuthContext não disponível');
    authError = true;
  }
  const [status, setStatus] = useState<ManagerStatus>({
    isActive: false,
    isLoading: true,
    error: null,
    managerData: null
  });

  const checkManagerStatus = useCallback(async () => {
    if (!user?.email || authError) {
      setStatus({
        isActive: false,
        isLoading: false,
        error: 'Usuário não autenticado',
        managerData: null
      });
      return;
    }

    try {
      if (import.meta.env.DEV) {
        console.log('🔍 Iniciando verificação de status para:', user?.email);
      }
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      // Timeout de 10 segundos para a consulta
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na consulta')), 10000);
      });

      const queryPromise = supabase
        .from('managers')
        .select('id, nome, ativo, tipo_acesso, ip_permitido')
        .eq('usuario', user?.email)
        .eq('ativo', true)
        .single();

      const { data: managerData, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

      if (import.meta.env.DEV) {
        console.log('📊 Resultado da consulta:', { managerData, error });
      }

      if (error) {
        if (import.meta.env.DEV) {
          console.log('❌ Erro na consulta:', error);
        }
        
        // Tratar diferentes tipos de erro
        let errorMessage = 'Erro ao verificar status';
        if (error.code === 'PGRST116') {
          errorMessage = 'Gerente não encontrado ou inativo';
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
        if (import.meta.env.DEV) {
          console.log('❌ Gerente não encontrado ou inativo:', user?.email);
        }
        setStatus({
          isActive: false,
          isLoading: false,
          error: 'Gerente não encontrado ou inativo',
          managerData: null
        });
        return;
      }

      if (import.meta.env.DEV) {
        console.log('✅ Gerente ativo encontrado:', managerData);
      }
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
  }, [user?.email, authError]);

  // Verificar status quando o usuário mudar
  useEffect(() => {
    if (user?.email && !authError) {
      checkManagerStatus();
    } else {
      setStatus({
        isActive: false,
        isLoading: false,
        error: 'Usuário não autenticado',
        managerData: null
      });
    }
  }, [user?.email, authError, checkManagerStatus]);

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
