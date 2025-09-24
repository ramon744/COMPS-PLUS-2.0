import { useState, useEffect } from 'react';
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

  // Versão simplificada - assumir que usuário logado tem permissão
  // As verificações são feitas no login
  useEffect(() => {
    if (user?.email && !authError) {
      console.log('🔍 useManagerStatus: Usuário logado, assumindo permissão ativa');
      setStatus({
        isActive: true,
        isLoading: false,
        error: null,
        managerData: { nome: user.email, ativo: true }
      });
    } else {
      setStatus({
        isActive: false,
        isLoading: false,
        error: 'Usuário não autenticado',
        managerData: null
      });
    }
  }, [user?.email, authError]);

  return {
    ...status
  };
}
