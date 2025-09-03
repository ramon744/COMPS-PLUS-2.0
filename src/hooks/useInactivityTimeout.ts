import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface InactivityTimeoutOptions {
  timeout: number; // em milissegundos
  warningTime: number; // tempo de aviso antes do logout (em milissegundos)
  events: string[]; // eventos que resetam o timer
}

const DEFAULT_OPTIONS: InactivityTimeoutOptions = {
  timeout: 2 * 60 * 60 * 1000, // 2 horas
  warningTime: 5 * 60 * 1000, // 5 minutos de aviso
  events: [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'keydown'
  ]
};

export function useInactivityTimeout(options: Partial<InactivityTimeoutOptions> = {}) {
  const { signOut, user } = useAuth();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningTimeoutRef = useRef<NodeJS.Timeout>();
  const countdownRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Função para fazer logout automático
  const performAutoLogout = useCallback(async () => {
    try {
      if (import.meta.env.DEV) {
        console.log('🔐 Logout automático por inatividade');
      }
      
      toast.error('Sessão expirada por inatividade. Faça login novamente.', {
        duration: 5000,
      });
      
      await signOut();
    } catch (error) {
      console.error('Erro no logout automático:', error);
    }
  }, [signOut]);

  // Função para mostrar aviso de logout iminente
  const showWarning = useCallback(() => {
    // Evitar múltiplas chamadas
    if (isWarningVisible) {
      return;
    }

    setIsWarningVisible(true);
    setRemainingTime(opts.warningTime);
    
    if (import.meta.env.DEV) {
      console.log('⚠️ Aviso de inatividade ativado');
    }
    
    toast.warning('Sua sessão expirará em breve devido à inatividade', {
      duration: 4000,
    });

    // Countdown do tempo restante
    let timeLeft = opts.warningTime;
    countdownRef.current = setInterval(() => {
      timeLeft -= 1000;
      setRemainingTime(timeLeft);
      
      if (timeLeft <= 0) {
        clearInterval(countdownRef.current!);
        performAutoLogout();
      }
    }, 1000);

    // Timeout final para logout
    warningTimeoutRef.current = setTimeout(() => {
      performAutoLogout();
    }, opts.warningTime);
  }, [opts.warningTime, performAutoLogout, isWarningVisible]);

  // Função para resetar os timers
  const resetTimeout = useCallback(() => {
    // Limpar timers existentes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    // Esconder aviso se estiver visível
    if (isWarningVisible) {
      setIsWarningVisible(false);
      setRemainingTime(0);
    }

    // Atualizar última atividade
    lastActivityRef.current = Date.now();

    // Configurar novo timeout para o aviso
    const warningTimeout = opts.timeout - opts.warningTime;
    timeoutRef.current = setTimeout(showWarning, warningTimeout);

    if (import.meta.env.DEV) {
      console.log(`⏰ Timer de inatividade resetado. Aviso em ${warningTimeout / 1000 / 60} minutos`);
    }
  }, [opts.timeout, opts.warningTime, showWarning, isWarningVisible]);

  // Função para estender a sessão
  const extendSession = useCallback(() => {
    if (import.meta.env.DEV) {
      console.log('⏰ Sessão estendida pelo usuário');
    }
    
    toast.success('Sessão estendida com sucesso!', {
      duration: 3000,
    });
    
    resetTimeout();
  }, [resetTimeout]);

  // Configurar listeners de eventos - apenas uma vez
  useEffect(() => {
    if (!user) {
      return;
    }

    // Função para lidar com atividade do usuário
    const handleActivity = () => {
      // Só resetar se não estiver no período de aviso
      if (!isWarningVisible) {
        resetTimeout();
      }
    };

    // Adicionar listeners para todos os eventos
    opts.events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      opts.events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [user, opts.events, isWarningVisible, resetTimeout]);

  // Iniciar timer quando o usuário faz login
  useEffect(() => {
    if (user && !isWarningVisible) {
      resetTimeout();
    }
  }, [user, resetTimeout, isWarningVisible]);

  // Limpar timers quando o usuário faz logout
  useEffect(() => {
    if (!user) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      setIsWarningVisible(false);
      setRemainingTime(0);
    }
  }, [user]);

  return {
    isWarningVisible,
    remainingTime,
    extendSession,
    resetTimeout,
    lastActivity: lastActivityRef.current
  };
}
