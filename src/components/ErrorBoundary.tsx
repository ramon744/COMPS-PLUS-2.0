import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o state para que a próxima renderização mostre a UI de fallback
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Erro capturado pelo Error Boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Chamar callback de erro se fornecido
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log do erro para monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Aqui você pode enviar o erro para um serviço de monitoramento
      console.log('📊 Enviando erro para monitoramento...');
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReset = () => {
    // Limpar dados locais e recarregar
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Renderizar fallback customizado ou padrão
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <ErrorFallback
          error={this.state.error?.message || 'Erro desconhecido'}
          title="Erro do Sistema"
          description="Ocorreu um erro inesperado na aplicação. Tente novamente ou entre em contato com o suporte."
          showRetry={true}
          showBackToLogin={true}
          showClearData={true}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Hook para usar o ErrorBoundary em componentes funcionais
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
