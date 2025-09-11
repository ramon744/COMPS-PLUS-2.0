import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Mail, Settings2, FileText, Send, History, TestTube, Bell } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { ReportHistory } from "@/components/ReportHistory";
import { useWebhook } from "@/hooks/useWebhook";
import { useComps } from "@/hooks/useComps";
import { useRegistry } from "@/contexts/RegistryContext";
import { useOperationalDay } from "@/hooks/useOperationalDay";
import { useNotifications } from "@/contexts/NotificationContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { NotificationTest } from "@/components/NotificationTest";

export default function Settings() {
  const { config, setConfig, saveSettings, isLoading } = useSettings();
  const { toast } = useToast();
  const { sendWebhook } = useWebhook();
  const { comps, calculateStats } = useComps();
  const { compTypes, waiters } = useRegistry();
  const { currentOperationalDay } = useOperationalDay();
  
  const [emailInput, setEmailInput] = useState("");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [isTestingEmployees, setIsTestingEmployees] = useState(false);
  const [isTestingReport, setIsTestingReport] = useState(false);

  // Função para gerar UUID válido para testes
  const generateTestUUID = () => {
    return crypto.randomUUID();
  };

  const { addNotification } = useNotifications();

  // Função para testar notificações
  const testNotification = async () => {
    try {
      // Buscar um closing_id existente
      const { data: existingClosings } = await supabase
        .from('closings')
        .select('id')
        .limit(1)
        .order('created_at', { ascending: false });

      if (!existingClosings || existingClosings.length === 0) {
        console.error('Nenhum fechamento encontrado. Crie um fechamento primeiro.');
        toast({
          title: "Erro",
          description: "Nenhum fechamento encontrado. Crie um fechamento primeiro.",
          variant: "destructive",
        });
        return;
      }

      const testClosingId = existingClosings[0].id;

      await addNotification({
        closing_id: testClosingId,
        title: 'Teste de Notificação',
        message: 'Esta é uma notificação de teste para verificar se o sistema está funcionando.',
        type: 'info',
        pdf_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      });
      
      console.log('Notificação de teste enviada!');
      toast({
        title: "Sucesso",
        description: "Notificação de teste enviada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar notificação de teste.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    await saveSettings(config);
  };

  const addEmail = () => {
    if (emailInput && !config.emailsDestino.includes(emailInput)) {
      setConfig(prev => ({
        ...prev,
        emailsDestino: [...prev.emailsDestino, emailInput]
      }));
      setEmailInput("");
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setConfig(prev => ({
      ...prev,
      emailsDestino: prev.emailsDestino.filter(email => email !== emailToRemove)
    }));
  };

  const testWebhook = async () => {
    if (!config.webhookUrl || !config.webhookAtivo) {
      toast({
        title: "Webhook não configurado",
        description: "Configure o webhook antes de testar.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingWebhook(true);
    
    try {
      // Gerar dados de teste idênticos aos de produção
      const testClosingId = generateTestUUID();
      const reportDate = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
      
      // Calcular estatísticas reais dos COMPS atuais
      const stats = calculateStats(comps);
      
      // Preparar campos de email (máximo 5)
      const emailFields: { [key: string]: string } = {};
      const emailsDestino = config?.emailsDestino || ["proprietario@restaurante.com", "gerente@restaurante.com"];
      for (let i = 1; i <= 5; i++) {
        emailFields[`email_destino${i}`] = emailsDestino[i - 1] || "";
      }

      // Calcular percentuais por tipo de COMP (igual ao de produção)
      const compTypePercentages: { [key: string]: string } = {};
      compTypes.forEach(type => {
        const typeComps = comps.filter(comp => comp.compTypeId === type.id);
        const typeValue = typeComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
        const percentage = stats.totalValue > 0 ? (typeValue / stats.totalValue) * 100 : 0;
        compTypePercentages[`${type.codigo}_percentual`] = `${percentage.toFixed(2)}%`;
      });

      // Dados idênticos aos de produção
      const testData = {
        acao: "dados relatorio",
        Data_relatorio: reportDate,
        Valor_total_de_comps: (stats.totalValue / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        Gerente_diurno: "Gerente Teste Manhã",
        Gerente_noturno: "Gerente Teste Noite",
        ...compTypePercentages,
        ...emailFields,
        Texto_padrao_email: config?.textoEmailPadrao || "Segue em anexo o relatório de COMPs do dia operacional.",
        closing_id: testClosingId,
        // Dados adicionais para teste
        total_comps: stats.totalCount,
        dia_operacional: currentOperationalDay,
        timestamp_teste: new Date().toISOString()
      };

      console.log('🧪 Enviando dados de teste para webhook:', testData);
      
      await sendWebhook(testData);
      
      toast({
        title: "Teste enviado com sucesso!",
        description: `Dados de teste enviados para ${config.webhookUrl}. Verifique os logs do N8N.`,
      });
      
    } catch (error) {
      console.error('Erro no teste do webhook:', error);
      toast({
        title: "Erro no teste",
        description: `Falha ao enviar teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const testEmployeeData = async () => {
    if (!config.webhookUrl || !config.webhookAtivo) {
      toast({
        title: "Webhook não configurado",
        description: "Configure o webhook antes de testar.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingEmployees(true);
    
    try {
      const stats = calculateStats(comps);
      const reportDate = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
      
      // Simular dados dos funcionários (igual à produção)
      const testWaiters = waiters.filter(w => w.ativo).slice(0, 3); // Testar com 3 funcionários
      
      for (const waiter of testWaiters) {
        const waiterComps = comps.filter(comp => comp.waiterId === waiter.id);
        const waiterValue = waiterComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
        
        if (waiterValue > 0) {
          // Dados do funcionário (igual à produção)
          const waiterCompData: { [key: string]: string } = {
            acao: "dados funcionarios",
            Nome: waiter.nome,
            Total_de_comps: (waiterValue / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }),
          };

          // Inicializar todos os tipos
          ['comps2', 'comps4', 'comps8', 'comps11', 'comps12', 'comps13'].forEach(type => {
            waiterCompData[`Total_de_${type}`] = '';
          });

          // Calcular valores por tipo de COMP para este funcionário
          const typeGroups: { [key: string]: number } = {};
          waiterComps.forEach((comp) => {
            const compType = compTypes.find(t => t.id === comp.compTypeId);
            if (compType) {
              const typeKey = compType.codigo.toLowerCase().replace(/\s+/g, '');
              typeGroups[typeKey] = (typeGroups[typeKey] || 0) + comp.valorCentavos;
            }
          });

          // Preencher dados por tipo
          Object.entries(typeGroups).forEach(([type, value]) => {
            const dataKey = `Total_de_${type}`;
            if (waiterCompData[dataKey] !== undefined) {
              waiterCompData[dataKey] = (value / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              });
            }
          });

          // Coletar justificativas dos COMPs deste funcionário
          const waiterJustifications = waiterComps
            .map((comp) => comp.motivo)
            .filter(Boolean)
            .join('/ ') || '';

          waiterCompData.Justificativas = waiterJustifications;

          console.log('🧪 Enviando dados do funcionário:', waiter.nome, waiterCompData);
          await sendWebhook(waiterCompData);
          
          // Aguardar 2 segundos entre envios (igual à produção)
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      toast({
        title: "Teste de funcionários enviado!",
        description: `Dados de ${testWaiters.length} funcionários enviados para o webhook.`,
      });
      
    } catch (error) {
      console.error('Erro no teste dos funcionários:', error);
      toast({
        title: "Erro no teste",
        description: `Falha ao enviar dados dos funcionários: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setIsTestingEmployees(false);
    }
  };

  const testReportData = async () => {
    if (!config.webhookUrl || !config.webhookAtivo) {
      toast({
        title: "Webhook não configurado",
        description: "Configure o webhook antes de testar.",
        variant: "destructive",
      });
      return;
    }

    setIsTestingReport(true);
    
    try {
      const testClosingId = generateTestUUID();
      const reportDate = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });
      const stats = calculateStats(comps);
      
      // Calcular percentuais por tipo de COMP (igual à produção)
      const compTypePercentages: { [key: string]: string } = {};
      
      // Inicializar todos os tipos com 0%
      ['comps2', 'comps4', 'comps8', 'comps11', 'comps12', 'comps13'].forEach(type => {
        compTypePercentages[`Porcentagem_${type}`] = '0%';
      });
      
      // Calcular porcentagens reais dos tipos utilizados
      compTypes.forEach(type => {
        const typeComps = comps.filter(comp => comp.compTypeId === type.id);
        const typeValue = typeComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
        const percentage = stats.totalValue > 0 ? (typeValue / stats.totalValue * 100) : 0;
        const typeKey = `Porcentagem_${type.codigo.toLowerCase().replace(/\s+/g, '')}`;
        compTypePercentages[typeKey] = `${percentage.toFixed(2)}%`;
      });

      // Preparar campos de email (máximo 5)
      const emailFields: { [key: string]: string } = {};
      const emailsDestino = config?.emailsDestino || ["proprietario@restaurante.com", "gerente@restaurante.com"];
      for (let i = 1; i <= 5; i++) {
        emailFields[`email_destino${i}`] = emailsDestino[i - 1] || "";
      }
      
      // Dados do relatório (igual à produção)
      const reportData = {
        acao: "dados relatorio",
        Data_relatorio: reportDate,
        Valor_total_de_comps: (stats.totalValue / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
        Gerente_diurno: "Gerente Teste Manhã",
        Gerente_noturno: "Gerente Teste Noite",
        ...compTypePercentages,
        ...emailFields,
        Texto_padrao_email: config?.textoEmailPadrao || "Segue em anexo o relatório de COMPs do dia operacional.",
        closing_id: testClosingId,
        // Dados adicionais para teste
        total_comps: stats.totalCount,
        dia_operacional: currentOperationalDay,
        timestamp_teste: new Date().toISOString()
      };

      console.log('🧪 Enviando dados do relatório:', reportData);
      await sendWebhook(reportData);
      
      toast({
        title: "Teste do relatório enviado!",
        description: "Dados do relatório enviados para o webhook com closing_id.",
      });
      
    } catch (error) {
      console.error('Erro no teste do relatório:', error);
      toast({
        title: "Erro no teste",
        description: `Falha ao enviar dados do relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setIsTestingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Layout title="Configurações">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Carregando configurações...</span>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Layout title="Configurações">
        <div className="space-y-6 animate-fade-in">
          <Tabs defaultValue="geral" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="geral">
                <Settings2 className="w-4 h-4 mr-2" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="w-4 h-4 mr-2" />
                E-mail
              </TabsTrigger>
              <TabsTrigger value="fluxo">
                <FileText className="w-4 h-4 mr-2" />
                Fluxo
              </TabsTrigger>
              <TabsTrigger value="webhook">
                <Send className="w-4 h-4 mr-2" />
                Webhook
              </TabsTrigger>
              <TabsTrigger value="historico">
                <History className="w-4 h-4 mr-2" />
                Histórico
              </TabsTrigger>
              <TabsTrigger value="testes">
                <TestTube className="w-4 h-4 mr-2" />
                Testes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="geral">
              <Card className="p-6 bg-gradient-card shadow-card">
                <h3 className="text-lg font-semibold mb-4">Configurações Gerais</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Hora de Corte do Dia Operacional</Label>
                    <Input
                      type="time"
                      value={config.horaCorte}
                      onChange={(e) => setConfig(prev => ({ ...prev, horaCorte: e.target.value }))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Horário que define quando um novo dia operacional começa (padrão: 05:00)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>URL do Logo</Label>
                    <Input
                      type="url"
                      value={config.logoUrl}
                      onChange={(e) => setConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                      placeholder="https://exemplo.com/logo.png"
                    />
                    <p className="text-sm text-muted-foreground">
                      URL da imagem do logo que aparecerá nos relatórios
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Máximo por COMP (R$)</Label>
                    <Input
                      type="number"
                      value={config.valorMaximoComp / 100}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        valorMaximoComp: Math.round(parseFloat(e.target.value || "0") * 100)
                      }))}
                      placeholder="999.99"
                      step="0.01"
                      min="0"
                    />
                    <p className="text-sm text-muted-foreground">
                      Valor máximo permitido para um COMP individual
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="email">
              <Card className="p-6 bg-gradient-card shadow-card">
                <h3 className="text-lg font-semibold mb-4">Configurações de E-mail</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Texto Padrão do E-mail</Label>
                    <Textarea
                      value={config.textoEmailPadrao}
                      onChange={(e) => setConfig(prev => ({ ...prev, textoEmailPadrao: e.target.value }))}
                      placeholder="Digite o texto que aparecerá no corpo do e-mail..."
                      rows={4}
                    />
                    <p className="text-sm text-muted-foreground">
                      Texto que será incluído no corpo do e-mail enviado com o relatório
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label>E-mails de Destino</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="email@exemplo.com"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addEmail();
                          }
                        }}
                      />
                      <Button onClick={addEmail} variant="outline">
                        Adicionar
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {config.emailsDestino.map((email, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm">{email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmail(email)}
                            className="text-destructive hover:text-destructive"
                          >
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      E-mails que receberão o relatório de fechamento diário
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="fluxo">
              <Card className="p-6 bg-gradient-card shadow-card">
                <h3 className="text-lg font-semibold mb-4">Configurações de Fluxo</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Manter Tipo de COMP Selecionado</Label>
                      <p className="text-sm text-muted-foreground">
                        Após registrar um COMP, manter o tipo selecionado para o próximo
                      </p>
                    </div>
                    <Switch
                      checked={config.manterTipoSelecionado}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, manterTipoSelecionado: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Manter Atendente Selecionado</Label>
                      <p className="text-sm text-muted-foreground">
                        Após registrar um COMP, manter o atendente selecionado para o próximo
                      </p>
                    </div>
                    <Switch
                      checked={config.manterWaiterSelecionado}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, manterWaiterSelecionado: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Foco Após Salvar COMP</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={config.focoAposSalvar === "valor" ? "default" : "outline"}
                        onClick={() => setConfig(prev => ({ ...prev, focoAposSalvar: "valor" }))}
                        className="justify-start"
                      >
                        Campo Valor
                      </Button>
                      <Button
                        variant={config.focoAposSalvar === "motivo" ? "default" : "outline"}
                        onClick={() => setConfig(prev => ({ ...prev, focoAposSalvar: "motivo" }))}
                        className="justify-start"
                      >
                        Campo Motivo
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Qual campo deve receber foco automaticamente após salvar um COMP
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="webhook">
              <Card className="p-6 bg-gradient-card shadow-card">
                <h3 className="text-lg font-semibold mb-4">Configurações de Webhook</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Ativar Webhook</Label>
                      <p className="text-sm text-muted-foreground">
                        Enviar dados automaticamente ao fechar o dia
                      </p>
                    </div>
                    <Switch
                      checked={config.webhookAtivo}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, webhookAtivo: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL do Webhook</Label>
                    <Input
                      type="url"
                      value={config.webhookUrl}
                      onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      disabled={!config.webhookAtivo}
                    />
                    <p className="text-sm text-muted-foreground">
                      URL que receberá os dados do fechamento (ex: Zapier, Make, etc.)
                    </p>
                  </div>

                  <div className="p-4 bg-info/10 rounded-lg border border-info/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="h-4 w-4 text-info" />
                      <span className="font-medium text-info">Como funciona</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• Primeiro são enviados os dados individuais de cada funcionário</p>
                      <p>• Por último são enviados os dados gerais do relatório (que dispara o e-mail)</p>
                      <p>• Cada envio tem um intervalo de 2 segundos</p>
                      <p>• Use ferramentas como Zapier, Make ou n8n para processar os dados</p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="historico">
              <ReportHistory />
            </TabsContent>

            <TabsContent value="testes">
              <Card className="p-6 bg-gradient-card shadow-card">
                <h3 className="text-lg font-semibold mb-4">Testes de Webhook</h3>
                <div className="space-y-6">
                  <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TestTube className="h-4 w-4 text-warning" />
                      <span className="font-medium text-warning">Teste de Webhook</span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>• Os dados de teste são idênticos aos de produção</p>
                      <p>• Inclui closing_id para rastreamento</p>
                      <p>• Usa dados reais dos COMPS atuais</p>
                      <p>• Verifique os logs do N8N após o teste</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Teste Completo */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Teste Completo</h4>
                        <p className="text-sm text-muted-foreground">
                          Envia todos os dados (funcionários + relatório) como na produção
                        </p>
                      </div>
                      <Button
                        onClick={testWebhook}
                        disabled={isTestingWebhook || !config.webhookAtivo || !config.webhookUrl}
                        className="bg-gradient-primary shadow-button hover:shadow-float transition-all duration-200"
                      >
                        {isTestingWebhook ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Teste Completo
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Testes Individuais */}
                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4">Testes Individuais</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Teste de Funcionários */}
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">Dados dos Funcionários</h5>
                            <Button
                              onClick={testEmployeeData}
                              disabled={isTestingEmployees || !config.webhookAtivo || !config.webhookUrl}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {isTestingEmployees ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Send className="h-3 w-3 mr-1" />
                                  Testar
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Envia dados individuais de cada funcionário com COMPs
                          </p>
                        </div>

                        {/* Teste de Relatório */}
                        <div className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">Dados do Relatório</h5>
                            <Button
                              onClick={testReportData}
                              disabled={isTestingReport || !config.webhookAtivo || !config.webhookUrl}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {isTestingReport ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  <Send className="h-3 w-3 mr-1" />
                                  Testar
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Envia dados gerais do relatório com closing_id
                          </p>
                        </div>
                      </div>
                    </div>

                    {config.webhookUrl && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">URL de destino:</p>
                        <p className="text-xs text-muted-foreground font-mono break-all">
                          {config.webhookUrl}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h5 className="font-medium mb-2">Dados dos Funcionários:</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Ação: "dados funcionarios"</li>
                          <li>• Nome do funcionário</li>
                          <li>• Total de COMPs por funcionário</li>
                          <li>• Valores por tipo de COMP</li>
                          <li>• Justificativas dos COMPs</li>
                          <li>• Intervalo de 2s entre envios</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-muted/30 rounded-lg">
                        <h5 className="font-medium mb-2">Dados do Relatório:</h5>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Ação: "dados relatorio"</li>
                          <li>• Data do relatório</li>
                          <li>• Valor total dos COMPS</li>
                          <li>• Gerentes (teste)</li>
                          <li>• Percentuais por tipo</li>
                          <li>• Emails de destino</li>
                          <li>• <strong>closing_id</strong> (teste)</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <h5 className="font-medium mb-2">Estatísticas Atuais:</h5>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>• Total de COMPS: {comps.length}</p>
                        <p>• Valor total: {(calculateStats(comps).totalValue / 100).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}</p>
                        <p>• Dia operacional: {currentOperationalDay}</p>
                        <p>• Funcionários ativos: {waiters.filter(w => w.ativo).length}</p>
                        <p>• Tipos ativos: {compTypes.length}</p>
                      </div>
                    </div>

                    {/* Teste de Notificação */}
                    <div className="border-t pt-6">
                      <h4 className="font-medium mb-4">Teste de Notificação</h4>
                      <div className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium">Notificação de Teste</h5>
                            <p className="text-sm text-muted-foreground">
                              Testa o sistema de notificações do sininho
                            </p>
                          </div>
                          <Button
                            onClick={testNotification}
                            variant="outline"
                            className="bg-gradient-primary shadow-button hover:shadow-float transition-all duration-200"
                          >
                            <Bell className="h-4 w-4 mr-2" />
                            Testar Notificação
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Teste de Notificações */}
                  <div className="border-t pt-6">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Teste de Notificações
                    </h4>
                    <NotificationTest />
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botão de Salvar Flutuante */}
          <div className="fixed bottom-6 right-6">
            <Button 
              onClick={handleSave}
              className="h-14 px-6 bg-gradient-primary shadow-float hover:shadow-button transition-all duration-200"
              size="lg"
            >
              <Save className="w-5 h-5 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </div>
      </Layout>
    </div>
  );
}