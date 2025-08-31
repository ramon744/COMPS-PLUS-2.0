import { useState, useCallback } from 'react';

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export function useErrorBoundary() {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorInfo: null
  });

  const handleError = useCallback((error: Error, errorInfo?: any) => {
    console.error('🚨 Erro capturado pelo Error Boundary:', error, errorInfo);
    
    setErrorState({
      hasError: true,
      error,
      errorInfo
    });

    // Log do erro para monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Aqui você pode enviar o erro para um serviço de monitoramento
      // como Sentry, LogRocket, etc.
      console.log('📊 Enviando erro para monitoramento...');
    }
  }, []);

  const resetError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  }, []);

  const clearError = useCallback(() => {
    resetError();
    // Opcional: recarregar a página
    window.location.reload();
  }, [resetError]);

  return {
    ...errorState,
    handleError,
    resetError,
    clearError
  };
}

// Hook para capturar erros de componentes
export function useErrorHandler() {
  const handleError = useCallback((error: Error, context?: string) => {
    console.error(`🚨 Erro em ${context || 'componente'}:`, error);
    
    // Aqui você pode implementar lógica adicional
    // como mostrar toast de erro, enviar para monitoramento, etc.
    
    return error;
  }, []);

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<{ data: T | null; error: Error | null }> => {
    try {
      const data = await asyncFn();
      return { data, error: null };
    } catch (error) {
      const handledError = handleError(error as Error, context);
      return { data: null, error: handledError };
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
}
