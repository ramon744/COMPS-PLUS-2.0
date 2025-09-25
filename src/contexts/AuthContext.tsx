import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Função de login real com Supabase
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('🔄 Tentando login para:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro no login:', error);
        return { error: error.message };
      }

      if (data.user && data.session) {
        console.log('✅ Login realizado com sucesso:', data.user.email);
        // O estado será atualizado automaticamente pelo listener
        return {};
      }

      return { error: 'Erro desconhecido no login' };
    } catch (error: any) {
      console.error('❌ Erro inesperado no login:', error);
      return { error: 'Erro inesperado. Tente novamente.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout real
  const signOut = async () => {
    try {
      console.log('🔄 Iniciando logout...');
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Erro no logout:', error);
        throw error;
      }
      
      // Limpar estado local
      setUser(null);
      setSession(null);
      
      console.log('✅ Logout realizado com sucesso');
      
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      
    } catch (error: any) {
      console.error('❌ Erro no logout:', error);
      // Mesmo com erro, limpar estado local
      setUser(null);
      setSession(null);
      
      toast({
        title: "Logout realizado",
        description: "Sessão encerrada.",
      });
    }
  };

  // Inicialização e listener de mudanças de auth
  useEffect(() => {
    let mounted = true;

    // Função para processar mudanças de autenticação
    const handleAuthChange = async (event: string, session: Session | null) => {
      if (!mounted) return;

      console.log('🔐 Auth change:', event, !!session);

      try {
        if (session?.user) {
          // Usuário logado
          setSession(session);
          setUser(session.user);
          console.log('✅ Usuário autenticado:', session.user.email);
        } else {
          // Usuário deslogado
          setSession(null);
          setUser(null);
          console.log('🔐 Usuário deslogado');
        }
      } catch (error) {
        console.error('❌ Erro ao processar mudança de auth:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Verificar sessão inicial
    const initializeAuth = async () => {
      try {
        console.log('🔄 Inicializando autenticação...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erro ao obter sessão inicial:', error);
          if (mounted) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          if (session?.user) {
            console.log('✅ Sessão existente encontrada:', session.user.email);
            setSession(session);
            setUser(session.user);
          } else {
            console.log('🔐 Nenhuma sessão ativa');
            setSession(null);
            setUser(null);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    // Timeout de segurança
    const safetyTimeout = setTimeout(() => {
      if (mounted && isLoading) {
        console.warn('⚠️ Timeout de segurança - forçando fim do loading');
        setIsLoading(false);
      }
    }, 5000); // 5 segundos máximo

    // Inicializar PRIMEIRO
    initializeAuth();

    // Configurar listener DEPOIS da inicialização
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}