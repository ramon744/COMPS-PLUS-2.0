import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ReportHistory {
  id: string;
  diaOperacional: string;
  totalValor: number;
  totalQuantidade: number;
  fechadoPor: string;
  fechadoEm: string;
  enviadoPara: string[];
  observacao?: string;
  gerenteMatutino?: string;
  gerenteNoturno?: string;
}

export function useReportHistory() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReportHistory = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Buscar histórico de fechamentos dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: closings, error } = await supabase
        .from('closings')
        .select(`
          id,
          dia_operacional,
          total_valor_centavos,
          total_qtd,
          fechado_em_local,
          enviado_para,
          observacao,
          profiles!closings_fechado_por_fkey(nome)
        `)
        .gte('dia_operacional', thirtyDaysAgo.toISOString().split('T')[0])
        .order('dia_operacional', { ascending: false });

      if (error) {
        console.error('Erro ao carregar histórico de relatórios:', error);
        throw error;
      }

      // Transformar dados para o formato esperado
      const formattedReports: ReportHistory[] = (closings || []).map((closing: any) => ({
        id: closing.id,
        diaOperacional: closing.dia_operacional,
        totalValor: closing.total_valor_centavos / 100, // Converter centavos para reais
        totalQuantidade: closing.total_qtd,
        fechadoPor: closing.profiles?.nome || 'Desconhecido',
        fechadoEm: new Date(closing.fechado_em_local).toLocaleString('pt-BR'),
        enviadoPara: closing.enviado_para || [],
        observacao: closing.observacao,
      }));

      setReports(formattedReports);
    } catch (error) {
      console.error('Erro ao carregar histórico de relatórios:', error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Carregar histórico quando o usuário está autenticado
  useEffect(() => {
    if (user) {
      loadReportHistory();
    }
  }, [user, loadReportHistory]);

  // Real-time subscription para mudanças nos fechamentos
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('closings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'closings',
        },
        () => {
          // Recarregar histórico quando houver mudanças
          loadReportHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadReportHistory]);

  return {
    reports,
    isLoading,
    refreshHistory: loadReportHistory,
  };
}
