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
import { Save, Mail, Settings2, FileText, Send, History, Trash2, Loader2 } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ReportHistory } from "@/components/ReportHistory";
import { CleanupStatus } from "@/components/CleanupStatus";
import { ManagerEmailSettings } from "@/components/ManagerEmailSettings";
import { ManagerFlowSettings } from "@/components/ManagerFlowSettings";

export default function Settings() {
  const { config, setConfig, saveSettings, isLoading, isSaving } = useSettings();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [emailInput, setEmailInput] = useState("");

  // Verificar se o usuário é ADM
  const isAdmin = user?.email === 'ramonflora2@gmail.com';

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
            <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-7' : 'grid-cols-3'}`}>
              {isAdmin && (
                <>
                  <TabsTrigger value="geral">
                    <Settings2 className="w-4 h-4 mr-2" />
                    Geral
                  </TabsTrigger>
                  <TabsTrigger value="email">
                    <Mail className="w-4 h-4 mr-2" />
                    E-mail
                  </TabsTrigger>
                  <TabsTrigger value="webhook">
                    <Send className="w-4 h-4 mr-2" />
                    Webhook
                  </TabsTrigger>
                  <TabsTrigger value="limpeza">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpeza
                  </TabsTrigger>
                </>
              )}
              <TabsTrigger value="email-individual">
                <Mail className="w-4 h-4 mr-2" />
                Meu E-mail
              </TabsTrigger>
              <TabsTrigger value="fluxo">
                <FileText className="w-4 h-4 mr-2" />
                Fluxo
              </TabsTrigger>
              <TabsTrigger value="historico">
                <History className="w-4 h-4 mr-2" />
                Histórico
              </TabsTrigger>
            </TabsList>

            {isAdmin && (
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
            )}

            {isAdmin && (
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

            {isAdmin && (
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
            )}

            <TabsContent value="historico">
              <ReportHistory />
            </TabsContent>

            {isAdmin && (
              <TabsContent value="limpeza">
                <CleanupStatus />
              </TabsContent>
            )}

          </Tabs>

        </div>
      </Layout>
    </div>
  );
}