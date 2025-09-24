import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para carregar dados do perfil
  const loadUserProfile = async (authUser: any) => {
    if (!authUser?.email) return authUser;

    try {
      // Timeout para evitar travamento na busca do perfil
      const profilePromise = supabase
        .from('profiles')
        .select('nome, email, role')
        .eq('email', authUser.email)
        .single();

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na busca do perfil')), 15000);
      });

      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (!error && profile) {
        // Mesclar dados do auth com dados do perfil
        return {
          ...authUser,
          user_metadata: {
            ...authUser.user_metadata,
            name: profile.nome || authUser.user_metadata?.name || authUser.email,
            role: profile.role
          }
        };
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.log('Aviso: Não foi possível carregar perfil do usuário:', error);
      }
      // Em caso de erro, retornar o usuário básico para não travar a autenticação
    }

    return authUser;
  };

  useEffect(() => {
    let isMounted = true;
    let currentlyLoading = true;
    
    // Timeout de segurança para evitar loading infinito
    const safetyTimeout = setTimeout(() => {
      if (isMounted && currentlyLoading) {
        console.warn('⚠️ Timeout de segurança ativado - forçando setIsLoading(false)');
        setIsLoading(false);
        currentlyLoading = false;
      }
    }, 10000); // 10 segundos máximo

    const handleAuthStateChange = async (event: any, session: any) => {
      try {
        if (!isMounted) return;
        
        console.log('🔐 Auth state change:', event, !!session, session?.user?.id);
        
        setSession(session);
        
        if (session?.user) {
          const enrichedUser = await loadUserProfile(session.user);
          if (isMounted) {
            setUser(enrichedUser);
          }
        } else {
          if (isMounted) {
            setUser(null);
          }
        }
        
        if (isMounted) {
          setIsLoading(false);
          currentlyLoading = false;
          clearTimeout(safetyTimeout);
        }
      } catch (error) {
        console.error('Erro no handleAuthStateChange:', error);
        if (isMounted) {
          // Em caso de erro, limpar tudo e parar o loading
          setSession(null);
          setUser(null);
          setIsLoading(false);
          currentlyLoading = false;
          clearTimeout(safetyTimeout);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Check for existing session
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          if (isMounted) {
            setSession(null);
            setUser(null);
            setIsLoading(false);
            clearTimeout(safetyTimeout);
          }
          return;
        }
        
        if (!isMounted) return;
        
        setSession(session);
        
        if (session?.user) {
          const enrichedUser = await loadUserProfile(session.user);
          if (isMounted) {
            setUser(enrichedUser);
          }
        } else {
          if (isMounted) {
            setUser(null);
          }
        }
        
        if (isMounted) {
          setIsLoading(false);
          currentlyLoading = false;
          clearTimeout(safetyTimeout);
        }
      } catch (error) {
        console.error('Erro na inicialização da sessão:', error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          setIsLoading(false);
          currentlyLoading = false;
          clearTimeout(safetyTimeout);
        }
      }
    };

    initializeSession();

    // Verificação periódica da sessão para detectar problemas (reduzida para 30 segundos)
    const sessionCheckInterval = setInterval(async () => {
      if (!isMounted) return;
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro na verificação periódica da sessão:', error);
          if (isMounted && currentlyLoading) {
            console.log('🔄 Forçando parada do loading devido a erro de sessão');
            setIsLoading(false);
            currentlyLoading = false;
            clearTimeout(safetyTimeout);
          }
        }
      } catch (error) {
        console.error('Erro na verificação periódica:', error);
        if (isMounted && currentlyLoading) {
          console.log('🔄 Forçando parada do loading devido a erro de conectividade');
          setIsLoading(false);
          currentlyLoading = false;
          clearTimeout(safetyTimeout);
        }
      }
    }, 30000); // Verificar a cada 30 segundos (reduzido de 5s)

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      clearInterval(sessionCheckInterval);
      subscription.unsubscribe();
    };
  }, []);



  const signUp = async (email: string, password: string, name: string) => {
    try {
      if (import.meta.env.DEV) {
        console.log('Criando conta para:', email);
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.log('Erro ao criar conta:', error.message);
        }
        return { error: error.message };
      }

      if (import.meta.env.DEV) {
        console.log('Conta criada com sucesso');
      }
      toast.success('Conta criada com sucesso!');
      return { error: null };
    } catch (error) {
      console.error('Erro interno na criação da conta');
      return { error: "Erro interno na criação da conta" };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (import.meta.env.DEV) {
        console.log('Tentativa de login');
      }
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.log('Erro no login:', error.message);
        }
        return { error: error.message };
      }

      if (import.meta.env.DEV) {
        console.log('Login realizado com sucesso');
      }
      toast.success('Login realizado com sucesso!');
      return { error: null };
    } catch (error) {
      console.error('Erro interno no login');
      return { error: "Erro interno do sistema" };
    }
  };

  const signOut = async () => {
    try {
      // Check if there's a current session before attempting logout
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // No active session, just clear local state
        setSession(null);
        setUser(null);
        toast.success('Logout realizado com sucesso!');
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        // Even if there's an error, clear local state
        setSession(null);
        setUser(null);
        toast.success('Logout realizado com sucesso!');
      } else {
        toast.success('Logout realizado com sucesso!');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state anyway
      setSession(null);
      setUser(null);
      toast.success('Logout realizado com sucesso!');
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signUp, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Log mais detalhado para debug
    console.error('🚨 useAuth called outside AuthProvider context');
    console.trace('Stack trace for useAuth error');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};