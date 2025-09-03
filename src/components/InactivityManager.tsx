import React from 'react';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import { InactivityWarningModal } from '@/components/InactivityWarningModal';
import { useAuth } from '@/contexts/AuthContext';
import { getInactivityConfig } from '@/utils/inactivity-test';

interface InactivityManagerProps {
  children: React.ReactNode;
}

export function InactivityManager({ children }: InactivityManagerProps) {
  const { user } = useAuth();
  
  // Obter configuração baseada no ambiente (teste rápido em dev, produção em prod)
  const config = getInactivityConfig();
  
  const {
    isWarningVisible,
    remainingTime,
    extendSession
  } = useInactivityTimeout(config);

  // Só ativar para usuários autenticados
  if (!user) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      <InactivityWarningModal
        isOpen={isWarningVisible}
        remainingTime={remainingTime}
        onExtendSession={extendSession}
      />
    </>
  );
}
