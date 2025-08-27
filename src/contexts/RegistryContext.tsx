import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompType, Waiter, Manager } from '@/types';

interface RegistryContextType {
  compTypes: CompType[];
  waiters: Waiter[];
  managers: Manager[];
  addCompType: (compType: Omit<CompType, 'id' | 'criadoEm'>) => void;
  updateCompType: (id: string, compType: Partial<CompType>) => void;
  toggleCompTypeStatus: (id: string) => void;
  deleteCompType: (id: string) => void;
  addWaiter: (waiter: Omit<Waiter, 'id' | 'criadoEm'>) => void;
  updateWaiter: (id: string, waiter: Partial<Waiter>) => void;
  toggleWaiterStatus: (id: string) => void;
  deleteWaiter: (id: string) => void;
  addManager: (manager: Omit<Manager, 'id' | 'criadoEm'>) => void;
  updateManager: (id: string, manager: Partial<Manager>) => void;
  toggleManagerStatus: (id: string) => void;
  deleteManager: (id: string) => void;
  getActiveCompTypes: () => CompType[];
  getActiveWaiters: () => Waiter[];
  getActiveManagers: () => Manager[];
  clearAllData: () => void;
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

  // Load data from localStorage on mount
  useEffect(() => {
    const storedCompTypes = localStorage.getItem('registry-comp-types');
    const storedWaiters = localStorage.getItem('registry-waiters');
    const storedManagers = localStorage.getItem('registry-managers');
    
    if (storedCompTypes) {
      try {
        setCompTypes(JSON.parse(storedCompTypes));
      } catch (error) {
        console.error('Error loading comp types from localStorage:', error);
        setCompTypes(initialCompTypes);
      }
    } else {
      setCompTypes(initialCompTypes);
    }

    if (storedWaiters) {
      try {
        setWaiters(JSON.parse(storedWaiters));
      } catch (error) {
        console.error('Error loading waiters from localStorage:', error);
        setWaiters(initialWaiters);
      }
    } else {
      setWaiters(initialWaiters);
    }

    if (storedManagers) {
      try {
        setManagers(JSON.parse(storedManagers));
      } catch (error) {
        console.error('Error loading managers from localStorage:', error);
        setManagers(initialManagers);
      }
    } else {
      setManagers(initialManagers);
    }
  }, []);

  // Save comp types to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('registry-comp-types', JSON.stringify(compTypes));
  }, [compTypes]);

  // Save waiters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('registry-waiters', JSON.stringify(waiters));
  }, [waiters]);

  // Save managers to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('registry-managers', JSON.stringify(managers));
  }, [managers]);

  const addCompType = (compTypeData: Omit<CompType, 'id' | 'criadoEm'>) => {
    const newCompType: CompType = {
      ...compTypeData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      criadoEm: new Date().toISOString(),
    };
    
    setCompTypes(prev => [...prev, newCompType]);
  };

  const updateCompType = (id: string, updatedData: Partial<CompType>) => {
    setCompTypes(prev => prev.map(compType => 
      compType.id === id 
        ? { ...compType, ...updatedData }
        : compType
    ));
  };

  const toggleCompTypeStatus = (id: string) => {
    setCompTypes(prev => prev.map(compType => 
      compType.id === id ? { ...compType, ativo: !compType.ativo } : compType
    ));
  };

  const deleteCompType = (id: string) => {
    setCompTypes(prev => prev.filter(compType => compType.id !== id));
  };

  const addWaiter = (waiterData: Omit<Waiter, 'id' | 'criadoEm'>) => {
    const newWaiter: Waiter = {
      ...waiterData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      criadoEm: new Date().toISOString(),
    };
    
    setWaiters(prev => [...prev, newWaiter]);
  };

  const updateWaiter = (id: string, updatedData: Partial<Waiter>) => {
    setWaiters(prev => prev.map(waiter => 
      waiter.id === id 
        ? { ...waiter, ...updatedData }
        : waiter
    ));
  };

  const toggleWaiterStatus = (id: string) => {
    setWaiters(prev => prev.map(waiter => 
      waiter.id === id ? { ...waiter, ativo: !waiter.ativo } : waiter
    ));
  };

  const deleteWaiter = (id: string) => {
    setWaiters(prev => prev.filter(waiter => waiter.id !== id));
  };

  const getActiveCompTypes = () => {
    return compTypes.filter(compType => compType.ativo);
  };

  const addManager = (managerData: Omit<Manager, 'id' | 'criadoEm'>) => {
    const newManager: Manager = {
      ...managerData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      criadoEm: new Date().toISOString(),
    };
    
    setManagers(prev => [...prev, newManager]);
  };

  const updateManager = (id: string, updatedData: Partial<Manager>) => {
    setManagers(prev => prev.map(manager => 
      manager.id === id 
        ? { ...manager, ...updatedData }
        : manager
    ));
  };

  const toggleManagerStatus = (id: string) => {
    setManagers(prev => prev.map(manager => 
      manager.id === id ? { ...manager, ativo: !manager.ativo } : manager
    ));
  };

  const deleteManager = (id: string) => {
    setManagers(prev => prev.filter(manager => manager.id !== id));
  };

  const getActiveWaiters = () => {
    return waiters.filter(waiter => waiter.ativo);
  };

  const getActiveManagers = () => {
    return managers.filter(manager => manager.ativo);
  };

  const clearAllData = () => {
    setCompTypes([]);
    setWaiters([]);
    setManagers([]);
    localStorage.removeItem('registry-comp-types');
    localStorage.removeItem('registry-waiters');
    localStorage.removeItem('registry-managers');
  };

  const value = {
    compTypes,
    waiters,
    managers,
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