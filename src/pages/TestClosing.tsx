import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function TestClosing() {
  const [isInserting, setIsInserting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const insertTestClosing = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsInserting(true);
    try {
      const agora = new Date();
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      
      const diaOperacional = ontem.toISOString().split('T')[0];
      const inicioOperacional = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate(), 5, 0, 0);

      console.log('🔍 Inserindo teste de fechamento:', {
        diaOperacional,
        inicioOperacional: inicioOperacional.toISOString(),
        agora: agora.toISOString(),
        userId: user.id
      });

      const { data, error } = await supabase
        .from('closings')
        .insert({
          dia_operacional: diaOperacional,
          periodo_inicio_local: inicioOperacional.toISOString(),
          periodo_fim_local: agora.toISOString(),
          total_valor_centavos: 2625, // R$ 26,25
          total_qtd: 17,
          fechado_por: user.id,
          fechado_em_local: agora.toISOString(),
          enviado_para: ['teste@exemplo.com'],
          observacao: 'Fechamento de teste para verificar histórico',
        })
        .select();

      if (error) {
        console.error('❌ Erro ao inserir:', error);
        throw error;
      }

      console.log('✅ Fechamento de teste inserido:', data);

      toast({
        title: "Sucesso!",
        description: "Fechamento de teste inserido com sucesso. Verifique o histórico.",
      });

    } catch (error: any) {
      console.error('❌ Erro ao inserir fechamento de teste:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao inserir fechamento de teste",
        variant: "destructive",
      });
    } finally {
      setIsInserting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Teste de Fechamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Esta página é apenas para teste. Clique no botão abaixo para inserir um registro de teste na tabela closings.
          </p>
          
          <Button 
            onClick={insertTestClosing}
            disabled={isInserting}
            className="w-full"
          >
            {isInserting ? 'Inserindo...' : 'Inserir Fechamento de Teste'}
          </Button>
          
          <p className="text-xs text-muted-foreground mt-4">
            Após inserir, vá para Configurações → Histórico para verificar se aparece.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
