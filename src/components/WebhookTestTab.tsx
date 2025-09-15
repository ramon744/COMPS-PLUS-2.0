import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/useSettings';
import { useWebhook } from '@/hooks/useWebhook';
import { Send, CheckCircle, XCircle, Clock, Copy, Download } from 'lucide-react';

interface TestResult {
  success: boolean;
  message: string;
  timestamp: string;
  response?: any;
  error?: string;
}

export function WebhookTestTab() {
  const { toast } = useToast();
  const { config } = useSettings();
  const { sendWebhook } = useWebhook();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');

  // Dados de teste idênticos aos de produção
  const generateTestData = () => {
    const currentDate = new Date();
    const reportDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); // Ontem
    
    const formatDateBR = (date: Date) => {
      return date.toLocaleDateString('pt-BR');
    };

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    };

    // Dados dos funcionários (simulando dados reais)
    const funcionariosData = [
      {
        acao: "dados funcionarios",
        Nome: "João Silva",
        Total_de_comps: formatCurrency(150.50),
        Total_de_comps2: formatCurrency(75.25),
        Total_de_comps4: formatCurrency(50.00),
        Total_de_comps8: formatCurrency(25.25),
        Total_de_comps11: "",
        Total_de_comps12: "",
        Total_de_comps13: "",
        Justificativas: "Atendimento excepcional / Cliente VIP"
      },
      {
        acao: "dados funcionarios",
        Nome: "Maria Santos",
        Total_de_comps: formatCurrency(200.75),
        Total_de_comps2: formatCurrency(100.00),
        Total_de_comps4: formatCurrency(75.50),
        Total_de_comps8: formatCurrency(25.25),
        Total_de_comps11: "",
        Total_de_comps12: "",
        Total_de_comps13: "",
        Justificativas: "Venda alta / Cliente satisfeito"
      },
      {
        acao: "dados funcionarios",
        Nome: "Pedro Costa",
        Total_de_comps: formatCurrency(89.30),
        Total_de_comps2: formatCurrency(45.00),
        Total_de_comps4: formatCurrency(44.30),
        Total_de_comps8: "",
        Total_de_comps11: "",
        Total_de_comps12: "",
        Total_de_comps13: "",
        Justificativas: "Problema no pedido / Compensação"
      }
    ];

    // Dados do relatório geral
    const relatorioData = {
      acao: "dados relatorio",
      Data_relatorio: formatDateBR(reportDate),
      Valor_total_de_comps: formatCurrency(440.55),
      Gerente_diurno: "Ana Oliveira",
      Gerente_diurno_telefone: "11999990001",
      Gerente_noturno: "Carlos Mendes",
      Gerente_noturno_telefone: "11999990002",
      Percentual_comps2: "50.0%",
      Percentual_comps4: "38.5%",
      Percentual_comps8: "11.5%",
      Percentual_comps11: "0.0%",
      Percentual_comps12: "0.0%",
      Percentual_comps13: "0.0%",
      email_destino1: "proprietario@restaurante.com",
      email_destino2: "gerente@restaurante.com",
      email_destino3: "",
      email_destino4: "",
      email_destino5: "",
      Texto_padrao_email: `Segue em anexo o relatório de COMPs do dia operacional de ${formatDateBR(reportDate)}.<br><br>Valor total: ${formatCurrency(440.55)}<br>Gerente diurno: Ana Oliveira<br>Gerente noturno: Carlos Mendes`,
      closing_id: "test-closing-id-" + Date.now()
    };

    return { funcionariosData, relatorioData };
  };

  const testNotification = async () => {
    setIsLoading(true);
    const results: TestResult[] = [];

    try {
      // Testar a nova função simplificada de notificação
      const response = await fetch('https://mywxfyfzonzsnfplyogv.supabase.co/rest/v1/rpc/notify_pdf_ready_simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          p_pdf_url: 'https://exemplo.com/relatorio-teste-' + Date.now() + '.pdf'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      results.push({
        success: true,
        message: "Notificação criada com sucesso",
        timestamp: new Date().toISOString(),
        response: result
      });

      setTestResults(results);
      
      toast({
        title: "Teste de notificação concluído",
        description: `Notificações criadas: ${result.notifications_created || 0}`,
        variant: "default"
      });

    } catch (error) {
      console.error('Erro no teste de notificação:', error);
      
      results.push({
        success: false,
        message: "Erro ao criar notificação",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      setTestResults(results);
      
      toast({
        title: "Erro no teste",
        description: "Falha ao testar notificação",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testWebhook = async (type: 'funcionarios' | 'relatorio' | 'completo' | 'notificacao') => {
    if (type === 'notificacao') {
      // Testar notificação direta (nova função simplificada)
      await testNotification();
      return;
    }

    if (!config.webhookAtivo && !customWebhookUrl) {
      toast({
        title: "Webhook não configurado",
        description: "Configure o webhook nas configurações gerais ou use uma URL personalizada.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const { funcionariosData, relatorioData } = generateTestData();
    const results: TestResult[] = [];

    try {
      if (type === 'funcionarios' || type === 'completo') {
        // Testar envio dos dados dos funcionários
        for (let i = 0; i < funcionariosData.length; i++) {
          const funcionario = funcionariosData[i];
          
          try {
            const webhookUrl = customWebhookUrl || config.webhookUrl;
            const response = await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                timestamp: new Date().toISOString(),
                triggered_from: window.location.origin,
                ...funcionario
              }),
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            results.push({
              success: true,
              message: `Funcionário ${funcionario.Nome} enviado com sucesso`,
              timestamp: new Date().toISOString(),
              response: await response.json()
            });

            // Aguardar intervalo configurado entre envios (como na produção)
            if (i < funcionariosData.length - 1) {
              await new Promise(resolve => setTimeout(resolve, (config.webhookInterval || 2) * 1000));
            }
          } catch (error) {
            results.push({
              success: false,
              message: `Erro ao enviar dados do funcionário ${funcionario.Nome}`,
              timestamp: new Date().toISOString(),
              error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
          }
        }
      }

      if (type === 'relatorio' || type === 'completo') {
        // Testar envio dos dados do relatório
        try {
          const webhookUrl = customWebhookUrl || config.webhookUrl;
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              timestamp: new Date().toISOString(),
              triggered_from: window.location.origin,
              ...relatorioData
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          results.push({
            success: true,
            message: "Dados do relatório enviados com sucesso",
            timestamp: new Date().toISOString(),
            response: await response.json()
          });
        } catch (error) {
          results.push({
            success: false,
            message: "Erro ao enviar dados do relatório",
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Erro desconhecido'
          });
        }
      }

      setTestResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      toast({
        title: "Teste concluído",
        description: `${successCount}/${totalCount} envios realizados com sucesso`,
        variant: successCount === totalCount ? "default" : "destructive"
      });

    } catch (error) {
      console.error('Erro no teste do webhook:', error);
      toast({
        title: "Erro no teste",
        description: "Ocorreu um erro durante o teste do webhook",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Dados copiados para a área de transferência",
    });
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webhook-test-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Configuração do Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Configuração do Teste
          </CardTitle>
          <CardDescription>
            Configure uma URL personalizada para teste ou use a URL configurada nas configurações gerais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-webhook-url">URL Personalizada (opcional)</Label>
            <Input
              id="custom-webhook-url"
              type="url"
              value={customWebhookUrl}
              onChange={(e) => setCustomWebhookUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/hooks/catch/..."
            />
            <p className="text-sm text-muted-foreground">
              Se não preenchida, usará a URL configurada nas configurações gerais
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">URL Atual</span>
            </div>
            <p className="text-sm text-blue-700">
              {customWebhookUrl || config.webhookUrl || 'Nenhuma URL configurada'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Testes Disponíveis</CardTitle>
          <CardDescription>
            Escolha o tipo de teste que deseja executar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => testWebhook('funcionarios')}
              disabled={isLoading}
              className="h-20 flex flex-col gap-2"
            >
              <Send className="h-6 w-6" />
              <span>Testar Funcionários</span>
              <span className="text-xs opacity-70">Dados individuais</span>
            </Button>
            
            <Button
              onClick={() => testWebhook('relatorio')}
              disabled={isLoading}
              className="h-20 flex flex-col gap-2"
            >
              <Send className="h-6 w-6" />
              <span>Testar Relatório</span>
              <span className="text-xs opacity-70">Dados gerais</span>
            </Button>
            
            <Button
              onClick={() => testWebhook('completo')}
              disabled={isLoading}
              className="h-20 flex flex-col gap-2"
              variant="default"
            >
              <Send className="h-6 w-6" />
              <span>Teste Completo</span>
              <span className="text-xs opacity-70">Fluxo completo</span>
            </Button>

            <Button
              onClick={() => testWebhook('notificacao')}
              disabled={isLoading}
              className="h-20 flex flex-col gap-2"
              variant="secondary"
            >
              <CheckCircle className="h-6 w-6" />
              <span>Testar Notificação</span>
              <span className="text-xs opacity-70">Nova função simplificada</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Nova Abordagem Simplificada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Nova Abordagem Simplificada
          </CardTitle>
          <CardDescription>
            Sistema simplificado onde N8N gera o PDF e envia apenas o link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-green-900">N8N Gera PDF</h4>
                  <p className="text-sm text-green-700">N8N processa os dados e gera o PDF automaticamente</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-green-900">Envia Apenas Link</h4>
                  <p className="text-sm text-green-700">N8N chama a função <code className="bg-green-100 px-1 rounded">notify_pdf_ready_simple</code> com apenas o URL do PDF</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-green-900">Supabase Notifica</h4>
                  <p className="text-sm text-green-700">Supabase cria notificações para todos os usuários com link direto</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <h5 className="font-medium text-blue-900 mb-2">URL da Função Simplificada:</h5>
              <code className="text-sm text-blue-700 break-all">
                https://mywxfyfzonzsnfplyogv.supabase.co/rest/v1/rpc/notify_pdf_ready_simple
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados de Teste */}
      <Card>
        <CardHeader>
          <CardTitle>Dados de Teste</CardTitle>
          <CardDescription>
            Dados que serão enviados para o webhook (idênticos aos de produção)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Dados dos Funcionários</h4>
              <Textarea
                value={JSON.stringify(generateTestData().funcionariosData, null, 2)}
                readOnly
                className="h-32 text-xs font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => copyToClipboard(JSON.stringify(generateTestData().funcionariosData, null, 2))}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2">Dados do Relatório</h4>
              <Textarea
                value={JSON.stringify(generateTestData().relatorioData, null, 2)}
                readOnly
                className="h-32 text-xs font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => copyToClipboard(JSON.stringify(generateTestData().relatorioData, null, 2))}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados dos Testes */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resultados dos Testes</CardTitle>
                <CardDescription>
                  Histórico dos testes executados
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadResults}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setTestResults([])}
                >
                  Limpar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <div className="flex-shrink-0 mt-1">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.message}</span>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? "Sucesso" : "Erro"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(result.timestamp).toLocaleString('pt-BR')}
                    </div>
                    {result.error && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                        {result.error}
                      </div>
                    )}
                    {result.response && (
                      <details className="mt-2">
                        <summary className="text-sm text-blue-600 cursor-pointer">
                          Ver resposta
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                          {JSON.stringify(result.response, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 animate-spin" />
              <span>Executando teste...</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
