import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ActiveManagerGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ActiveManagerGuard({ children, fallback }: ActiveManagerGuardProps) {
  const { user } = useAuth();

  // Se não há usuário, não renderizar nada (ProtectedRoute já cuida disso)
  if (!user) {
    return fallback || null;
  }

  // Assumir que usuário logado tem permissões (simplificado)
  return <>{children}</>;
}