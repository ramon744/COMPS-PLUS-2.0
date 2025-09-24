import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Save, Mail, Settings2, FileText, Send, History, Trash2, Loader2, Shield, User, RefreshCw } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions, usePermissionManagement } from "@/hooks/usePermissions";
import { ReportHistory } from "@/components/ReportHistory";
import { CleanupStatus } from "@/components/CleanupStatus";
import { ManagerEmailSettings } from "@/components/ManagerEmailSettings";
import { ManagerFlowSettings } from "@/components/ManagerFlowSettings";
import { PermissionManager } from "@/components/PermissionManager";
// import { WebhookTestTab } from "@/components/WebhookTestTab"; // Removido - arquivo não existe mais

export default function Settings() {
  const { config, setConfig, saveSettings, isLoading, isSaving } = useSettings();
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission, loadPermissions: reloadUserPermissions } = usePermissions();
  const { loadAllData: loadPermissions, testUserPermission } = usePermissionManagement();
  
  // Verificar se o usuário é ADM
  const isAdmin = user?.email === 'ramonflora2@gmail.com';
  
  
  
  const [emailInput, setEmailInput] = useState("");

  const handleSave = async () => {
    await saveSettings(config);
  };

  const addEmail = () => {
    if (emailInput && !config.emailsDestino?.includes(emailInput)) {
      setConfig(prev => {
        const newEmails = [...(prev.emailsDestino || []), emailInput];
        return {
          ...prev,
          emailsDestino: newEmails
        };
      });
      setEmailInput("");
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setConfig(prev => {
      const filteredEmails = (prev.emailsDestino || []).filter(email => email !== emailToRemove);
      return {
        ...prev,
        emailsDestino: filteredEmails
      };
    });
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
          <Tabs defaultValue={isAdmin ? "geral" : "email-individual"} className="space-y-6">
            {/* Barra de Abas Horizontal - Apenas Ícones */}
            <div className="space-y-2">
              <TabsList className="flex w-full justify-start gap-1 h-12 p-1 overflow-x-auto">
                {/* Abas Administrativas - Baseadas em Permissões */}
                {(isAdmin || hasPermission('access_settings_geral')) && (
                  <TabsTrigger value="geral" className="flex items-center justify-center w-12 h-10 p-0" title="Geral">
                    <Settings2 className="w-5 h-5" />
                  </TabsTrigger>
                )}
                {(isAdmin || hasPermission('access_settings_email')) && (
                  <TabsTrigger value="email" className="flex items-center justify-center w-12 h-10 p-0" title="E-mail Global">
                    <Mail className="w-5 h-5" />
                  </TabsTrigger>
                )}
                {(isAdmin || hasPermission('access_settings_webhook')) && (
                  <TabsTrigger value="webhook" className="flex items-center justify-center w-12 h-10 p-0" title="Webhook">
                    <Send className="w-5 h-5" />
              </TabsTrigger>
                )}
                {(isAdmin || hasPermission('access_settings_limpeza')) && (
                  <TabsTrigger value="limpeza" className="flex items-center justify-center w-12 h-10 p-0" title="Limpeza">
                    <Trash2 className="w-5 h-5" />
              </TabsTrigger>
                )}
                {isAdmin && (
                  <TabsTrigger value="teste-webhook" className="flex items-center justify-center w-12 h-10 p-0" title="Teste Webhook">
                    <Send className="w-5 h-5" />
              </TabsTrigger>
                )}
                {(isAdmin || hasPermission('access_settings_permissoes')) && (
                  <TabsTrigger value="permissoes" className="flex items-center justify-center w-12 h-10 p-0" title="Permissões">
                    <Shield className="w-5 h-5" />
              </TabsTrigger>
                )}
                
                {/* Abas Pessoais */}
                <TabsTrigger value="email-individual" className="flex items-center justify-center w-12 h-10 p-0" title="Meu E-mail">
                  <Mail className="w-5 h-5" />
              </TabsTrigger>
                <TabsTrigger value="fluxo" className="flex items-center justify-center w-12 h-10 p-0" title="Fluxo">
                  <FileText className="w-5 h-5" />
              </TabsTrigger>
                <TabsTrigger value="historico" className="flex items-center justify-center w-12 h-10 p-0" title="Histórico">
                  <History className="w-5 h-5" />
              </TabsTrigger>
            </TabsList>

              {/* Indicador de Seção Ativa */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>
                    {isAdmin ? "Configurações Administrativas e Pessoais" : "Configurações Pessoais"}
                  </span>
                </div>
                {!isAdmin && (
                  <Button 
                    onClick={async () => {
                      await reloadUserPermissions(true);
                      toast({
                        title: "Permissões Recarregadas",
                        description: "Suas permissões foram atualizadas. Verifique se as abas apareceram.",
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs h-6 px-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Recarregar
                  </Button>
                )}
              </div>
            </div>

            {(isAdmin || hasPermission('access_settings_geral')) && (
            <TabsContent value="geral">
              <Card className="p-6 bg-gradient-card shadow-card">
                <h3 className="text-lg font-semibold mb-4">Configurações Gerais</h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Hora de Corte do Dia Operacional</Label>
                    <Input
                      type="time"
                      value={config.horaCorte || "23:00"}
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
                      value={config.logoUrl || ""}
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
                      value={(config.valorMaximoComp || 50000) / 100}
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
            )}

            {(isAdmin || hasPermission('access_settings_email')) && (
            <TabsContent value="email">
              <Card className="p-6 bg-gradient-card shadow-card">
                  <h3 className="text-lg font-semibold mb-4">Configurações Globais de E-mail</h3>
                <div className="space-y-6">
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
                      {config.emailsDestino?.map((email, index) => (
                        <div key={`email-${email}-${index}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
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
                      E-mails que receberão o relatório de fechamento diário (configuração global)
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Configurações globais para todos os gerentes</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        disabled={isSaving}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Salvar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
              </TabsContent>
            )}

            <TabsContent value="email-individual">
              <ManagerEmailSettings />
            </TabsContent>

            <TabsContent value="fluxo">
              <ManagerFlowSettings />
            </TabsContent>

            {(isAdmin || hasPermission('access_settings_webhook')) && (
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
                      checked={config.webhookAtivo || false}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, webhookAtivo: checked }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>URL do Webhook</Label>
                    <Input
                      type="url"
                      value={config.webhookUrl || ""}
                      onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      disabled={!config.webhookAtivo}
                    />
                    <p className="text-sm text-muted-foreground">
                      URL que receberá os dados do fechamento (ex: Zapier, Make, etc.)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Intervalo entre Envios (segundos)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={config.webhookInterval || 2}
                      onChange={(e) => setConfig(prev => ({ ...prev, webhookInterval: parseInt(e.target.value) || 2 }))}
                      disabled={!config.webhookAtivo}
                      className="w-32"
                    />
                    <p className="text-sm text-muted-foreground">
                      Tempo de espera entre cada envio de dados (1-60 segundos)
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
                      <p>• Cada envio tem um intervalo de {config.webhookInterval || 2} segundos</p>
                      <p>• Use ferramentas como Zapier, Make ou n8n para processar os dados</p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="min-w-[120px]"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
            )}

            <TabsContent value="historico">
              <ReportHistory />
            </TabsContent>

            {(isAdmin || hasPermission('access_settings_limpeza')) && (
              <TabsContent value="limpeza">
                <CleanupStatus />
              </TabsContent>
            )}

            {/* Aba de Teste Webhook - Apenas ADM */}
            {isAdmin && (
              <TabsContent value="teste-webhook">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Teste de Webhook
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Teste o envio de dados para o webhook com dados idênticos aos de produção
                      </p>
                    </div>
                  </div>
                  
                  {/* <WebhookTestTab /> Removido - componente não existe mais */}
                </div>
              </TabsContent>
            )}

            {/* Aba de Permissões - ADM ou com permissão */}
            {(isAdmin || hasPermission('access_settings_permissoes')) && (
              <TabsContent value="permissoes">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <div>
                      <h3 className="text-lg font-semibold">Gerenciar Permissões</h3>
                        <p className="text-sm text-muted-foreground">
                        Controle o acesso dos gerentes às diferentes seções do sistema
                        </p>
                      </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={loadPermissions}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Recarregar
                      </Button>
                    </div>
                  </div>
                  <PermissionManager />
                </div>
            </TabsContent>
            )}

          </Tabs>

        </div>
      </Layout>
    </div>
  );
}