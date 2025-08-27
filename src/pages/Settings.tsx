import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Mail, Settings2, Users, FileText, Send, Globe, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebhook } from "@/hooks/useWebhook";

interface ConfigData {
  emailsDestino: string[];
  horaCorte: string;
  logoUrl: string;
  textoEmailPadrao: string;
  manterTipoSelecionado: boolean;
  manterWaiterSelecionado: boolean;
  focoAposSalvar: "valor" | "motivo";
  hapticFeedback: boolean;
  valorMaximoComp: number;
  webhookUrl: string;
  webhookAtivo: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const { config: webhookConfig, saveConfig: saveWebhookConfig, sendWebhook } = useWebhook();
  
  const [config, setConfig] = useState<ConfigData>({
    emailsDestino: ["proprietario@restaurante.com"],
    horaCorte: "05:00",
    logoUrl: "",
    textoEmailPadrao: "Segue em anexo o relatório de COMPs do dia operacional.",
    manterTipoSelecionado: true,
    manterWaiterSelecionado: false,
    focoAposSalvar: "valor",
    hapticFeedback: true,
    valorMaximoComp: 999999999,
    webhookUrl: "",
    webhookAtivo: false,
  });

  const [emailInput, setEmailInput] = useState("");

  // Carregar configurações do localStorage apenas na inicialização
  useEffect(() => {
    const savedConfig = localStorage.getItem('app-settings');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      setConfig(parsedConfig);
    }
  }, []);

  // Sincronizar com configuração do webhook apenas na inicialização
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      webhookUrl: webhookConfig.url,
      webhookAtivo: webhookConfig.ativo,
    }));
  }, [webhookConfig.url, webhookConfig.ativo]);

  // Função estável para salvar webhook
  const stableSaveWebhookConfig = useCallback((webhookData: { url: string; ativo: boolean }) => {
    saveWebhookConfig(webhookData);
  }, [saveWebhookConfig]);

  // Salvar automaticamente as configurações quando mudarem (exceto primeira renderização)
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true);
      return;
    }

    const timer = setTimeout(() => {
      localStorage.setItem('app-settings', JSON.stringify(config));
      // Também salvar configuração do webhook
      stableSaveWebhookConfig({
        url: config.webhookUrl,
        ativo: config.webhookAtivo,
      });
    }, 500); // Debounce para evitar muitas escritas

    return () => clearTimeout(timer);
  }, [config, stableSaveWebhookConfig, isInitialized]);

  const handleSave = () => {
    // Salvar todas as configurações no localStorage
    localStorage.setItem('app-settings', JSON.stringify(config));
    
    // Salvar configuração do webhook
    saveWebhookConfig({
      url: config.webhookUrl,
      ativo: config.webhookAtivo,
    });
    
    toast({
      title: "Configurações salvas",
      description: "Suas configurações foram atualizadas com sucesso.",
    });
  };

  const handleTestWebhook = async () => {
    if (!config.webhookAtivo || !config.webhookUrl) {
      toast({
        title: "Webhook não configurado",
        description: "Configure e ative o webhook antes de testar.",
        variant: "destructive",
      });
      return;
    }

    await sendWebhook({
      test: true,
      message: "Teste de webhook do sistema de COMPs",
      timestamp: new Date().toISOString(),
    });
  };

  const handleTestReportData = async () => {
    if (!config.webhookAtivo || !config.webhookUrl) {
      toast({
        title: "Webhook não configurado",
        description: "Configure e ative o webhook antes de testar.",
        variant: "destructive",
      });
      return;
    }

    // Preparar campos de email (máximo 5)
    const emailFields: { [key: string]: string } = {};
    for (let i = 1; i <= 5; i++) {
      emailFields[`email_destino${i}`] = config.emailsDestino[i - 1] || "";
    }

    const testReportData = {
      acao: "dados relatorio",
      Data_relatorio: new Date().toISOString().split('T')[0],
      Valor_total_de_comps: "R$ 718,14",
      Gerente_diurno: "ALICE",
      Gerente_noturno: "QUERSON",
      Porcentagem_comps2: "1.39%",
      Porcentagem_comps4: "3.10%",
      Porcentagem_comps8: "4.54%",
      Porcentagem_comps11: "90.96%",
      Porcentagem_comps12: "0%",
      Porcentagem_comps13: "0%",
      ...emailFields,
      Texto_padrao_email: config.textoEmailPadrao
    };

    await sendWebhook(testReportData);
  };

  const handleTestEmployeeData = async () => {
    if (!config.webhookAtivo || !config.webhookUrl) {
      toast({
        title: "Webhook não configurado",
        description: "Configure e ative o webhook antes de testar.",
        variant: "destructive",
      });
      return;
    }

    const testEmployeeData = {
      acao: "dados funcionarios",
      Nome: "Maria",
      Total_de_comps: "R$ 685,51",
      Total_de_comps2: "R$ 10,00",
      Total_de_comps4: "R$ 22,26",
      Total_de_comps8: "",
      Total_de_comps11: "R$ 653,25",
      Total_de_comps12: "",
      Total_de_comps13: "",
      Justificativas: "26+65+/ ndwkkd/ teste"
    };

    await sendWebhook(testEmployeeData);
  };

  const handleTestAllData = async () => {
    if (!config.webhookAtivo || !config.webhookUrl) {
      toast({
        title: "Webhook não configurado",
        description: "Configure e ative o webhook antes de testar.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Iniciando teste completo",
      description: "Enviando dados de 2 funcionários + relatório...",
    });

    // 1. PRIMEIRO: Primeiro funcionário
    await handleTestEmployeeData();
    
    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. SEGUNDO: Segundo funcionário
    const testEmployee2Data = {
      acao: "dados funcionarios",
      Nome: "João",
      Total_de_comps: "R$ 32,63",
      Total_de_comps2: "",
      Total_de_comps4: "",
      Total_de_comps8: "R$ 32,63",
      Total_de_comps11: "",
      Total_de_comps12: "",
      Total_de_comps13: "",
      Justificativas: "mml65"
    };

    await sendWebhook(testEmployee2Data);
    
    // Aguardar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. POR ÚLTIMO: Dados do relatório (que dispara o email)
    // Preparar campos de email (máximo 5) - igual à produção
    const emailFields: { [key: string]: string } = {};
    for (let i = 1; i <= 5; i++) {
      emailFields[`email_destino${i}`] = config.emailsDestino[i - 1] || "";
    }

    const finalReportData = {
      acao: "dados relatorio",
      Data_relatorio: new Date().toISOString().split('T')[0],
      Valor_total_de_comps: "R$ 718,14",
      Gerente_diurno: "ALICE",
      Gerente_noturno: "QUERSON",
      Porcentagem_comps2: "1.39%",
      Porcentagem_comps4: "3.10%",
      Porcentagem_comps8: "4.54%",
      Porcentagem_comps11: "90.96%",
      Porcentagem_comps12: "0%",
      Porcentagem_comps13: "0%",
      ...emailFields,
      Texto_padrao_email: config.textoEmailPadrao
    };

    await sendWebhook(finalReportData);

    toast({
      title: "Teste completo finalizado",
      description: "Funcionários enviados primeiro, depois dados do relatório.",
    });
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

  const removeEmail = (email: string) => {
    setConfig(prev => ({
      ...prev,
      emailsDestino: prev.emailsDestino.filter(e => e !== email)
    }));
  };

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
              <TabsTrigger value="testes">
                <TestTube className="w-4 h-4 mr-2" />
                Testes
              </TabsTrigger>
              <TabsTrigger value="usuarios">
                <Users className="w-4 h-4 mr-2" />
                Usuários
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
                      Horário que define o início/fim do dia operacional
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor Máximo por COMP (R$)</Label>
                    <Input
                      type="number"
                      value={config.valorMaximoComp / 100}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        valorMaximoComp: parseFloat(e.target.value) * 100 
                      }))}
                      step="0.01"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL do Logotipo</Label>
                    <Input
                      value={config.logoUrl}
                      onChange={(e) => setConfig(prev => ({ ...prev, logoUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="email">
              <Card className="p-6 bg-gradient-card shadow-card">
                <h3 className="text-lg font-semibold mb-4">Configurações de E-mail</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>E-mails de Destino</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="email@exemplo.com"
                        onKeyDown={(e) => e.key === 'Enter' && addEmail()}
                      />
                      <Button onClick={addEmail} variant="outline">
                        Adicionar
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {config.emailsDestino.map((email) => (
                        <div key={email} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="text-sm">{email}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmail(email)}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Texto Padrão do E-mail</Label>
                    <Textarea
                      value={config.textoEmailPadrao}
                      onChange={(e) => setConfig(prev => ({ ...prev, textoEmailPadrao: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="fluxo">
              <Card className="p-6 bg-gradient-card shadow-card">
                <h3 className="text-lg font-semibold mb-4">Preferências de Cadastro</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Manter Tipo Selecionado</Label>
                      <p className="text-sm text-muted-foreground">
                        Manter o tipo de COMP selecionado entre lançamentos
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
                      <Label>Manter Waiter Selecionado</Label>
                      <p className="text-sm text-muted-foreground">
                        Manter o atendente selecionado entre lançamentos
                      </p>
                    </div>
                    <Switch
                      checked={config.manterWaiterSelecionado}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, manterWaiterSelecionado: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Haptic Feedback</Label>
                      <p className="text-sm text-muted-foreground">
                        Vibrar ao salvar um COMP
                      </p>
                    </div>
                    <Switch
                      checked={config.hapticFeedback}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, hapticFeedback: checked }))
                      }
                    />
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
                      <Globe className="h-4 w-4 text-info" />
                      <span className="font-medium text-info">Como configurar</span>
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• No Zapier: Criar um Zap com trigger "Webhooks by Zapier"</li>
                      <li>• Copiar a URL do webhook gerada</li>
                      <li>• Colar aqui e ativar a integração</li>
                      <li>• Os dados serão enviados automaticamente após confirmar o fechamento</li>
                    </ul>
                  </div>

                  {config.webhookAtivo && config.webhookUrl && (
                    <Button
                      variant="outline"
                      onClick={handleTestWebhook}
                      className="w-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Testar Webhook
                    </Button>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="testes">
              <Card className="p-6 bg-gradient-card shadow-card">
                <h3 className="text-lg font-semibold mb-4">Testes de Webhook</h3>
                <div className="space-y-6">
                  <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                    <div className="flex items-center gap-2 mb-2">
                      <TestTube className="h-4 w-4 text-warning" />
                      <span className="font-medium text-warning">Importante</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Os testes enviam dados realistas para validar a integração com o n8n.
                      Certifique-se de que o webhook está configurado e ativo.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Teste de Dados do Relatório</h4>
                      <p className="text-sm text-muted-foreground">
                        Testa o envio dos dados gerais do fechamento (data, gerentes, percentuais, valor total)
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleTestReportData}
                        className="w-full"
                        disabled={!config.webhookAtivo || !config.webhookUrl}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Testar Dados do Relatório
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Teste de Dados do Funcionário</h4>
                      <p className="text-sm text-muted-foreground">
                        Testa o envio dos dados individuais de um funcionário (nome, valores por tipo, justificativas)
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleTestEmployeeData}
                        className="w-full"
                        disabled={!config.webhookAtivo || !config.webhookUrl}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Testar Dados do Funcionário
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Teste Completo</h4>
                      <p className="text-sm text-muted-foreground">
                        Simula um fechamento completo: dados do relatório + 2 funcionários (como na produção)
                      </p>
                      <Button
                        onClick={handleTestAllData}
                        className="w-full bg-gradient-primary shadow-button"
                        disabled={!config.webhookAtivo || !config.webhookUrl}
                      >
                        <TestTube className="w-4 h-4 mr-2" />
                        Executar Teste Completo
                      </Button>
                    </div>
                  </div>

                  {(!config.webhookAtivo || !config.webhookUrl) && (
                    <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                      <p className="text-sm text-destructive">
                        Configure e ative o webhook na aba "Webhook" antes de executar os testes.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="usuarios">
              <Card className="p-6 bg-gradient-card shadow-card">
                <h3 className="text-lg font-semibold mb-4">Gerenciamento de Usuários</h3>
                <p className="text-muted-foreground mb-4">
                  Esta funcionalidade estará disponível em breve.
                </p>
                <Button variant="outline" disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Gerenciar Usuários
                </Button>
              </Card>
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} className="w-full h-12 bg-gradient-primary shadow-button">
            <Save className="w-5 h-5 mr-2" />
            Salvar Configurações
          </Button>
        </div>
      </Layout>
    </div>
  );
}