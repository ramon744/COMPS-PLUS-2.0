import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useOperationalDay } from '@/hooks/useOperationalDay';

export interface PerdaServico {
  id: string;
  user_id: string;
  atendente_nome: string;
  numero_mesa: string;
  motivo: string;
  created_at: string;
  updated_at: string;
  dia_operacional?: string; // Adicionado para compatibilidade com lógica de dia operacional
}

export interface PerdaServicoFormData {
  atendente_nome: string;
  numero_mesa: string;
  motivo: string;
}

interface PerdaServicoContextType {
  perdas: PerdaServico[];
  isLoading: boolean;
  addPerdaServico: (data: PerdaServicoFormData) => Promise<void>;
  updatePerdaServico: (id: string, data: Partial<PerdaServicoFormData>) => Promise<void>;
  deletePerdaServico: (id: string) => Promise<void>;
  getPerdasByDateRange: (startDate: string, endDate: string) => Promise<PerdaServico[]>;
  getPerdasByAtendente: (atendente: string) => Promise<PerdaServico[]>;
  getTodayPerdas: () => PerdaServico[]; // Função para obter perdas do dia operacional atual
  getPerdasByDay: (day: string) => PerdaServico[]; // Função para obter perdas de um dia específico
  currentOperationalDay: string; // Dia operacional atual
}

const PerdaServicoContext = createContext<PerdaServicoContextType | undefined>(undefined);

export function PerdaServicoProvider({ children }: { children: React.ReactNode }) {
  const [perdas, setPerdas] = useState<PerdaServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentOperationalDay } = useOperationalDay();

  // Função para calcular o dia operacional baseado na data de criação
  const calculateOperationalDay = useCallback((createdAt: string): string => {
    const date = new Date(createdAt);
    
    // Se foi criado antes das 5h, pertence ao dia operacional anterior
    if (date.getHours() < 5) {
      const previousDay = new Date(date);
      previousDay.setDate(previousDay.getDate() - 1);
      const year = previousDay.getFullYear();
      const month = String(previousDay.getMonth() + 1).padStart(2, '0');
      const day = String(previousDay.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Formato YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Função para obter perdas do dia operacional atual
  const getTodayPerdas = useCallback(() => {
    return perdas.filter(perda => {
      const perdaDiaOperacional = calculateOperationalDay(perda.created_at);
      return perdaDiaOperacional === currentOperationalDay;
    });
  }, [perdas, currentOperationalDay, calculateOperationalDay]);

  // Função para obter perdas de um dia específico
  const getPerdasByDay = useCallback((day: string) => {
    return perdas.filter(perda => {
      const perdaDiaOperacional = calculateOperationalDay(perda.created_at);
      return perdaDiaOperacional === day;
    });
  }, [perdas, calculateOperationalDay]);

  const loadPerdas = useCallback(async () => {
    if (!user) {
      setPerdas([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Remover filtro por user_id - perdas visíveis para todos
      const { data, error } = await supabase
        .from('perda_servico')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Erro ao carregar perdas de serviço:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar perdas de serviço.",
          variant: "destructive",
        });
        return;
      }
      
      setPerdas(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar perdas de serviço:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar perdas de serviço.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  const addPerdaServico = useCallback(async (data: PerdaServicoFormData) => {
    if (!user) return;

    try {
      const { data: newPerda, error } = await supabase
        .from('perda_servico')
        .insert({
          user_id: user.id,
          atendente_nome: data.atendente_nome,
          numero_mesa: data.numero_mesa,
          motivo: data.motivo
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPerdas(prev => [newPerda, ...prev]);
      
      toast({
        title: "Perda de Serviço Registrada",
        description: `Perda registrada para ${data.atendente_nome} - Mesa ${data.numero_mesa}`,
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar perda de serviço:', error);
      toast({
        title: "Erro",
        description: "Falha ao registrar perda de serviço.",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  const updatePerdaServico = useCallback(async (id: string, data: Partial<PerdaServicoFormData>) => {
    if (!user) return;

    try {
      const { data: updatedPerda, error } = await supabase
        .from('perda_servico')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setPerdas(prev => 
        prev.map(perda => perda.id === id ? updatedPerda : perda)
      );
      
      toast({
        title: "Perda de Serviço Atualizada",
        description: "Registro atualizado com sucesso.",
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar perda de serviço:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar perda de serviço.",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  const deletePerdaServico = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('perda_servico')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setPerdas(prev => prev.filter(perda => perda.id !== id));
      
      toast({
        title: "Perda de Serviço Removida",
        description: "Registro removido com sucesso.",
      });
    } catch (error) {
      console.error('❌ Erro ao remover perda de serviço:', error);
      toast({
        title: "Erro",
        description: "Falha ao remover perda de serviço.",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  const getPerdasByDateRange = useCallback(async (startDate: string, endDate: string): Promise<PerdaServico[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('perda_servico')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar perdas por período:', error);
      return [];
    }
  }, [user]);

  const getPerdasByAtendente = useCallback(async (atendente: string): Promise<PerdaServico[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('perda_servico')
        .select('*')
        .ilike('atendente_nome', `%${atendente}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar perdas por atendente:', error);
      return [];
    }
  }, [user]);

  // Carregar perdas quando o usuário mudar
  useEffect(() => {
    if (user) {
      loadPerdas();
    } else {
      setPerdas([]);
      setIsLoading(false);
    }
  }, [user, loadPerdas]);

  return (
    <PerdaServicoContext.Provider
      value={{
        perdas,
        isLoading,
        addPerdaServico,
        updatePerdaServico,
        deletePerdaServico,
        getPerdasByDateRange,
        getPerdasByAtendente,
        getTodayPerdas,
        getPerdasByDay,
        currentOperationalDay
      }}
    >
      {children}
    </PerdaServicoContext.Provider>
  );
}

export function usePerdaServico() {
  const context = useContext(PerdaServicoContext);
  if (context === undefined) {
    throw new Error('usePerdaServico must be used within a PerdaServicoProvider');
  }
  return context;
}

