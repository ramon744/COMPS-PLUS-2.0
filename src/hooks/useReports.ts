import { useCompContext } from '@/contexts/CompContext';
import { useRegistry } from '@/contexts/RegistryContext';
import { useAuth } from '@/contexts/AuthContext';
import { CompType, Waiter } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface FilterParams {
  startDate: string;
  endDate: string;
  reportType: string;
  selectedType: string;
}

export function useReports() {
  const { comps } = useCompContext();
  const { compTypes, waiters } = useRegistry();
  const { user } = useAuth();
  const [managerProfiles, setManagerProfiles] = useState<any[]>([]);

  // Load manager profiles from Supabase
  useEffect(() => {
    const loadManagerProfiles = async () => {
      try {
        // Get unique manager IDs from comps
        const managerIds = [...new Set(comps.map(comp => comp.gerenteId))].filter(Boolean);
        
        if (managerIds.length === 0) {
          console.log('No manager IDs found in comps');
          return;
        }

        console.log('Loading profiles for manager IDs:', managerIds);

        const { data, error } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .in('id', managerIds);

        if (error) {
          console.error('Error loading manager profiles:', error);
          throw error;
        }
        
        console.log('Loaded manager profiles:', data);
        setManagerProfiles(data || []);
      } catch (error) {
        console.error('Error loading manager profiles:', error);
      }
    };

    if (comps.length > 0) {
      loadManagerProfiles();
    }
  }, [comps]);

  const getDateRange = (startDate: string, endDate: string, reportType: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];

    if (reportType === 'diario') {
      // Para relatório diário, mostrar apenas o dia selecionado
      dates.push(startDate);
    } else {
      // Para outros tipos, criar array de datas no intervalo
      const currentDate = new Date(start);
      while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return dates;
  };

  const filterComps = (filters: FilterParams) => {
    let filteredComps = comps;

    // Filtrar por data
    const dateRange = getDateRange(filters.startDate, filters.endDate, filters.reportType);
    filteredComps = filteredComps.filter(comp => 
      dateRange.includes(comp.diaOperacional)
    );

    // Filtrar por tipo de COMP
    if (filters.selectedType !== 'all') {
      filteredComps = filteredComps.filter(comp => 
        comp.compTypeId === filters.selectedType
      );
    }

    return filteredComps;
  };

  const getReportsData = (filters: FilterParams) => {
    const filteredComps = filterComps(filters);
    const dateRange = getDateRange(filters.startDate, filters.endDate, filters.reportType);

    const reportData = dateRange.map(day => {
      const dayComps = filteredComps.filter(comp => comp.diaOperacional === day);
      const valor = dayComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
      const quantidade = dayComps.length;
      
      return {
        dia: (() => {
          const [year, month, dayNum] = day.split('-');
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(dayNum)).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        })(),
        valor,
        quantidade,
      };
    });

    const typeData = compTypes.map(type => {
      const typeComps = filteredComps.filter(comp => comp.compTypeId === type.id);
      return {
        name: type.codigo,
        value: typeComps.reduce((sum, comp) => sum + comp.valorCentavos, 0),
        quantidade: typeComps.length,
        color: `hsl(var(--${getColorByIndex(type.id)}))`,
      };
    }).filter(type => type.quantidade > 0);

    return { reportData, typeData };
  };

  const getWaiterRanking = (filters: FilterParams) => {
    const filteredComps = filterComps(filters);
    
    return waiters.map(waiter => {
      const waiterComps = filteredComps.filter(comp => comp.waiterId === waiter.id);
      const totalValue = waiterComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
      const totalCount = waiterComps.length;
      
      return {
        id: waiter.id,
        name: waiter.nome,
        matricula: waiter.matricula,
        totalValue,
        totalCount,
        averageValue: totalCount > 0 ? totalValue / totalCount : 0,
      };
    })
    .filter(waiter => waiter.totalCount > 0)
    .sort((a, b) => b.totalValue - a.totalValue);
  };

  const getManagerRanking = (filters: FilterParams) => {
    const filteredComps = filterComps(filters);
    
    return managerProfiles.map(manager => {
      const managerComps = filteredComps.filter(comp => comp.gerenteId === manager.id);
      const totalValue = managerComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
      const totalCount = managerComps.length;
      
      return {
        id: manager.id,
        name: manager.nome,
        usuario: manager.email,
        totalValue,
        totalCount,
        averageValue: totalCount > 0 ? totalValue / totalCount : 0,
      };
    })
    .filter(manager => manager.totalCount > 0)
    .sort((a, b) => b.totalValue - a.totalValue);
  };

  const getManagerCompsData = (filters: FilterParams) => {
    const filteredComps = filterComps(filters);
    
    const managerData = managerProfiles.map(manager => {
      const managerComps = filteredComps.filter(comp => comp.gerenteId === manager.id);
      const totalValue = managerComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
      
      return {
        name: manager.nome,
        value: totalValue,
        count: managerComps.length,
        color: `hsl(var(--${getColorByIndex(manager.id)}))`,
      };
    }).filter(manager => manager.count > 0);

    return managerData;
  };

  const getCurrentManagerStats = (filters: FilterParams) => {
    if (!user) return null;
    
    const filteredComps = filterComps(filters);
    const currentManagerComps = filteredComps.filter(comp => comp.gerenteId === user.id);
    const totalValue = currentManagerComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
    const totalCount = currentManagerComps.length;
    
    return {
      totalValue,
      totalCount,
      averageValue: totalCount > 0 ? totalValue / totalCount : 0,
    };
  };

  const getColorByIndex = (id: string) => {
    const colors = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6', 'chart-7', 'chart-8'];
    const index = parseInt(id) % colors.length;
    return colors[index];
  };

  const formatCurrency = (value: number) => {
    return (value / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return {
    getReportsData,
    getWaiterRanking,
    getManagerRanking,
    getManagerCompsData,
    getCurrentManagerStats,
    formatCurrency,
    filterComps,
  };
}