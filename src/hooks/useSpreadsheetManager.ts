import { useState, useEffect, useCallback } from 'react';
import SpreadsheetManager, { SpreadsheetData } from '@/utils/spreadsheetManager';

interface UseSpreadsheetManagerProps {
  comps: any[];
  compTypes: any[];
  waiters: any[];
  managers: any[];
  currentDate: string;
}

export function useSpreadsheetManager({
  comps,
  compTypes,
  waiters,
  managers,
  currentDate
}: UseSpreadsheetManagerProps) {
  const [spreadsheetManager, setSpreadsheetManager] = useState<SpreadsheetManager | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Inicializar gerenciador de planilha
  useEffect(() => {
    if (comps.length > 0 && compTypes.length > 0 && waiters.length > 0 && managers.length > 0) {
      const data: SpreadsheetData = {
        comps,
        compTypes,
        waiters,
        managers,
        currentDate,
        gerenteDiurno: 'ADM', // Valor padrão
        gerenteNoturno: 'ADM'  // Valor padrão
      };
      
      const manager = new SpreadsheetManager(data);
      setSpreadsheetManager(manager);
    }
  }, [comps, compTypes, waiters, managers, currentDate]);

  // Atualizar planilha quando um COMP é criado
  const updateSpreadsheet = useCallback(async (newComp: any) => {
    if (!spreadsheetManager) return;
    
    setIsUpdating(true);
    try {
      spreadsheetManager.updateSpreadsheet(newComp);
    } catch (error) {
      console.error('Erro ao atualizar planilha:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [spreadsheetManager]);

  // Atualizar gerentes
  const updateManagers = useCallback((gerenteDiurno: string, gerenteNoturno: string) => {
    if (!spreadsheetManager) return;
    
    spreadsheetManager.updateManagers(gerenteDiurno, gerenteNoturno);
  }, [spreadsheetManager]);

  // Obter URL da planilha
  const getSpreadsheetUrl = useCallback(() => {
    if (!spreadsheetManager) return null;
    return spreadsheetManager.getSpreadsheetUrl();
  }, [spreadsheetManager]);

  return {
    updateSpreadsheet,
    updateManagers,
    getSpreadsheetUrl,
    isUpdating
  };
}

