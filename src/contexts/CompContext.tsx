import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Comp, CompType, Waiter } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useOperationalDay } from '@/hooks/useOperationalDay';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CompContextType {
  comps: Comp[];
  addComp: (comp: Omit<Comp, 'id' | 'criadoEm' | 'atualizadoEm'>) => Promise<void>;
  updateComp: (id: string, comp: Partial<Comp>) => Promise<void>;
  deleteComp: (id: string) => Promise<void>;
  getCompsByDay: (day: string) => Comp[];
  getTodayComps: () => Comp[];
  clearAllComps: () => Promise<void>;
  isLoading: boolean;
}

const CompContext = createContext<CompContextType | undefined>(undefined);

export function CompProvider({ children }: { children: ReactNode }) {
  const [comps, setComps] = useState<Comp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { currentOperationalDay } = useOperationalDay();
  const { user } = useAuth();

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadComps();
    }
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('comps-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comps'
        },
        (payload) => {
          console.log('Real-time change received:', payload);
          
          if (payload.eventType === 'INSERT') {
            // Transform the new comp data
            const newComp: Comp = {
              id: payload.new.id,
              compTypeId: payload.new.comp_type_id,
              waiterId: payload.new.waiter_id,
              valorCentavos: payload.new.valor_centavos,
              motivo: payload.new.motivo,
              fotoUrl: payload.new.foto_url,
              dataHoraLocal: payload.new.data_hora_local,
              dataHoraUtc: payload.new.data_hora_utc,
              diaOperacional: payload.new.dia_operacional,
              turno: payload.new.turno as "manha" | "noite",
              gerenteId: payload.new.gerente_id,
              status: payload.new.status as "ativo" | "cancelado",
              canceladoMotivo: payload.new.cancelado_motivo,
              criadoEm: payload.new.created_at,
              atualizadoEm: payload.new.updated_at
            };
            
            setComps(prev => [newComp, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setComps(prev => prev.map(comp => 
              comp.id === payload.new.id 
                ? {
                    ...comp,
                    compTypeId: payload.new.comp_type_id,
                    waiterId: payload.new.waiter_id,
                    valorCentavos: payload.new.valor_centavos,
                    motivo: payload.new.motivo,
                    fotoUrl: payload.new.foto_url,
                    status: payload.new.status,
                    canceladoMotivo: payload.new.cancelado_motivo,
                    atualizadoEm: payload.new.updated_at
                  }
                : comp
            ));
          } else if (payload.eventType === 'DELETE') {
            setComps(prev => prev.filter(comp => comp.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadComps = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comps')
        .select(`
          *,
          comp_types!fk_comps_comp_type(codigo, nome),
          waiters!fk_comps_waiter(nome),
          gerente:profiles!fk_comps_gerente(nome)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedComps: Comp[] = data.map(item => ({
        id: item.id,
        compTypeId: item.comp_type_id,
        waiterId: item.waiter_id,
        valorCentavos: item.valor_centavos,
        motivo: item.motivo,
        fotoUrl: item.foto_url,
        dataHoraLocal: item.data_hora_local,
        dataHoraUtc: item.data_hora_utc,
        diaOperacional: item.dia_operacional,
        turno: item.turno as "manha" | "noite",
        gerenteId: item.gerente_id,
        status: item.status as "ativo" | "cancelado",
        canceladoMotivo: item.cancelado_motivo,
        criadoEm: item.created_at,
        atualizadoEm: item.updated_at
      }));

      setComps(transformedComps);
    } catch (error) {
      console.error('Error loading comps:', error);
      toast.error('Erro ao carregar COMPs do servidor');
    } finally {
      setIsLoading(false);
    }
  };

  const addComp = async (compData: Omit<Comp, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('comps')
        .insert({
          comp_type_id: compData.compTypeId,
          waiter_id: compData.waiterId,
          valor_centavos: compData.valorCentavos,
          motivo: compData.motivo,
          foto_url: compData.fotoUrl,
          data_hora_local: compData.dataHoraLocal,
          data_hora_utc: compData.dataHoraUtc,
          dia_operacional: compData.diaOperacional,
          turno: compData.turno,
          gerente_id: user.id,
          status: compData.status
        })
        .select()
        .single();

      if (error) throw error;

      const newComp: Comp = {
        id: data.id,
        compTypeId: data.comp_type_id,
        waiterId: data.waiter_id,
        valorCentavos: data.valor_centavos,
        motivo: data.motivo,
        fotoUrl: data.foto_url,
        dataHoraLocal: data.data_hora_local,
        dataHoraUtc: data.data_hora_utc,
        diaOperacional: data.dia_operacional,
        turno: data.turno as "manha" | "noite",
        gerenteId: data.gerente_id,
        status: data.status as "ativo" | "cancelado",
        canceladoMotivo: data.cancelado_motivo,
        criadoEm: data.created_at,
        atualizadoEm: data.updated_at
      };

      setComps(prev => [newComp, ...prev]);
      toast.success('COMP adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding comp:', error);
      toast.error('Erro ao adicionar COMP');
    }
  };

  const updateComp = async (id: string, updatedData: Partial<Comp>) => {
    try {
      const { error } = await supabase
        .from('comps')
        .update({
          comp_type_id: updatedData.compTypeId,
          waiter_id: updatedData.waiterId,
          valor_centavos: updatedData.valorCentavos,
          motivo: updatedData.motivo,
          foto_url: updatedData.fotoUrl,
          status: updatedData.status,
          cancelado_motivo: updatedData.canceladoMotivo
        })
        .eq('id', id);

      if (error) throw error;

      setComps(prev => prev.map(comp => 
        comp.id === id 
          ? { 
              ...comp, 
              ...updatedData, 
              atualizadoEm: new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" }).replace(' ', 'T') + 'Z'
            }
          : comp
      ));
      toast.success('COMP atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating comp:', error);
      toast.error('Erro ao atualizar COMP');
    }
  };

  const deleteComp = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comps')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setComps(prev => prev.filter(comp => comp.id !== id));
      toast.success('COMP removido com sucesso!');
    } catch (error) {
      console.error('Error deleting comp:', error);
      toast.error('Erro ao remover COMP');
    }
  };

  const getCompsByDay = (day: string) => {
    return comps.filter(comp => comp.diaOperacional === day);
  };

  const getTodayComps = () => {
    return getCompsByDay(currentOperationalDay);
  };

  const clearAllComps = async () => {
    try {
      const { error } = await supabase
        .from('comps')
        .delete()
        .neq('id', '');

      if (error) throw error;

      setComps([]);
      toast.success('Todos os COMPs foram removidos com sucesso!');
    } catch (error) {
      console.error('Error clearing comps:', error);
      toast.error('Erro ao limpar COMPs');
    }
  };

  const value = {
    comps,
    addComp,
    updateComp,
    deleteComp,
    getCompsByDay,
    getTodayComps,
    clearAllComps,
    isLoading,
  };

  return (
    <CompContext.Provider value={value}>
      {children}
    </CompContext.Provider>
  );
}

export function useCompContext() {
  const context = useContext(CompContext);
  if (context === undefined) {
    throw new Error('useCompContext must be used within a CompProvider');
  }
  return context;
}