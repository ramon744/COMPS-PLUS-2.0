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
      // Buscar dados do perfil na tabela profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('nome, email, role')
        .eq('email', authUser.email)
        .single();

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
        console.log('Aviso: Não foi possível carregar perfil do usuário');
      }
    }

    return authUser;
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          const enrichedUser = await loadUserProfile(session.user);
          setUser(enrichedUser);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        const enrichedUser = await loadUserProfile(session.user);
        setUser(enrichedUser);
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};