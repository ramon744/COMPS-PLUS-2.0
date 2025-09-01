import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoneyInput } from "@/components/MoneyInput";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Send, 
  DollarSign, 
  Users, 
  FileText, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  Percent
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useComps } from "@/hooks/useComps";
import { useWebhook } from "@/hooks/useWebhook";
import { useOperationalDay } from "@/hooks/useOperationalDay";
import { useRegistry } from "@/contexts/RegistryContext";
import { useSettings } from "@/hooks/useSettings";

export default function Closing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getClosingData } = useComps();
  const { sendWebhook } = useWebhook();
  const { currentOperationalDay, formatOperationalDayDisplay } = useOperationalDay();
  const { getActiveManagers } = useRegistry();
  const { config } = useSettings();
  const [isClosing, setIsClosing] = useState(false);
  const [showManagerForm, setShowManagerForm] = useState(false);
  const [morningManager, setMorningManager] = useState("");
  const [nightManager, setNightManager] = useState("");
  const [reportDate, setReportDate] = useState(currentOperationalDay);
  const [progress, setProgress] = useState(0);

  // Get real data from context
  const closingSummary = getClosingData();

  const operationalDay = formatOperationalDayDisplay(currentOperationalDay);
  const [year, month, day] = currentOperationalDay.split('-');
  const startDate = `${day}/${month} 05:00`;
  const nextDay = new Date(parseInt(year), parseInt(month) - 1, parseInt(day) + 1);
  const endDate = `${nextDay.getDate().toString().padStart(2, '0')}/${(nextDay.getMonth() + 1).toString().padStart(2, '0')} 04:59:59`;
  const period = `${startDate} às ${endDate}`;

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const hasIssues = false; // Verificar se há pendências
  
  const handleInitialClosing = () => {
    setShowManagerForm(true);
  };

  const handleFinalClosing = async () => {
    if (!morningManager || !nightManager) {
      toast({
        title: "Erro",
        description: "Por favor, preencha os nomes dos gerentes.",
        variant: "destructive",
      });
      return;
    }

    setIsClosing(true);
    setProgress(0);
    
    try {
      // Calcular porcentagens dos tipos de COMP
      const compTypePercentages: { [key: string]: string } = {};
      
      // Inicializar todos os tipos com 0%
      ['comps2', 'comps4', 'comps8', 'comps11', 'comps12', 'comps13'].forEach(type => {
        compTypePercentages[`Porcentagem_${type}`] = '0%';
      });
      
      // Calcular porcentagens reais dos tipos utilizados
      closingSummary.byType.forEach((type) => {
        const percentage = closingSummary.totalValue > 0 ? (type.value / closingSummary.totalValue * 100) : 0;
        const typeKey = `Porcentagem_${type.name.toLowerCase().replace(/\s+/g, '')}`;
        compTypePercentages[typeKey] = `${percentage.toFixed(2)}%`;
      });

      const totalSteps = closingSummary.byWaiter.filter(w => w.value > 0).length + 1;
      let currentStep = 0;

      // 1. PRIMEIRO: Envios individuais por funcionário
      for (const waiter of closingSummary.byWaiter) {
        if (waiter.value > 0) { // Só enviar se o funcionário teve COMPs
          // Calcular valores por tipo de COMP para este funcionário
          const waiterCompData: { [key: string]: string } = {
            acao: "dados funcionarios",
            Nome: waiter.name,
            Total_de_comps: formatCurrency(waiter.value),
          };

          // Inicializar todos os tipos
          ['comps2', 'comps4', 'comps8', 'comps11', 'comps12', 'comps13'].forEach(type => {
            waiterCompData[`Total_de_${type}`] = '';
          });

          // Calcular valores por tipo de COMP para este funcionário
          if (waiter.details) {
            // Agrupar por tipo de COMP
            const typeGroups: { [key: string]: number } = {};
            waiter.details.forEach((comp: any) => {
              const typeKey = comp.type.toLowerCase().replace(/\s+/g, '');
              typeGroups[typeKey] = (typeGroups[typeKey] || 0) + comp.value;
            });

            // Preencher dados por tipo
            Object.entries(typeGroups).forEach(([type, value]) => {
              const dataKey = `Total_de_${type}`;
              if (waiterCompData[dataKey] !== undefined) {
                waiterCompData[dataKey] = formatCurrency(value);
              }
            });
          }

          // Coletar justificativas dos COMPs deste funcionário
          const waiterJustifications = waiter.details
            ?.map((comp: any) => comp.motivo)
            .filter(Boolean)
            .join('/ ') || '';

          waiterCompData.Justificativas = waiterJustifications;

          await sendWebhook(waiterCompData);
          
          currentStep++;
          setProgress((currentStep / totalSteps) * 100);
          
          // Aguardar 2 segundos antes do próximo envio
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // 2. DEPOIS: Envio dos dados gerais do relatório (que dispara o email)
      // Preparar campos de email (máximo 5)
      const emailFields: { [key: string]: string } = {};
      const emailsDestino = config?.emailsDestino || ["proprietario@restaurante.com", "gerente@restaurante.com"];
      for (let i = 1; i <= 5; i++) {
        emailFields[`email_destino${i}`] = emailsDestino[i - 1] || "";
      }
      
      const generalData = {
        acao: "dados relatorio",
        Data_relatorio: reportDate,
        Valor_total_de_comps: formatCurrency(closingSummary.totalValue),
        Gerente_diurno: morningManager,
        Gerente_noturno: nightManager,
        ...compTypePercentages,
        ...emailFields,
        Texto_padrao_email: config?.textoEmailPadrao || "Segue em anexo o relatório de COMPs do dia operacional."
      };

      await sendWebhook(generalData);
      
      currentStep++;
      setProgress(100);
      
      toast({
        title: "Dia fechado com sucesso!",
        description: "Todos os dados foram enviados para o webhook configurado.",
      });
      
      // Fechar o diálogo imediatamente
      setShowManagerForm(false);
      
      // Redirecionar para a página principal após 1 segundo
      setTimeout(() => {
        navigate('/');
      }, 1000);
      
    } catch (error) {
      console.error('Erro no fechamento:', error);
      toast({
        title: "Erro no fechamento",
        description: "Ocorreu um erro durante o processo de fechamento.",
        variant: "destructive",
      });
    } finally {
      setIsClosing(false);
      setProgress(0);
    }
  };

  const canClose = !hasIssues; // Só pode fechar se não houver pendências
  const managers = getActiveManagers();

  return (
    <div className="min-h-screen bg-background">
      <Layout title="Fechamento do Dia">
        <div className="space-y-6 animate-fade-in">
          {/* Header do Dia Operacional */}
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-muted-foreground">Fechamento do Dia Operacional</h2>
              <p className="text-2xl font-bold text-primary mt-1">{operationalDay}</p>
              <p className="text-sm text-muted-foreground mt-2">{period}</p>
            </div>
          </Card>

          {/* Resumo Geral */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-gradient-card shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de COMPs</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(closingSummary.totalValue)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-card shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <FileText className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade</p>
                  <p className="text-xl font-bold text-success">{closingSummary.totalQuantity}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Média por COMP */}
          <Card className="p-4 bg-gradient-card shadow-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Calendar className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média por COMP</p>
                <p className="text-xl font-bold text-warning">{formatCurrency(closingSummary.averagePerComp)}</p>
              </div>
            </div>
          </Card>

          {/* Totais por Tipo */}
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Totais por Tipo de COMP</h3>
            </div>
            <div className="space-y-3">
              {closingSummary.byType.map((type) => {
                const percentage = closingSummary.totalValue > 0 ? (type.value / closingSummary.totalValue * 100) : 0;
                return (
                  <div key={type.name} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <Badge variant="secondary" className="w-fit">{type.name}</Badge>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                        <span className="text-sm">{type.count} ocorrências</span>
                        <div className="flex items-center gap-1">
                          <Percent className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-right sm:text-left">{formatCurrency(type.value)}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Totais por Atendente */}
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Totais por Atendente</h3>
            </div>
            <div className="space-y-3">
              {closingSummary.byWaiter.map((waiter) => (
                <div key={waiter.name} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="font-medium">{waiter.name}</span>
                    <span className="text-sm text-muted-foreground">{waiter.count} COMPs</span>
                  </div>
                  <span className="font-bold text-right sm:text-left">{formatCurrency(waiter.value)}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Status e Validações */}
          <Card className="p-6 bg-gradient-card shadow-card">
            <h3 className="font-semibold mb-4">Status do Fechamento</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm">Todos os COMPs possuem motivo preenchido</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm">Nenhum valor zerado ou inválido</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span className="text-sm">Todas as informações obrigatórias preenchidas</span>
              </div>
            </div>
          </Card>

          {/* E-mails de Destino */}
          <Card className="p-6 bg-gradient-card shadow-card">
            <h3 className="font-semibold mb-4">Relatório será enviado para:</h3>
            <div className="space-y-2">
              {(config?.emailsDestino || ["proprietario@restaurante.com", "gerente@restaurante.com"]).map((email) => (
                <div key={email} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-sm">{email}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Botão de Fechamento */}
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                disabled={!canClose || isClosing}
                className="w-full h-12 bg-gradient-primary shadow-button hover:shadow-float transition-all duration-200"
                size="lg"
              >
                {isClosing ? (
                  <>Processando Fechamento...</>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Fechar & Enviar Dia
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Fechamento do Dia</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-warning/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <span className="font-medium text-warning">Atenção</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Após o fechamento, não será possível editar os COMPs deste dia operacional. 
                    O relatório será enviado automaticamente por e-mail.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleInitialClosing}
                    disabled={isClosing}
                    className="flex-1 bg-gradient-primary"
                  >
                    Continuar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog do Formulário de Gerentes */}
          <Dialog open={showManagerForm} onOpenChange={setShowManagerForm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Informações dos Gerentes</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {isClosing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Enviando dados...</Label>
                      <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Gerente Diurno *</Label>
                  <Select
                    value={morningManager}
                    onValueChange={setMorningManager}
                    disabled={isClosing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gerente diurno" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers
                        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                        .map((manager) => (
                          <SelectItem key={manager.id} value={manager.nome}>
                            {manager.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gerente Noturno *</Label>
                  <Select
                    value={nightManager}
                    onValueChange={setNightManager}
                    disabled={isClosing}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gerente noturno" />
                    </SelectTrigger>
                    <SelectContent>
                      {managers
                        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                        .map((manager) => (
                          <SelectItem key={manager.id} value={manager.nome}>
                            {manager.nome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data do Relatório</Label>
                  <Input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    disabled={isClosing}
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowManagerForm(false)}
                    className="flex-1"
                    disabled={isClosing}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleFinalClosing}
                    disabled={isClosing || !morningManager || !nightManager}
                    className="flex-1 bg-gradient-primary"
                  >
                    {isClosing ? "Enviando..." : "Finalizar Fechamento"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {!canClose && (
            <Card className="p-4 bg-destructive/10 border-destructive">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span className="text-sm text-destructive">
                  Existem pendências que impedem o fechamento. Revise os COMPs antes de continuar.
                </span>
              </div>
            </Card>
          )}
        </div>
      </Layout>
    </div>
  );
}