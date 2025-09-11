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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { useAuth } from "@/contexts/AuthContext";

export default function Closing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
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
    if (!nextAllowedSendTime) {
      setRemainingMinutes(0);
      return;
    }

    const updateRemainingTime = () => {
      const now = new Date();
      const timeDiff = nextAllowedSendTime.getTime() - now.getTime();
      const minutesLeft = Math.ceil(timeDiff / (1000 * 60));
      
      if (minutesLeft <= 0) {
        setRemainingMinutes(0);
        setNextAllowedSendTime(null);
        // Apenas notificar que o tempo expirou, sem recarregar automaticamente
        toast({
          title: "Pode enviar agora!",
          description: "O tempo de espera de 30 minutos foi concluído.",
          duration: 5000,
        });
        // Fechar o modal automaticamente quando o tempo expirar
        setShowDuplicateWarning(false);
      } else {
        setRemainingMinutes(minutesLeft);
      }
    };

    // Atualizar imediatamente
    updateRemainingTime();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(updateRemainingTime, 30000);
    
    return () => clearInterval(interval);
  }, [nextAllowedSendTime, toast]);
  
  // Verificar se já existe fechamento para o dia operacional
  const checkExistingClosing = async () => {
    try {
      console.log('🔍 Verificando fechamento existente para:', operationalDay);
      
      const { data: existingClosing, error } = await supabase
        .from('closings')
        .select('id, fechado_em_local, total_valor_centavos, total_qtd')
        .eq('dia_operacional', operationalDay)
        .order('fechado_em_local', { ascending: false });

      if (error) {
        console.error('❌ Erro ao verificar fechamento existente:', error);
        return { hasExisting: false, canSendNow: true, nextAllowedTime: null };
      }

      if (existingClosing && existingClosing.length > 0) {
        console.log('⚠️ Fechamento já existe para hoje:', existingClosing);
        
        // Verificar se o último fechamento foi há menos de 30 minutos
        const lastClosingTime = new Date(existingClosing[0].fechado_em_local);
        const now = new Date();
        const timeDiffMinutes = (now.getTime() - lastClosingTime.getTime()) / (1000 * 60);
        
        console.log('🕒 Tempo desde último fechamento:', timeDiffMinutes, 'minutos');
        
        if (timeDiffMinutes < 30) {
          // Calcular quando pode enviar novamente
          const nextAllowedTime = new Date(lastClosingTime.getTime() + (30 * 60 * 1000));
          console.log('⏰ Próximo envio permitido às:', nextAllowedTime.toLocaleTimeString('pt-BR'));
          
          setHasExistingClosing(true);
          return { 
            hasExisting: true, 
            canSendNow: false, 
            nextAllowedTime: nextAllowedTime,
            lastClosingTime: lastClosingTime 
          };
        }
        
        setHasExistingClosing(true);
        return { hasExisting: true, canSendNow: true, nextAllowedTime: null };
      }

      console.log('✅ Nenhum fechamento encontrado para hoje');
      return { hasExisting: false, canSendNow: true, nextAllowedTime: null };
    } catch (error) {
      console.error('❌ Erro ao verificar fechamento existente:', error);
      return { hasExisting: false, canSendNow: true, nextAllowedTime: null };
    }
  };
  
  const handleInitialClosing = async () => {
    console.log('🔍 DEBUG - Verificando fechamento duplicado para:', operationalDay);
    
    // Verificar se já existe fechamento antes de mostrar o formulário
    const closingStatus = await checkExistingClosing();
    
    console.log('🔍 DEBUG - Resultado da verificação:', { closingStatus, operationalDay });
    
    if (closingStatus.hasExisting) {
      if (!closingStatus.canSendNow && closingStatus.nextAllowedTime) {
        // Armazenar informações de tempo para exibir no modal
        setLastClosingTime(closingStatus.lastClosingTime || null);
        setNextAllowedSendTime(closingStatus.nextAllowedTime);
        
        // Mostrar aviso de tempo de espera
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
        
        // Mostrar modal com informações detalhadas
        setShowDuplicateWarning(true);
        return;
      } else {
        console.log('⚠️ AVISO: Fechamento duplicado detectado, mas pode enviar!');
        setLastClosingTime(closingStatus.lastClosingTime || null);
        setNextAllowedSendTime(null);
        setShowDuplicateWarning(true);
      }
    } else {
      console.log('✅ OK: Nenhum fechamento duplicado, continuando...');
      setShowManagerForm(true);
    }
  };

  const handleDuplicateClosing = () => {
    setShowDuplicateWarning(false);
    setShowManagerForm(true);
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

    // DEBUG: Verificar configurações de webhook
    console.log('🔍 DEBUG - Configurações de webhook:', {
      webhookAtivo: config.webhookAtivo,
      webhookUrl: config.webhookUrl,
      webhookUrlTrimmed: config.webhookUrl?.trim(),
      webhookUrlLength: config.webhookUrl?.length,
      configCompleto: config
    });

    // Verificar se o webhook está configurado
    if (!config.webhookAtivo || !config.webhookUrl || config.webhookUrl.trim() === '') {
      console.log('❌ WEBHOOK NÃO CONFIGURADO - Bloqueando fechamento');
      toast({
        title: "Webhook não configurado",
        description: "Configure um webhook nas configurações antes de fazer o fechamento.",
        variant: "destructive",
      });
      return;
    }

    console.log('✅ WEBHOOK CONFIGURADO - Prosseguindo com fechamento');

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

      // 🔥 REGISTRO DIRETO NO BANCO - FORÇANDO CACHE BREAK
      let closingId = null;
      try {
        const TIMESTAMP_CACHE_BREAK = Date.now(); // Força novo bundle
        const agora = new Date();
        
        // Criar data de início operacional de forma mais robusta
        const [year, month, day] = operationalDay.split('-').map(Number);
        const horaCorte = config?.horaCorte || '05:00';
        const [hours, minutes] = horaCorte.split(':').map(Number);
        
        const inicioOperacional = new Date(year, month - 1, day, hours, minutes, 0, 0);
        
        console.log(`🔧 CORREÇÃO HTTP 406 v2.0.7 [${TIMESTAMP_CACHE_BREAK}] - Registrando fechamento:`, {
          operationalDay,
          agora: agora.toISOString(),
          inicioOperacional: inicioOperacional.toISOString(),
          totalValue: closingSummary.totalValue,
          totalQuantity: closingSummary.totalQuantity,
          cacheBreaker: TIMESTAMP_CACHE_BREAK
        });

        const { data: closingData, error: closingError } = await supabase
          .from('closings')
          .insert({
            dia_operacional: operationalDay,
            periodo_inicio_local: inicioOperacional.toISOString(),
            periodo_fim_local: agora.toISOString(),
            total_valor_centavos: Math.round(closingSummary.totalValue * 100),
            total_qtd: closingSummary.totalQuantity,
            fechado_por: user?.id || '4728cc7d-d9c0-4f37-8eff-d3d1b511ca85', // Fallback temporário
            fechado_em_local: agora.toISOString(),
            enviado_para: config?.emailsDestino || [],
            observacao: `Fechamento realizado por ${morningManager} (manhã) e ${nightManager} (noite). Webhook enviado para ${config?.webhookUrl || 'N/A'}. Cache: ${TIMESTAMP_CACHE_BREAK}`,
          })
          .select('id')
          .single();

        if (closingError) {
          console.error(`❌ Erro ao registrar fechamento [${TIMESTAMP_CACHE_BREAK}]:`, closingError);
          // Não falhar o fechamento por causa disso, apenas logar
        } else {
          closingId = closingData?.id;
          console.log(`🎉 SUCESSO TOTAL v2.0.7 [${TIMESTAMP_CACHE_BREAK}] - AVISO DUPLICADO FUNCIONANDO! ID: ${closingId}`);
        }
      } catch (error) {
        console.error('❌ Erro ao processar registro do fechamento:', error);
        // Não falhar o fechamento por causa disso, apenas logar
      }

      // Enviar webhook com ID de fechamento
      if (closingId) {
        const webhookDataWithId = {
          ...generalData,
          closing_id: closingId
        };
        
        console.log('📤 Enviando webhook com ID de fechamento:', closingId);
        await sendWebhook(webhookDataWithId);
      } else {
        console.warn('⚠️ ID de fechamento não disponível, enviando webhook sem ID');
        await sendWebhook(generalData);
      }
      
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

  const canClose = !hasIssues && config.webhookAtivo && config.webhookUrl && config.webhookUrl.trim() !== ''; // Só pode fechar se não houver pendências e webhook estiver configurado
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

          {/* Status do Webhook */}
          <Card className="p-6 bg-gradient-card shadow-card">
            <h3 className="font-semibold mb-4">Status do Webhook</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {config.webhookAtivo && config.webhookUrl && config.webhookUrl.trim() !== '' ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="text-sm text-success">Webhook configurado e ativo</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span className="text-sm text-destructive">Webhook não configurado</span>
                  </>
                )}
              </div>
              {config.webhookAtivo && config.webhookUrl && (
                <div className="text-xs text-muted-foreground break-all">
                  URL: {config.webhookUrl}
                </div>
              )}
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
                <DialogDescription>
                  Selecione os gerentes responsáveis pelos turnos diurno e noturno
                </DialogDescription>
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

          {/* Dialog de Aviso de Fechamento Duplicado */}
          <Dialog open={showDuplicateWarning} onOpenChange={setShowDuplicateWarning}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>⚠️ Fechamento Já Realizado</DialogTitle>
                <DialogDescription>
                  Informações sobre o último fechamento e restrições de tempo
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-4 bg-warning/10 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <span className="font-medium text-warning">Atenção</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Já foi realizado um fechamento para o dia operacional <strong>{operationalDayDisplay}</strong>
                    {lastClosingTime && (
                      <> às <strong>{lastClosingTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong></>
                    )}.
                  </p>
                  
                  {nextAllowedSendTime ? (
                    <div className="mt-3 p-3 bg-destructive/10 rounded border border-destructive/20">
                      <p className="text-sm text-destructive font-medium">
                        ⏰ Relatórios só podem ser enviados a cada 30 minutos.
                      </p>
                      <p className="text-sm text-destructive mt-1">
                        Próximo envio permitido às: <strong>{nextAllowedSendTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">
                      Se você enviar novamente, será criado um novo registro no histórico. 
                      Tem certeza que deseja continuar?
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
                  {nextAllowedSendTime ? (
                    <Button 
                      disabled={true}
                      className="flex-1 bg-muted text-muted-foreground cursor-not-allowed"
                    >
                      Aguardar {remainingMinutes} min
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleDuplicateClosing}
                      className="flex-1 bg-warning hover:bg-warning/90"
                    >
                      Sim, Enviar Novamente
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {!canClose && (
            <Card className="p-4 bg-destructive/10 border-destructive">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span className="text-sm text-destructive">
                  {!config.webhookAtivo || !config.webhookUrl || config.webhookUrl.trim() === '' 
                    ? "Webhook não configurado. Configure um webhook nas configurações antes de fazer o fechamento."
                    : "Existem pendências que impedem o fechamento. Revise os COMPs antes de continuar."
                  }
                </span>
              </div>
            </Card>
          )}
        </div>
      </Layout>
    </div>
  );
}