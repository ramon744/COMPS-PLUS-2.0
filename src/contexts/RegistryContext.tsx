import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompType, Waiter, Manager } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RegistryContextType {
  compTypes: CompType[];
  waiters: Waiter[];
  managers: Manager[];
  isLoading: boolean;
  addCompType: (compType: Omit<CompType, 'id' | 'criadoEm'>) => Promise<void>;
  updateCompType: (id: string, compType: Partial<CompType>) => Promise<void>;
  toggleCompTypeStatus: (id: string) => Promise<void>;
  deleteCompType: (id: string) => Promise<void>;
  addWaiter: (waiter: Omit<Waiter, 'id' | 'criadoEm'>) => Promise<void>;
  updateWaiter: (id: string, waiter: Partial<Waiter>) => Promise<void>;
  toggleWaiterStatus: (id: string) => Promise<void>;
  deleteWaiter: (id: string) => Promise<void>;
  addManager: (manager: Omit<Manager, 'id' | 'criadoEm'>) => Promise<void>;
  updateManager: (id: string, manager: Partial<Manager>) => Promise<void>;
  toggleManagerStatus: (id: string) => Promise<void>;
  deleteManager: (id: string) => Promise<void>;
  getActiveCompTypes: () => CompType[];
  getActiveWaiters: () => Waiter[];
  getActiveManagers: () => Manager[];
  clearAllData: () => Promise<void>;
}

const RegistryContext = createContext<RegistryContextType | undefined>(undefined);

// Initial mock data
const initialCompTypes: CompType[] = [
  { id: "1", codigo: "COMPS 2", nome: "Produto com defeito", descricao: "Produto apresentou defeito", ativo: true, criadoEm: "2024-01-01" },
  { id: "2", codigo: "COMPS 4", nome: "Atraso no pedido", descricao: "Pedido demorou mais que o esperado", ativo: true, criadoEm: "2024-01-01" },
  { id: "3", codigo: "COMPS 8", nome: "Erro no pedido", descricao: "Pedido foi preparado incorretamente", ativo: false, criadoEm: "2024-01-01" },
];

const initialWaiters: Waiter[] = [
  { id: "1", nome: "Maria Silva", matricula: "001", ativo: true, criadoEm: "2024-01-01" },
  { id: "2", nome: "João Santos", matricula: "002", ativo: true, criadoEm: "2024-01-01" },
  { id: "3", nome: "Ana Costa", matricula: "003", ativo: false, criadoEm: "2024-01-01" },
];

const initialManagers: Manager[] = [
  { id: "1", nome: "Alice Costa", usuario: "alice", senha: "123456", tipoAcesso: "qualquer_ip", ativo: true, criadoEm: "2024-01-01" },
  { id: "2", nome: "Roberto Santos", usuario: "roberto", senha: "123456", tipoAcesso: "qualquer_ip", ativo: true, criadoEm: "2024-01-01" },
];

export function RegistryProvider({ children }: { children: ReactNode }) {
  const [compTypes, setCompTypes] = useState<CompType[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;
    
    const compTypesChannel = supabase
      .channel('comp-types-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comp_types'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newCompType: CompType = {
              id: payload.new.id,
              codigo: payload.new.codigo,
              nome: payload.new.nome,
              descricao: payload.new.descricao,
              ativo: payload.new.ativo,
              criadoEm: payload.new.created_at
            };
            setCompTypes(prev => [newCompType, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setCompTypes(prev => prev.map(compType => 
              compType.id === payload.new.id 
                ? {
                    ...compType,
                    codigo: payload.new.codigo,
                    nome: payload.new.nome,
                    descricao: payload.new.descricao,
                    ativo: payload.new.ativo
                  }
                : compType
            ));
          } else if (payload.eventType === 'DELETE') {
            setCompTypes(prev => prev.filter(compType => compType.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const waitersChannel = supabase
      .channel('waiters-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waiters'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newWaiter: Waiter = {
              id: payload.new.id,
              nome: payload.new.nome,
              matricula: payload.new.matricula,
              ativo: payload.new.ativo,
              criadoEm: payload.new.created_at
            };
            setWaiters(prev => [newWaiter, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setWaiters(prev => prev.map(waiter => 
              waiter.id === payload.new.id 
                ? {
                    ...waiter,
                    nome: payload.new.nome,
                    matricula: payload.new.matricula,
                    ativo: payload.new.ativo
                  }
                : waiter
            ));
          } else if (payload.eventType === 'DELETE') {
            setWaiters(prev => prev.filter(waiter => waiter.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    const managersChannel = supabase
      .channel('managers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'managers'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newManager: Manager = {
              id: payload.new.id,
              nome: payload.new.nome,
              usuario: payload.new.usuario,
              senha: payload.new.senha,
              tipoAcesso: payload.new.tipo_acesso as "qualquer_ip" | "ip_especifico",
              ipPermitido: payload.new.ip_permitido,
              ativo: payload.new.ativo,
              criadoEm: payload.new.created_at
            };
            setManagers(prev => [newManager, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setManagers(prev => prev.map(manager => 
              manager.id === payload.new.id 
                ? {
                    ...manager,
                    nome: payload.new.nome,
                    usuario: payload.new.usuario,
                    senha: payload.new.senha,
                    tipoAcesso: payload.new.tipo_acesso as "qualquer_ip" | "ip_especifico",
                    ipPermitido: payload.new.ip_permitido,
                    ativo: payload.new.ativo
                  }
                : manager
            ));
          } else if (payload.eventType === 'DELETE') {
            setManagers(prev => prev.filter(manager => manager.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(compTypesChannel);
      supabase.removeChannel(waitersChannel);
      supabase.removeChannel(managersChannel);
    };
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load comp types
      const { data: compTypesData, error: compTypesError } = await supabase
        .from('comp_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (compTypesError) throw compTypesError;

      // Load waiters
      const { data: waitersData, error: waitersError } = await supabase
        .from('waiters')
        .select('*')
        .order('created_at', { ascending: false });

      if (waitersError) throw waitersError;

      // Load managers
      const { data: managersData, error: managersError } = await supabase
        .from('managers')
        .select('*')
        .order('created_at', { ascending: false });

      if (managersError) throw managersError;

      // Transform data to match frontend types
      setCompTypes(compTypesData.map(item => ({
        id: item.id,
        codigo: item.codigo,
        nome: item.nome,
        descricao: item.descricao,
        ativo: item.ativo,
        criadoEm: item.created_at
      })));

      setWaiters(waitersData.map(item => ({
        id: item.id,
        nome: item.nome,
        matricula: item.matricula,
        ativo: item.ativo,
        criadoEm: item.created_at
      })));

      setManagers(managersData.map(item => ({
        id: item.id,
        nome: item.nome,
        usuario: item.usuario,
        senha: item.senha,
        tipoAcesso: item.tipo_acesso as "qualquer_ip" | "ip_especifico",
        ipPermitido: item.ip_permitido,
        ativo: item.ativo,
        criadoEm: item.created_at
      })));

      console.log('Managers carregados do banco:', managersData);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados do servidor');
      // Use initial data as fallback
      setCompTypes(initialCompTypes);
      setWaiters(initialWaiters);
      setManagers(initialManagers);
    } finally {
      setIsLoading(false);
    }
  };

  const addCompType = async (compTypeData: Omit<CompType, 'id' | 'criadoEm'>) => {
    try {
      const { data, error } = await supabase
        .from('comp_types')
        .insert({
          codigo: compTypeData.codigo,
          nome: compTypeData.nome,
          descricao: compTypeData.descricao,
          ativo: compTypeData.ativo
        })
        .select()
        .single();

      if (error) throw error;

      const newCompType: CompType = {
        id: data.id,
        codigo: data.codigo,
        nome: data.nome,
        descricao: data.descricao,
        ativo: data.ativo,
        criadoEm: data.created_at
      };

      setCompTypes(prev => [newCompType, ...prev]);
      toast.success('Tipo de COMP adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding comp type:', error);
      toast.error('Erro ao adicionar tipo de COMP');
    }
  };

  const updateCompType = async (id: string, updatedData: Partial<CompType>) => {
    try {
      const { error } = await supabase
        .from('comp_types')
        .update({
          codigo: updatedData.codigo,
          nome: updatedData.nome,
          descricao: updatedData.descricao,
          ativo: updatedData.ativo
        })
        .eq('id', id);

      if (error) throw error;

      setCompTypes(prev => prev.map(compType => 
        compType.id === id 
          ? { ...compType, ...updatedData }
          : compType
      ));
      toast.success('Tipo de COMP atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating comp type:', error);
      toast.error('Erro ao atualizar tipo de COMP');
    }
  };

  const toggleCompTypeStatus = async (id: string) => {
    const compType = compTypes.find(ct => ct.id === id);
    if (!compType) return;

    try {
      const { error } = await supabase
        .from('comp_types')
        .update({ ativo: !compType.ativo })
        .eq('id', id);

      if (error) throw error;

      setCompTypes(prev => prev.map(compType => 
        compType.id === id ? { ...compType, ativo: !compType.ativo } : compType
      ));
      toast.success(`Tipo de COMP ${!compType.ativo ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Error toggling comp type status:', error);
      toast.error('Erro ao alterar status do tipo de COMP');
    }
  };

  const deleteCompType = async (id: string) => {
    try {
      const { error } = await supabase
        .from('comp_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompTypes(prev => prev.filter(compType => compType.id !== id));
      toast.success('Tipo de COMP removido com sucesso!');
    } catch (error) {
      console.error('Error deleting comp type:', error);
      toast.error('Erro ao remover tipo de COMP');
    }
  };

  const addWaiter = async (waiterData: Omit<Waiter, 'id' | 'criadoEm'>) => {
    try {
      const { data, error } = await supabase
        .from('waiters')
        .insert({
          nome: waiterData.nome,
          matricula: waiterData.matricula,
          ativo: waiterData.ativo
        })
        .select()
        .single();

      if (error) throw error;

      const newWaiter: Waiter = {
        id: data.id,
        nome: data.nome,
        matricula: data.matricula,
        ativo: data.ativo,
        criadoEm: data.created_at
      };

      setWaiters(prev => [newWaiter, ...prev]);
      toast.success('Garçom adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding waiter:', error);
      toast.error('Erro ao adicionar garçom');
    }
  };

  const updateWaiter = async (id: string, updatedData: Partial<Waiter>) => {
    try {
      const { error } = await supabase
        .from('waiters')
        .update({
          nome: updatedData.nome,
          matricula: updatedData.matricula,
          ativo: updatedData.ativo
        })
        .eq('id', id);

      if (error) throw error;

      setWaiters(prev => prev.map(waiter => 
        waiter.id === id 
          ? { ...waiter, ...updatedData }
          : waiter
      ));
      toast.success('Garçom atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating waiter:', error);
      toast.error('Erro ao atualizar garçom');
    }
  };

  const toggleWaiterStatus = async (id: string) => {
    const waiter = waiters.find(w => w.id === id);
    if (!waiter) return;

    try {
      const { error } = await supabase
        .from('waiters')
        .update({ ativo: !waiter.ativo })
        .eq('id', id);

      if (error) throw error;

      setWaiters(prev => prev.map(waiter => 
        waiter.id === id ? { ...waiter, ativo: !waiter.ativo } : waiter
      ));
      toast.success(`Garçom ${!waiter.ativo ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Error toggling waiter status:', error);
      toast.error('Erro ao alterar status do garçom');
    }
  };

  const deleteWaiter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('waiters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWaiters(prev => prev.filter(waiter => waiter.id !== id));
      toast.success('Garçom removido com sucesso!');
    } catch (error) {
      console.error('Error deleting waiter:', error);
      toast.error('Erro ao remover garçom');
    }
  };

  const getActiveCompTypes = () => {
    return compTypes.filter(compType => compType.ativo);
  };

  const addManager = async (managerData: Omit<Manager, 'id' | 'criadoEm'>) => {
    try {
      const { data, error } = await supabase
        .from('managers')
        .insert({
          nome: managerData.nome,
          usuario: managerData.usuario,
          senha: managerData.senha,
          tipo_acesso: managerData.tipoAcesso,
          ip_permitido: managerData.ipPermitido,
          ativo: managerData.ativo
        })
        .select()
        .single();

      if (error) throw error;

      const newManager: Manager = {
        id: data.id,
        nome: data.nome,
        usuario: data.usuario,
        senha: data.senha,
        tipoAcesso: data.tipo_acesso as "qualquer_ip" | "ip_especifico",
        ipPermitido: data.ip_permitido,
        ativo: data.ativo,
        criadoEm: data.created_at
      };

      setManagers(prev => [newManager, ...prev]);
      toast.success('Gerente adicionado com sucesso!');
    } catch (error) {
      console.error('Error adding manager:', error);
      toast.error('Erro ao adicionar gerente');
    }
  };

  const updateManager = async (id: string, updatedData: Partial<Manager>) => {
    try {
      const { error } = await supabase
        .from('managers')
        .update({
          nome: updatedData.nome,
          usuario: updatedData.usuario,
          senha: updatedData.senha,
          tipo_acesso: updatedData.tipoAcesso,
          ip_permitido: updatedData.ipPermitido,
          ativo: updatedData.ativo
        })
        .eq('id', id);

      if (error) throw error;

      setManagers(prev => prev.map(manager => 
        manager.id === id 
          ? { ...manager, ...updatedData }
          : manager
      ));
      toast.success('Gerente atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating manager:', error);
      toast.error('Erro ao atualizar gerente');
    }
  };

  const toggleManagerStatus = async (id: string) => {
    const manager = managers.find(m => m.id === id);
    if (!manager) return;

    try {
      const { error } = await supabase
        .from('managers')
        .update({ ativo: !manager.ativo })
        .eq('id', id);

      if (error) throw error;

      setManagers(prev => prev.map(manager => 
        manager.id === id ? { ...manager, ativo: !manager.ativo } : manager
      ));
      toast.success(`Gerente ${!manager.ativo ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error) {
      console.error('Error toggling manager status:', error);
      toast.error('Erro ao alterar status do gerente');
    }
  };

  const deleteManager = async (id: string) => {
    try {
      const { error } = await supabase
        .from('managers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setManagers(prev => prev.filter(manager => manager.id !== id));
      toast.success('Gerente removido com sucesso!');
    } catch (error) {
      console.error('Error deleting manager:', error);
      toast.error('Erro ao remover gerente');
    }
  };

  const getActiveWaiters = () => {
    return waiters.filter(waiter => waiter.ativo);
  };

  const getActiveManagers = () => {
    return managers.filter(manager => manager.ativo);
  };

  const clearAllData = async () => {
    try {
      // Clear all data from Supabase
      await Promise.all([
        supabase.from('comp_types').delete().neq('id', ''),
        supabase.from('waiters').delete().neq('id', ''),
        supabase.from('managers').delete().neq('id', ''),
      ]);

      setCompTypes([]);
      setWaiters([]);
      setManagers([]);
      toast.success('Todos os dados foram removidos com sucesso!');
    } catch (error) {
      console.error('Error clearing data:', error);
      toast.error('Erro ao limpar dados');
    }
  };

  const value = {
    compTypes,
    waiters,
    managers,
    isLoading,
    addCompType,
    updateCompType,
    toggleCompTypeStatus,
    deleteCompType,
    addWaiter,
    updateWaiter,
    toggleWaiterStatus,
    deleteWaiter,
    addManager,
    updateManager,
    toggleManagerStatus,
    deleteManager,
    getActiveCompTypes,
    getActiveWaiters,
    getActiveManagers,
    clearAllData,
  };

  return (
    <RegistryContext.Provider value={value}>
      {children}
    </RegistryContext.Provider>
  );
}

export function useRegistry() {
  const context = useContext(RegistryContext);
  if (context === undefined) {
    throw new Error('useRegistry must be used within a RegistryProvider');
  }
  return context;
}