import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CleanupStatus {
  isRunning: boolean;
  lastCleanup: Date | null;
  notificationsDeleted: number;
  closingsDeleted: number;
  error: string | null;
}

export function useCleanup() {
  const [status, setStatus] = useState<CleanupStatus>({
    isRunning: false,
    lastCleanup: null,
    notificationsDeleted: 0,
    closingsDeleted: 0,
    error: null
  });
  
  const { toast } = useToast();

  // Verificar se é hora de fazer limpeza (a cada 5h da manhã)
  const shouldCleanup = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Verificar se é 5h da manhã (hora de reset do dia operacional)
    return currentHour === 5 && currentMinute < 5; // Janela de 5 minutos
  };

  // Executar limpeza do sistema
  const executeCleanup = async () => {
    if (status.isRunning) return;

    setStatus(prev => ({ ...prev, isRunning: true, error: null }));

    try {
      console.log('🧹 Iniciando limpeza do sistema...');
      
      const { data, error } = await supabase.rpc('cleanup_system_data');
      
      if (error) {
        throw error;
      }

      if (data) {
        setStatus(prev => ({
          ...prev,
          isRunning: false,
          lastCleanup: new Date(),
          notificationsDeleted: data.notifications_deleted || 0,
          closingsDeleted: data.closings_deleted || 0,
          error: null
        }));

        console.log('✅ Limpeza concluída:', data);
        
        // Mostrar toast apenas se houver dados deletados
        if ((data.notifications_deleted || 0) > 0 || (data.closings_deleted || 0) > 0) {
          toast({
            title: "Limpeza Automática",
            description: `${data.notifications_deleted || 0} notificações e ${data.closings_deleted || 0} PDFs antigos foram removidos.`,
          });
        }
      }
    } catch (error) {
      console.error('❌ Erro na limpeza:', error);
      
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));

      toast({
        title: "Erro na Limpeza",
        description: "Falha ao executar limpeza automática do sistema.",
        variant: "destructive",
      });
    }
  };

  // Limpeza manual (para testes)
  const manualCleanup = async () => {
    await executeCleanup();
  };

  // Verificar e executar limpeza automática
  useEffect(() => {
    const checkAndCleanup = () => {
      if (shouldCleanup()) {
        executeCleanup();
      }
    };

    // Verificar imediatamente
    checkAndCleanup();

    // Verificar a cada minuto
    const interval = setInterval(checkAndCleanup, 60000);

    return () => clearInterval(interval);
  }, []);

  // Limpeza de notificações apenas (para reset do dia operacional)
  const cleanupNotifications = async () => {
    if (status.isRunning) return;

    setStatus(prev => ({ ...prev, isRunning: true, error: null }));

    try {
      console.log('🔔 Limpando notificações do dia anterior...');
      
      const { error } = await supabase.rpc('cleanup_old_notifications');
      
      if (error) {
        throw error;
      }

      setStatus(prev => ({
        ...prev,
        isRunning: false,
        lastCleanup: new Date(),
        error: null
      }));

      console.log('✅ Notificações limpas com sucesso');
      
      toast({
        title: "Notificações Limpas",
        description: "Notificações do dia anterior foram removidas.",
      });
    } catch (error) {
      console.error('❌ Erro ao limpar notificações:', error);
      
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));

      toast({
        title: "Erro na Limpeza",
        description: "Falha ao limpar notificações.",
        variant: "destructive",
      });
    }
  };

  // Limpeza de PDFs apenas
  const cleanupPDFs = async () => {
    if (status.isRunning) return;

    setStatus(prev => ({ ...prev, isRunning: true, error: null }));

    try {
      console.log('📄 Limpando PDFs antigos (72h+)...');
      
      const { data, error } = await supabase.rpc('cleanup_old_pdfs');
      
      if (error) {
        throw error;
      }

      setStatus(prev => ({
        ...prev,
        isRunning: false,
        lastCleanup: new Date(),
        error: null
      }));

      console.log('✅ PDFs antigos limpos com sucesso');
      
      toast({
        title: "PDFs Limpos",
        description: "PDFs com mais de 72 horas foram removidos.",
      });
    } catch (error) {
      console.error('❌ Erro ao limpar PDFs:', error);
      
      setStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));

      toast({
        title: "Erro na Limpeza",
        description: "Falha ao limpar PDFs antigos.",
        variant: "destructive",
      });
    }
  };

  return {
    status,
    executeCleanup,
    manualCleanup,
    cleanupNotifications,
    cleanupPDFs,
    shouldCleanup: shouldCleanup()
  };
}
