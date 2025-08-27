import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getUserIP, isIPAuthorized } from '@/utils/ipUtils';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (usuario: string, senha: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on mount
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (usuario: string, senha: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use managers from localStorage directly
      const storedManagers = localStorage.getItem('registry-managers');
      let managers = [];
      
      if (storedManagers) {
        try {
          managers = JSON.parse(storedManagers);
        } catch (error) {
          console.error('Error loading managers:', error);
          toast.error('Erro ao carregar dados dos gerentes');
          setIsLoading(false);
          return false;
        }
      }
      
      // Find manager with matching usuario and senha
      const manager = managers.find((m: any) => m.usuario === usuario && m.senha === senha && m.ativo);
      
      if (manager) {
        // Verificar IP se necessário
        if (manager.tipoAcesso === "ip_especifico" && manager.ipPermitido) {
          try {
            const userIP = await getUserIP();
            if (!userIP) {
              toast.error('Não foi possível verificar seu IP. Tente novamente.');
              setIsLoading(false);
              return false;
            }
            
            if (!isIPAuthorized(userIP, manager.ipPermitido)) {
              toast.error(`Acesso negado. Você deve estar conectado ao IP ${manager.ipPermitido} para fazer login.`);
              setIsLoading(false);
              return false;
            }
          } catch (error) {
            console.error('Erro na verificação de IP:', error);
            toast.error('Erro na verificação de IP. Tente novamente.');
            setIsLoading(false);
            return false;
          }
        }
        
        const userData = { id: manager.id, email: manager.usuario, name: manager.nome };
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        toast.success('Login realizado com sucesso!');
        setIsLoading(false);
        return true;
      } else {
        toast.error('Usuário ou senha incorretos');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Erro durante o login:', error);
      toast.error('Erro interno. Tente novamente.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
    toast.success('Logout realizado com sucesso!');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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