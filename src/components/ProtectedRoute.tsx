import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { InactivityManager } from '@/components/InactivityManager';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const [showFallback, setShowFallback] = useState(false);

  // Timeout adicional de segurança no ProtectedRoute
  useEffect(() => {
    if (isLoading) {
      const fallbackTimer = setTimeout(() => {
        console.warn('⚠️ ProtectedRoute: Timeout de segurança - redirecionando para login');
        setShowFallback(true);
      }, 15000); // 15 segundos máximo

      return () => clearTimeout(fallbackTimer);
    }
  }, [isLoading]);

  // Reset fallback quando não está mais loading
  useEffect(() => {
    if (!isLoading) {
      setShowFallback(false);
    }
  }, [isLoading]);

  // Se showFallback está ativo, redirecionar para login
  if (showFallback) {
    console.log('🔄 Redirecionamento de segurança ativado');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    // Log de debug para ajudar a identificar o problema
    if (import.meta.env.DEV) {
      console.log('🔄 ProtectedRoute: isLoading=true, aguardando autenticação...');
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <InactivityManager>
      {children}
    </InactivityManager>
  );
};

export default ProtectedRoute;