import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, ArrowLeft, LogOut, Home, Settings } from 'lucide-react';

interface ErrorFallbackProps {
  error: string;
  title?: string;
  description?: string;
  showRetry?: boolean;
  showBackToLogin?: boolean;
  showClearData?: boolean;
  onRetry?: () => void;
}

export function ErrorFallback({
  error,
  title = 'Erro do Sistema',
  description = 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.',
  showRetry = true,
  showBackToLogin = true,
  showClearData = false,
  onRetry
}: ErrorFallbackProps) {

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleBackToLogin = () => {
    // Limpar dados locais
    localStorage.clear();
    sessionStorage.clear();
    
    // Recarregar página para ir ao login
    window.location.href = '/login';
  };

  const handleClearData = () => {
    // Limpar dados locais
    localStorage.clear();
    sessionStorage.clear();
    
    // Recarregar página para ir ao login
    window.location.href = '/login';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoSettings = () => {
    window.location.href = '/settings';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-red-600">{title}</CardTitle>
          <CardDescription className="text-sm">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Botão Tentar Novamente */}
          {showRetry && (
            <Button 
              onClick={handleRetry}
              className="w-full"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
          
          {/* Botão Ir para Home */}
          <Button 
            onClick={handleGoHome}
            className="w-full"
            variant="outline"
          >
            <Home className="mr-2 h-4 w-4" />
            Ir para Dashboard
          </Button>

          {/* Botão Configurações */}
          <Button 
            onClick={handleGoSettings}
            className="w-full"
            variant="outline"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
          
          {/* Botão Voltar ao Login */}
          {showBackToLogin && (
            <Button 
              onClick={handleBackToLogin}
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Login
            </Button>
          )}

          {/* Botão Limpar Dados */}
          {showClearData && (
            <Button 
              onClick={handleClearData}
              className="w-full"
              variant="destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Limpar Dados e Voltar ao Login
            </Button>
          )}

          {/* Informações de debug */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            <p className="mb-1">Erro: {error}</p>
            <p>Timestamp: {new Date().toLocaleString('pt-BR')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
