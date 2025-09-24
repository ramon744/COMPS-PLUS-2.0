// src/pages/Closing-nova.tsx
// Versão modificada para usar integração direta com planilha

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
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
import { useAuth } from "@/contexts/AuthContext";
import { formatDateBR } from "@/lib/utils";
import { sheetsIntegrationService, FechamentoData, WaiterData } from "@/services/sheetsIntegration";

export default function Closing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getClosingData } = useComps();
  const { sendWebhook, webhookInterval } = useWebhook();
  const { currentOperationalDay, formatOperationalDayDisplay } = useOperationalDay();
  const { getActiveManagers } = useRegistry();
  const { config } = useSettings();
  const [isClosing, setIsClosing] = useState(false);
  const [showManagerForm, setShowManagerForm] = useState(false);
  const [morningManager, setMorningManager] = useState("");
  const [nightManager, setNightManager] = useState("");
  const [reportDate, setReportDate] = useState(currentOperationalDay);
  const [progress, setProgress] = useState(0);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [hasExistingClosing, setHasExistingClosing] = useState(false);
  const [lastClosingTime, setLastClosingTime] = useState<Date | null>(null);
  const [nextAllowedSendTime, setNextAllowedSendTime] = useState<Date | null>(null);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(0);

  // Get real data from context
  const closingSummary = getClosingData();

  const operationalDay = currentOperationalDay; // Usar formato ISO (YYYY-MM-DD) diretamente
  const operationalDayDisplay = formatOperationalDayDisplay(currentOperationalDay); // Para exibição apenas

  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const hasIssues = false; // Verificar se há pendências
  
  // Contador em tempo real para minutos restantes
  useEffect(() => {
    if (nextAllowedSendTime) {
      const interval = setInterval(() => {
      const now = new Date();
        const diff = nextAllowedSendTime.getTime() - now.getTime();
      
        if (diff <= 0) {
        setRemainingMinutes(0);
        setNextAllowedSendTime(null);
      } else {
          setRemainingMinutes(Math.ceil(diff / (1000 * 60)));
        }
      }, 1000);
    
    return () => clearInterval(interval);
    }
  }, [nextAllowedSendTime]);
  
  // Verificar se já existe fechamento para este dia
  const checkExistingClosing = async () => {
    try {
      const { data: existingClosing, error } = await supabase
        .from('closings')
        .select('fechado_em_local')
        .eq('dia_operacional', operationalDay)
        .order('fechado_em_local', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar fechamento existente:', error);
        return { hasExisting: false, canSendNow: true, nextAllowedTime: null };
      }

      if (existingClosing) {
        const lastClosing = new Date(existingClosing.fechado_em_local);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastClosing.getTime()) / (1000 * 60);
        
        setLastClosingTime(lastClosing);
        setHasExistingClosing(true);
        
        if (diffMinutes < 30) {
          const nextAllowed = new Date(lastClosing.getTime() + (30 * 60 * 1000));
          setNextAllowedSendTime(nextAllowed);
          return { hasExisting: true, canSendNow: false, nextAllowedTime: nextAllowed };
        }
      }

      return { hasExisting: false, canSendNow: true, nextAllowedTime: null };
    } catch (error) {
      console.error('Erro ao verificar fechamento existente:', error);
      return { hasExisting: false, canSendNow: true, nextAllowedTime: null };
    }
  };

  const handleCancelDuplicate = () => {
    setShowDuplicateWarning(false);
    setHasExistingClosing(false);
  };

  const handleFinalClosing = async () => {
    if (!morningManager || !nightManager) {
      toast({
        title: "Erro",
        description: "Por favor, preencha os nomes dos gerentes.",
        variant: "destructive",
        duration: 2000,
      });
      return;
    }

    // Verificar novamente se pode enviar (verificação de tempo)
    const closingStatus = await checkExistingClosing();
    
    if (closingStatus.hasExisting && !closingStatus.canSendNow && closingStatus.nextAllowedTime) {
      const nextTimeFormatted = closingStatus.nextAllowedTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      toast({
        title: "Aguarde para enviar novamente",
        description: `Relatórios só podem ser enviados a cada 30 minutos. Próximo envio permitido às ${nextTimeFormatted}.`,
        variant: "destructive",
        duration: 8000,
      });
      return;
    }

    console.log('✅ INICIANDO FECHAMENTO COM INTEGRAÇÃO DIRETA NA PLANILHA');
    await processarFechamentoComPlanilha();
  };

  const processarFechamentoComPlanilha = async () => {
    console.log('🔄 Iniciando fechamento - setando isClosing para true');
    setIsClosing(true);
    setProgress(0);
    console.log('📊 Estado inicial - isClosing:', true, 'progress:', 0);
    
    try {
      // Preparar dados para a planilha
      console.log('🔍 DEBUG - Dados do closingSummary:', closingSummary);
      console.log('🔍 DEBUG - byWaiter:', closingSummary.byWaiter);
      
      const waiters: WaiterData[] = closingSummary.byWaiter
        .filter(w => w.value > 0)
        .map(waiter => {
          console.log('🔍 DEBUG - Processando waiter:', waiter);

          // Calcular valores por tipo de COMP para este funcionário
          const typeGroups: { [key: string]: number } = {};
          if (waiter.details) {
            console.log('🔍 DEBUG - Details do waiter:', waiter.details);
            waiter.details.forEach((comp: any) => {
              // Mapear corretamente os tipos de COMP
              let typeKey = '';
              const compType = comp.type.toLowerCase().replace(/\s+/g, '');
              
              if (compType.includes('2')) {
                typeKey = 'comps2';
              } else if (compType.includes('4')) {
                typeKey = 'comps4';
              } else if (compType.includes('8')) {
                typeKey = 'comps8';
              } else if (compType.includes('11')) {
                typeKey = 'comps11';
              } else if (compType.includes('12')) {
                typeKey = 'comps12';
              } else if (compType.includes('13')) {
                typeKey = 'comps13';
              }
              
              if (typeKey) {
              typeGroups[typeKey] = (typeGroups[typeKey] || 0) + comp.value;
              }
              
              console.log(`🔍 DEBUG - COMP tipo "${comp.type}" mapeado para "${typeKey}" com valor ${comp.value}`);
            });
          }

          // Coletar justificativas dos COMPs deste funcionário
          const justificativas = waiter.details
            ?.map((comp: any) => comp.motivo)
            .filter(Boolean)
            .join('/ ') || '';

          const waiterData = {
            nome: waiter.name,
            total: waiter.value / 100, // Converter centavos para reais
            comps2: (typeGroups.comps2 || 0) / 100, // Converter centavos para reais
            comps4: (typeGroups.comps4 || 0) / 100, // Converter centavos para reais
            comps8: (typeGroups.comps8 || 0) / 100, // Converter centavos para reais
            comps11: (typeGroups.comps11 || 0) / 100, // Converter centavos para reais
            comps12: (typeGroups.comps12 || 0) / 100, // Converter centavos para reais
            comps13: (typeGroups.comps13 || 0) / 100, // Converter centavos para reais
            justificativas: justificativas
          };
          
          console.log('🔍 DEBUG - WaiterData criado:', waiterData);
          return waiterData;
        });
      
      console.log('🔍 DEBUG - Waiters finais preparados:', waiters);
      console.log('🔍 DEBUG - Quantidade de waiters:', waiters.length);

      // Calcular porcentagens
      const porcentagens = sheetsIntegrationService.calcularPorcentagens(waiters);

      // Converter data para formato brasileiro DD/MM/AAAA
      const dataFormatoBrasileiro = (() => {
        if (reportDate && reportDate.includes('-')) {
          const [year, month, day] = reportDate.split('-');
          return `${day}/${month}/${year}`;
        }
        return reportDate;
      })();

      // Preparar dados do fechamento
      const fechamentoData: FechamentoData = {
        dataOperacional: dataFormatoBrasileiro,
        gerenteDiurno: morningManager,
        gerenteNoturno: nightManager,
        totalComps: closingSummary.totalValue / 100, // Converter centavos para reais
        waiters: waiters,
        porcentagens: porcentagens
      };

      console.log('📋 Dados preparados para planilha:', fechamentoData);

      // Processar fechamento na planilha
      setProgress(25);
      const resultado = await sheetsIntegrationService.processarFechamento(fechamentoData, (progress) => {
        setProgress(progress);
        console.log(`📊 Progresso: ${progress}%`);
      });

      if (resultado.success) {
        setProgress(75);

        // Registrar fechamento no banco de dados
        const agora = new Date();
        const [year, month, day] = operationalDay.split('-').map(Number);
        const horaCorte = config?.horaCorte || '05:00';
        const [hours, minutes] = horaCorte.split(':').map(Number);
        const inicioOperacional = new Date(year, month - 1, day, hours, minutes, 0, 0);

        const { data: closingData, error: closingError } = await supabase
          .from('closings')
          .insert({
            dia_operacional: operationalDay,
            periodo_inicio_local: inicioOperacional.toISOString(),
            periodo_fim_local: agora.toISOString(),
            total_valor_centavos: Math.round(closingSummary.totalValue * 100),
            total_qtd: closingSummary.totalQuantity,
            fechado_por: user?.id || '4728cc7d-d9c0-4f37-8eff-d3d1b511ca85',
            fechado_em_local: agora.toISOString(),
            enviado_para: config?.emailsDestino || [],
            observacao: `Fechamento realizado por ${morningManager} (manhã) e ${nightManager} (noite). Dados enviados diretamente para planilha Google Sheets.`,
          })
          .select('id')
          .single();

        if (closingError) {
          console.error('❌ Erro ao registrar fechamento no banco:', closingError);
          throw new Error(`Erro ao registrar fechamento: ${closingError.message}`);
        }

      setProgress(100);
      
      toast({
        title: "Dia fechado com sucesso!",
          description: "Todos os dados foram enviados diretamente para a planilha Google Sheets.",
          duration: 3000,
      });
      
      // Fechar o diálogo imediatamente
      setShowManagerForm(false);
      
      // Redirecionar para a página principal após 1 segundo
      setTimeout(() => {
        navigate('/');
      }, 1000);
      } else {
        throw new Error(resultado.message);
      }
      
    } catch (error) {
      console.error('Erro no fechamento:', error);
      toast({
        title: "Erro no fechamento",
        description: `Ocorreu um erro durante o processo de fechamento: ${error.message}`,
        variant: "destructive",
        duration: 5000,
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
              <p className="text-2xl font-bold text-primary mt-1">{(() => {
                const [year, month, day] = operationalDay.split('-');
                return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('pt-BR');
              })()}</p>
              <p className="text-sm text-muted-foreground mt-2">{operationalDayDisplay}</p>
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
                  <div key={type.name} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        {type.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {type.count} itens
                      </span>
                      </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{formatCurrency(type.value)}</p>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Top Waiters */}
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Top Atendentes</h3>
            </div>
            <div className="space-y-3">
              {closingSummary.byWaiter.slice(0, 5).map((waiter, index) => (
                <div key={waiter.name} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-primary">#{index + 1}</span>
                    <span className="text-sm font-medium">{waiter.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(waiter.value)}</p>
                    <p className="text-xs text-muted-foreground">{waiter.count} itens</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Botão de Fechamento */}
          <Card className="p-6 bg-gradient-card shadow-card">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <h3 className="font-semibold">Pronto para Fechar</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Todos os dados estão corretos e prontos para serem enviados para a planilha.
              </p>
              <Button 
                onClick={() => setShowManagerForm(true)}
                disabled={!canClose}
                className="w-full bg-gradient-primary"
                size="lg"
              >
                Fechar & Enviar para Planilha
              </Button>
            </div>
          </Card>

          {/* Progress Bar */}
          {isClosing && (
          <Card className="p-6 bg-gradient-card shadow-card">
              <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm font-medium">Processando fechamento...</span>
              </div>
                <Progress value={progress} className="w-full" />
                <p className="text-xs text-muted-foreground text-center">
                  Enviando dados para a planilha Google Sheets...
                </p>
            </div>
          </Card>
          )}

          {/* Modal de Informações dos Gerentes */}
          <Dialog open={showManagerForm} onOpenChange={setShowManagerForm}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Informações dos Gerentes</DialogTitle>
                <DialogDescription>
                  Selecione os gerentes responsáveis pelos turnos diurno e noturno
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
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

                {/* Barra de progresso no modal */}
                {isClosing && (
                  <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">
                        🔄 Processando fechamento...
                      </span>
                      <span className="text-sm text-blue-600 font-bold">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-3">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      {progress < 25 && "📋 Enviando cabeçalho..."}
                      {progress >= 25 && progress < 100 && "👥 Enviando dados dos waiters..."}
                      {progress === 100 && "✅ Fechamento concluído!"}
                    </div>
                  </div>
                )}

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

          {/* Modal de Aviso de Duplicata */}
          <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Fechamento já realizado
                </DialogTitle>
                <DialogDescription>
                  Já existe um fechamento para este dia operacional.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 bg-warning/10 rounded-lg">
                  <p className="text-sm text-warning">
                    <strong>Último fechamento:</strong> {lastClosingTime?.toLocaleString('pt-BR')}
                  </p>
                  {nextAllowedSendTime && (
                    <p className="text-sm text-warning mt-2">
                      <strong>Próximo envio permitido:</strong> {nextAllowedSendTime.toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelDuplicate}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                    <Button 
                    onClick={handleFinalClosing}
                    disabled={!nextAllowedSendTime || remainingMinutes > 0}
                    className="flex-1 bg-gradient-primary"
                  >
                    {remainingMinutes > 0 ? `Aguardar ${remainingMinutes}min` : "Enviar Novamente"}
                    </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Layout>
    </div>
  );
}
