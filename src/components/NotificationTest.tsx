import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function NotificationTest() {
  const { toast } = useToast();
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const [isTesting, setIsTesting] = useState(false);

  const testDirectInsert = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          closing_id: null,
          title: 'Teste de Notificação Direta',
          message: 'Esta é uma notificação de teste inserida diretamente no banco.',
          type: 'info',
          pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        })
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: `Notificação inserida com ID: ${data[0].id}`
      });
    } catch (error) {
      console.error('Erro ao inserir notificação:', error);
      toast({
        title: "Erro",
        description: `Falha ao inserir notificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testRPCFunction = async () => {
    setIsTesting(true);
    try {
      // Primeiro, criar um fechamento de teste
      const { data: closingData, error: closingError } = await supabase
        .from('closings')
        .insert({
          dia_operacional: '2025-01-30',
          periodo_inicio_local: new Date().toISOString(),
          periodo_fim_local: new Date().toISOString(),
          total_valor_centavos: 10000,
          total_qtd: 5,
          fechado_por: user?.id || '4728cc7d-d9c0-4f37-8eff-d3d1b511ca85',
          fechado_em_local: new Date().toISOString(),
          enviado_para: ['teste@exemplo.com'],
          observacao: 'Fechamento de teste para notificações'
        })
        .select('id')
        .single();

      if (closingError) {
        throw closingError;
      }

      // Agora testar a função RPC
      const { data, error } = await supabase
        .rpc('notify_pdf_ready', {
          p_closing_id: closingData.id,
          p_pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Função notify_pdf_ready executada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao testar função RPC:', error);
      toast({
        title: "Erro",
        description: `Falha ao executar função: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const testContextAdd = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      await addNotification({
        closing_id: 'test-closing-id',
        title: 'Teste via Context',
        message: 'Esta notificação foi adicionada via contexto React.',
        type: 'pdf_ready',
        pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      });

      toast({
        title: "Sucesso",
        description: "Notificação adicionada via contexto!"
      });
    } catch (error) {
      console.error('Erro ao adicionar notificação via contexto:', error);
      toast({
        title: "Erro",
        description: `Falha ao adicionar notificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const checkNotifications = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      toast({
        title: "Notificações Encontradas",
        description: `Encontradas ${data?.length || 0} notificações no banco de dados.`
      });

      console.log('Notificações encontradas:', data);
    } catch (error) {
      console.error('Erro ao verificar notificações:', error);
      toast({
        title: "Erro",
        description: `Falha ao verificar notificações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🔔 Teste de Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={testDirectInsert}
            disabled={isTesting}
            variant="outline"
          >
            {isTesting ? 'Testando...' : 'Teste 1: Inserção Direta'}
          </Button>
          
          <Button
            onClick={testRPCFunction}
            disabled={isTesting}
            variant="outline"
          >
            {isTesting ? 'Testando...' : 'Teste 2: Função RPC'}
          </Button>
          
          <Button
            onClick={testContextAdd}
            disabled={isTesting}
            variant="outline"
          >
            {isTesting ? 'Testando...' : 'Teste 3: Via Contexto'}
          </Button>
          
          <Button
            onClick={checkNotifications}
            disabled={isTesting}
            variant="outline"
          >
            {isTesting ? 'Verificando...' : 'Verificar Notificações'}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p><strong>Teste 1:</strong> Insere notificação diretamente no banco</p>
          <p><strong>Teste 2:</strong> Testa a função RPC notify_pdf_ready</p>
          <p><strong>Teste 3:</strong> Adiciona notificação via contexto React</p>
          <p><strong>Verificar:</strong> Lista notificações do usuário atual</p>
        </div>
      </CardContent>
    </Card>
  );
}
