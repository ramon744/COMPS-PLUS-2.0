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
  // Verificação de segurança para o contexto de auth
  let user = null;
  let authError = false;
  
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch (error) {
    console.warn('⚠️ useReportHistory: AuthContext não disponível');
    authError = true;
  }
  const [reports, setReports] = useState<ReportHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReportHistory = useCallback(async () => {
    if (!user || authError) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Buscar histórico de fechamentos dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      console.log('🔍 DEBUG - Buscando histórico de relatórios:', {
        thirtyDaysAgo: thirtyDaysAgo.toISOString().split('T')[0],
        userId: user?.id
      });

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
          fechado_por,
          managers!fechado_por (
            nome,
            usuario
          )
        `)
        .gte('dia_operacional', thirtyDaysAgo.toISOString().split('T')[0])
        .order('fechado_em_local', { ascending: false }) // Mais recente primeiro por horário exato
        .order('dia_operacional', { ascending: false }); // Fallback por data operacional

      console.log('🔍 DEBUG - Resultado da busca de histórico:', {
        closings,
        error,
        count: closings?.length || 0
      });

      if (error) {
        console.error('Erro ao carregar histórico de relatórios:', error);
        throw error;
      }

      // Transformar dados para o formato esperado
      const formattedReports: ReportHistory[] = (closings || []).map((closing: any) => {
        // Buscar nome do gerente
        let gerenteNome = closing.managers?.nome || 'Sistema';
        
        // Se não encontrou o gerente no JOIN, tentar extrair da observação
        if (gerenteNome === 'Sistema' && closing.observacao) {
          const observacaoMatch = closing.observacao.match(/Fechamento realizado por (.+?) \(/);
          if (observacaoMatch) {
            gerenteNome = observacaoMatch[1];
          }
        }
        
        return {
          id: closing.id,
          diaOperacional: closing.dia_operacional,
          totalValor: closing.total_valor_centavos / 100, // Converter centavos para reais
          totalQuantidade: closing.total_qtd,
          fechadoPor: gerenteNome,
          fechadoEm: new Date(closing.fechado_em_local).toLocaleString('pt-BR'),
          enviadoPara: closing.enviado_para || [],
          observacao: closing.observacao,
        };
      });

      console.log('🔍 DEBUG - Relatórios do servidor (já ordenados):', {
        total: formattedReports.length,
        primeiro: formattedReports[0]?.fechadoEm,
        ultimo: formattedReports[formattedReports.length - 1]?.fechadoEm
      });

      setReports(formattedReports);
    } catch (error) {
      console.error('Erro ao carregar histórico de relatórios:', error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, authError]);

  // Carregar histórico quando o usuário está autenticado
  useEffect(() => {
    if (user && !authError) {
      loadReportHistory();
    }
  }, [user, authError, loadReportHistory]);

  // Real-time subscription para mudanças nos fechamentos
  useEffect(() => {
    if (!user || authError) return;

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
