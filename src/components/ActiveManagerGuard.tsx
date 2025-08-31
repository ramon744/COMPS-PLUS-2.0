import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useManagerStatus } from '@/hooks/useManagerStatus';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield, LogOut, RefreshCw, ArrowLeft } from 'lucide-react';

interface ActiveManagerGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ActiveManagerGuard({ children, fallback }: ActiveManagerGuardProps) {
  const { user, signOut } = useAuth();
  const { isActive, isLoading, error, managerData, refreshStatus } = useManagerStatus();
  const [timeoutReached, setTimeoutReached] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const navigate = useNavigate();

  // Timeout de segurança - se demorar mais de 15 segundos, mostrar erro
  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.log('⏰ Timeout de segurança atingido');
        setTimeoutReached(true);
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Reset timeout quando tentar novamente
  React.useEffect(() => {
    if (!isLoading) {
      setTimeoutReached(false);
    }
  }, [isLoading]);

  // Se não há usuário autenticado, não renderizar nada
  if (!user) {
    return null;
  }

  // Se está carregando, mostrar loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium text-foreground">Verificando permissões...</p>
          <p className="text-sm text-muted-foreground mt-2">Aguarde um momento</p>
          {retryCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Tentativa {retryCount} de verificação
            </p>
          )}
        </div>
      </div>
    );
  }

  // Função para tentar novamente
  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    setTimeoutReached(false);
    await refreshStatus();
  };

  // Função para voltar ao login
  const handleBackToLogin = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Forçar navegação mesmo se o logout falhar
      navigate('/login');
    }
  };

  // Função para limpar dados e tentar novamente
  const handleClearAndRetry = async () => {
    try {
      // Limpar dados locais
      localStorage.clear();
      sessionStorage.clear();
      
      // Fazer logout
      await signOut();
      
      // Navegar para login
      navigate('/login');
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      navigate('/login');
    }
  };

  // Se há erro ou timeout, mostrar tela de erro
  if (error || timeoutReached) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="text-xl text-yellow-600">
              {timeoutReached ? 'Timeout de Conexão' : 'Erro de Conexão'}
            </CardTitle>
            <CardDescription>
              {timeoutReached 
                ? 'A verificação de permissões demorou muito. Verifique sua conexão.'
                : 'Não foi possível verificar suas permissões. Tente novamente.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Botão Tentar Novamente */}
            <Button 
              onClick={handleRetry}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
              {retryCount > 0 && ` (${retryCount})`}
            </Button>
            
            {/* Botão Voltar ao Login */}
            <Button 
              onClick={handleBackToLogin}
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Login
            </Button>

            {/* Botão Limpar Dados (apenas após várias tentativas) */}
            {retryCount >= 3 && (
              <Button 
                onClick={handleClearAndRetry}
                className="w-full"
                variant="destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Limpar Dados e Voltar ao Login
              </Button>
            )}

            {/* Informações adicionais */}
            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              <p>Usuário: {user.email}</p>
              <p>Tentativas: {retryCount}</p>
              {error && <p>Erro: {error}</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Se o gerente não está ativo, mostrar tela de acesso negado
  if (!isActive) {
    const defaultFallback = (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Acesso Negado</CardTitle>
            <CardDescription>
              Sua conta foi desativada ou você não tem permissão para acessar este sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-red-50 p-4">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Conta Bloqueada
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Entre em contato com o administrador do sistema para resolver esta situação.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p><strong>Usuário:</strong> {user.email}</p>
              <p><strong>Status:</strong> Inativo/Excluído</p>
            </div>

            <Button 
              onClick={handleBackToLogin}
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );

    return fallback || defaultFallback;
  }

  // Se o gerente está ativo, renderizar o conteúdo
  return <>{children}</>;
}


