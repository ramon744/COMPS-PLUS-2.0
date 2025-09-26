import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ActiveManagerGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ActiveManagerGuard({ children, fallback }: ActiveManagerGuardProps) {
  const { user } = useAuth();

  // Versão simplificada - apenas verificar se há usuário logado
  // As permissões são verificadas no login
  if (!user) {
    return null;
  }

  // Se há usuário, permitir acesso
  return <>{children}</>;
}