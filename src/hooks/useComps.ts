import { useCompContext } from '@/contexts/CompContext';
import { useRegistry } from '@/contexts/RegistryContext';
import { CompType, Waiter } from '@/types';

// Mock data - in a real app this would come from an API
export const mockCompTypes: CompType[] = [
  { id: "1", codigo: "COMPS 2", nome: "Produto com defeito", descricao: "Produto apresentou defeito", ativo: true, criadoEm: "2024-01-01" },
  { id: "2", codigo: "COMPS 4", nome: "Atraso no pedido", descricao: "Pedido demorou mais que o esperado", ativo: true, criadoEm: "2024-01-01" },
  { id: "3", codigo: "COMPS 8", nome: "Erro no pedido", descricao: "Pedido foi preparado incorretamente", ativo: true, criadoEm: "2024-01-01" },
  { id: "4", codigo: "COMPS 11", nome: "Cliente insatisfeito", descricao: "Cliente demonstrou insatisfação", ativo: true, criadoEm: "2024-01-01" },
  { id: "5", codigo: "COMPS 12", nome: "Cortesia da casa", descricao: "Cortesia oferecida pela casa", ativo: true, criadoEm: "2024-01-01" },
  { id: "6", codigo: "COMPS 13", nome: "Evento especial", descricao: "Desconto para evento especial", ativo: true, criadoEm: "2024-01-01" },
];

export const mockWaiters: Waiter[] = [
  { id: "1", nome: "Maria Silva", matricula: "001", ativo: true, criadoEm: "2024-01-01" },
  { id: "2", nome: "João Santos", matricula: "002", ativo: true, criadoEm: "2024-01-01" },
  { id: "3", nome: "Ana Costa", matricula: "003", ativo: true, criadoEm: "2024-01-01" },
  { id: "4", nome: "Pedro Lima", matricula: "004", ativo: true, criadoEm: "2024-01-01" },
  { id: "5", nome: "Carolina Dias", matricula: "005", ativo: true, criadoEm: "2024-01-01" },
];

export function useComps() {
  const context = useCompContext();
  const { compTypes, waiters } = useRegistry();
  
  const calculateStats = (comps = context.getTodayComps()) => {
    const totalValue = comps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
    const totalCount = comps.length;
    
    const topTypes = compTypes.map(type => {
      const typeComps = comps.filter(comp => comp.compTypeId === type.id);
      return {
        name: type.codigo,
        value: typeComps.reduce((sum, comp) => sum + comp.valorCentavos, 0),
        count: typeComps.length,
      };
    }).filter(type => type.count > 0).sort((a, b) => b.value - a.value);

    const topWaiters = waiters.map(waiter => {
      const waiterComps = comps.filter(comp => comp.waiterId === waiter.id);
      return {
        name: waiter.nome,
        value: waiterComps.reduce((sum, comp) => sum + comp.valorCentavos, 0),
        count: waiterComps.length,
      };
    }).filter(waiter => waiter.count > 0).sort((a, b) => b.value - a.value);

    return {
      totalValue,
      totalCount,
      topTypes,
      topWaiters,
    };
  };

  const getReportsData = () => {
    const allComps = context.comps;
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      // Use Brazil timezone for date calculations
      const brazilTimeString = new Date().toLocaleString("en-CA", { 
        timeZone: "America/Sao_Paulo",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const date = new Date(brazilTimeString);
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const reportData = last7Days.map(day => {
      const dayComps = context.getCompsByDay(day);
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
      const typeComps = allComps.filter(comp => comp.compTypeId === type.id);
      return {
        name: type.codigo,
        value: typeComps.reduce((sum, comp) => sum + comp.valorCentavos, 0),
        quantidade: typeComps.length,
        color: `hsl(var(--${type.id === '1' ? 'primary' : type.id === '2' ? 'secondary' : type.id === '3' ? 'accent' : type.id === '4' ? 'muted' : type.id === '5' ? 'warning' : 'success'}))`,
      };
    }).filter(type => type.quantidade > 0);

    return { reportData, typeData };
  };

  const getClosingData = () => {
    const todayComps = context.getTodayComps();
    
    const byType = compTypes.map(type => {
      const typeComps = todayComps.filter(comp => comp.compTypeId === type.id);
      return {
        name: type.codigo,
        value: typeComps.reduce((sum, comp) => sum + comp.valorCentavos, 0),
        count: typeComps.length,
      };
    }).filter(type => type.count > 0);

    const byWaiter = waiters.map(waiter => {
      const waiterComps = todayComps.filter(comp => comp.waiterId === waiter.id);
      const details = waiterComps.map(comp => {
        const compType = compTypes.find(type => type.id === comp.compTypeId);
        return {
          type: compType?.codigo || '',
          value: comp.valorCentavos,
          motivo: comp.motivo,
        };
      });
      
      return {
        name: waiter.nome,
        value: waiterComps.reduce((sum, comp) => sum + comp.valorCentavos, 0),
        count: waiterComps.length,
        details,
      };
    }).filter(waiter => waiter.count > 0);

    const totalValue = todayComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
    const totalQuantity = todayComps.length;

    return {
      totalValue,
      totalQuantity,
      byType,
      byWaiter,
      byManager: [
        { name: "Gerente Manhã", value: Math.floor(totalValue * 0.4), count: Math.floor(totalQuantity * 0.4) },
        { name: "Gerente Noite", value: Math.floor(totalValue * 0.6), count: Math.ceil(totalQuantity * 0.6) },
      ],
      averagePerComp: totalQuantity > 0 ? totalValue / totalQuantity : 0,
    };
  };

  return {
    ...context,
    mockCompTypes,
    mockWaiters,
    calculateStats,
    getReportsData,
    getClosingData,
  };
}