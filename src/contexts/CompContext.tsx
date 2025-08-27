import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Comp, CompType, Waiter } from '@/types';
import { useOperationalDay } from '@/hooks/useOperationalDay';

interface CompContextType {
  comps: Comp[];
  addComp: (comp: Omit<Comp, 'id' | 'criadoEm' | 'atualizadoEm'>) => void;
  updateComp: (id: string, comp: Partial<Comp>) => void;
  deleteComp: (id: string) => void;
  getCompsByDay: (day: string) => Comp[];
  getTodayComps: () => Comp[];
  clearAllComps: () => void;
}

const CompContext = createContext<CompContextType | undefined>(undefined);

export function CompProvider({ children }: { children: ReactNode }) {
  const [comps, setComps] = useState<Comp[]>([]);
  const { currentOperationalDay } = useOperationalDay();

  // Load data from localStorage on mount
  useEffect(() => {
    const storedComps = localStorage.getItem('comps-plus-data');
    if (storedComps) {
      try {
        const parsedComps = JSON.parse(storedComps);
        setComps(parsedComps);
      } catch (error) {
        console.error('Error loading COMPs from localStorage:', error);
      }
    }
  }, []);

  // Save data to localStorage whenever comps change
  useEffect(() => {
    localStorage.setItem('comps-plus-data', JSON.stringify(comps));
  }, [comps]);

  const addComp = (compData: Omit<Comp, 'id' | 'criadoEm' | 'atualizadoEm'>) => {
    const now = new Date().toISOString();
    const newComp: Comp = {
      ...compData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      criadoEm: now,
      atualizadoEm: now,
    };
    
    setComps(prev => [newComp, ...prev]);
  };

  const updateComp = (id: string, updatedData: Partial<Comp>) => {
    setComps(prev => prev.map(comp => 
      comp.id === id 
        ? { ...comp, ...updatedData, atualizadoEm: new Date().toISOString() }
        : comp
    ));
  };

  const deleteComp = (id: string) => {
    setComps(prev => prev.filter(comp => comp.id !== id));
  };

  const getCompsByDay = (day: string) => {
    return comps.filter(comp => comp.diaOperacional === day);
  };

  const getTodayComps = () => {
    return getCompsByDay(currentOperationalDay);
  };

  const clearAllComps = () => {
    setComps([]);
    localStorage.removeItem('comps-plus-data');
  };

  const value = {
    comps,
    addComp,
    updateComp,
    deleteComp,
    getCompsByDay,
    getTodayComps,
    clearAllComps,
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