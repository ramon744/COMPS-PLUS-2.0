import React from 'react';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { InactivityWarningModal } from '@/components/InactivityWarningModal';
import { useAuth } from '@/contexts/AuthContext';
// import { getInactivityConfig } from '@/utils/inactivity-test'; // Removido - arquivo não existe mais

interface InactivityManagerProps {
  children: React.ReactNode;
}

export function InactivityManager({ children }: InactivityManagerProps) {
  // Versão desabilitada temporariamente para debug
  // O timer de inatividade pode estar causando logout
  return <>{children}</>;
}
