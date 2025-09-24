import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { Download, Calendar, Filter, TrendingUp, DollarSign, Crown, Users, Target, AlertTriangle } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useReports } from "@/hooks/useReports";
import { WaiterRankingChart } from "@/components/charts/WaiterRankingChart";
import { ManagerRankingChart } from "@/components/charts/ManagerRankingChart";
import { useAuth } from "@/contexts/AuthContext";
import { useOperationalDay } from "@/hooks/useOperationalDay";
import { useRegistry } from "@/contexts/RegistryContext";
import { usePerdaServico } from "@/contexts/PerdaServicoContext";
import { exportToExcel, exportToExcelFormatoImagem } from "@/utils/excelExport";
import { exportToPDF, generatePDFFilename } from "@/utils/pdfExport";
import { Comp, CompType, Waiter } from "@/types";
import PDFReport from "@/components/PDFReport";
import { SpreadsheetViewer } from '@/components/SpreadsheetViewer';
import { useRef } from "react";

export default function Reports() {
  const { 
    getReportsData, 
    getWaiterRanking, 
    getManagerRanking, 
    getManagerCompsData, 
    getCurrentManagerStats,
    formatCurrency,
    comps,
    compTypes,
    waiters,
    managerProfiles
  } = useReports();
  const { user } = useAuth();
  const { currentOperationalDay } = useOperationalDay();
  const { isLoading: registryLoading } = useRegistry();
  const { perdas: allPerdas, getPerdasByDateRange, isLoading: perdasLoading } = usePerdaServico();
  
  const [dateRange, setDateRange] = useState({
    start: currentOperationalDay,
    end: currentOperationalDay
  });
  const [reportType, setReportType] = useState("diario");
  const [selectedWaiter, setSelectedWaiter] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  
  // Referência para o componente PDF
  const pdfRef = useRef<HTMLDivElement>(null);

  // Função para calcular datas baseadas no tipo de relatório
  const calculateDateRange = (type: string) => {
    const today = new Date(currentOperationalDay);
    
    switch (type) {
      case "diario":
        return {
          start: currentOperationalDay,
          end: currentOperationalDay
        };
      case "semanal":
        const startWeek = startOfWeek(today, { weekStartsOn: 1 }); // Segunda-feira
        const endWeek = endOfWeek(today, { weekStartsOn: 1 });
        return {
          start: format(startWeek, 'yyyy-MM-dd'),
          end: format(endWeek, 'yyyy-MM-dd')
        };
      case "mensal":
        const startMonth = startOfMonth(today);
        const endMonth = endOfMonth(today);
        return {
          start: format(startMonth, 'yyyy-MM-dd'),
          end: format(endMonth, 'yyyy-MM-dd')
        };
      default:
        return dateRange; // Mantém as datas atuais para personalizado
    }
  };

  // Effect para atualizar datas quando o tipo de relatório mudar
  useEffect(() => {
    if (reportType !== "personalizado") {
      const newDateRange = calculateDateRange(reportType);
      setDateRange(newDateRange);
    }
  }, [reportType, currentOperationalDay]);

  // Criar objeto de filtros
  const filters = {
    startDate: dateRange.start,
    endDate: dateRange.end,
    reportType,
    selectedType,
  };

  // Aplicar filtros aos dados
  const { reportData, typeData } = getReportsData(filters);
  const waiterRanking = getWaiterRanking(filters);
  const managerRanking = getManagerRanking(filters);
  const managerCompsData = getManagerCompsData(filters);
  const currentManagerStats = getCurrentManagerStats(filters);

  // Função para calcular o dia operacional baseado na data de criação (mesma lógica da aba Perdas de Serviço)
  const calculateOperationalDay = (createdAt: string): string => {
    const date = new Date(createdAt);
    
    // Se foi criado antes das 5h, pertence ao dia operacional anterior
    if (date.getHours() < 5) {
      const previousDay = new Date(date);
      previousDay.setDate(previousDay.getDate() - 1);
      const year = previousDay.getFullYear();
      const month = String(previousDay.getMonth() + 1).padStart(2, '0');
      const day = String(previousDay.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Formato YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filtrar perdas de serviço pelos mesmos filtros que os COMPs
  const perdas = allPerdas.filter(perda => {
    // Calcular o dia operacional da perda
    const perdaDiaOperacional = calculateOperationalDay(perda.created_at);
    
    // Verificar se a perda pertence ao período selecionado
    const isInDateRange = perdaDiaOperacional >= dateRange.start && perdaDiaOperacional <= dateRange.end;
    
    // Filtro por atendente (se selecionado)
    const matchesWaiter = selectedWaiter === "all" || perda.atendente_nome === selectedWaiter;
    
    return isInDateRange && matchesWaiter;
  });

  const totalValue = reportData.reduce((sum, item) => sum + item.valor, 0);
  const totalQuantity = reportData.reduce((sum, item) => sum + item.quantidade, 0);
  const averageValue = totalQuantity > 0 ? totalValue / totalQuantity : 0;

  const exportReport = async (format: "pdf" | "csv" | "excel" | "excel-formato") => {
    if (format === "excel") {
      try {
        // Converter os dados para o formato esperado pela função de exportação
        const exportData = {
          comps: comps,
          compTypes: compTypes as CompType[],
          waiters: waiters as Waiter[],
          managers: managerProfiles.map(manager => ({
            id: manager.id,
            nome: manager.nome,
            email: manager.email
          })),
          filters,
          formatCurrency
        };
        
        exportToExcel(exportData);
      } catch (error) {
        console.error('Erro ao exportar Excel:', error);
      }
    } else if (format === "excel-formato") {
      try {
        // Exportar no formato da imagem
        const exportData = {
          comps: comps,
          compTypes: compTypes as CompType[],
          waiters: waiters as Waiter[],
          managers: managerProfiles.map(manager => ({
            id: manager.id,
            nome: manager.nome,
            email: manager.email
          })),
          filters,
          formatCurrency
        };
        
        exportToExcelFormatoImagem(exportData);
      } catch (error) {
        console.error('Erro ao exportar Excel formato imagem:', error);
      }
    } else if (format === "pdf") {
      try {
        if (pdfRef.current) {
          const filename = generatePDFFilename(filters);
          await exportToPDF(pdfRef.current, filename);
        } else {
          console.error('Referência do PDF não encontrada');
        }
      } catch (error) {
        console.error('Erro ao exportar PDF:', error);
      }
    } else {
      console.log(`Exportando relatório em ${format.toUpperCase()}`);
      // Implementar exportação CSV
    }
  };

  if (registryLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Layout title="Relatórios">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando dados...</p>
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Layout title="Relatórios">
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
          {/* Filtros */}
          <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
            <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
              Filtros
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Período</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Data Início</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  disabled={reportType !== "personalizado"}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Data Fim</Label>
                <Input
                  type="date"
                  className="h-9"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  disabled={reportType !== "personalizado"}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Tipo de COMP</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border">
                    <SelectItem value="all">Todos</SelectItem>
                    {compTypes
                      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                      .map((compType) => (
                        <SelectItem key={compType.id} value={compType.id}>
                          {compType.codigo}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total do Período</p>
                  <p className="text-lg sm:text-2xl font-bold text-primary">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-success/10 rounded-lg">
                  <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-success" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Quantidade Total</p>
                  <p className="text-lg sm:text-2xl font-bold text-success">{totalQuantity}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-3 bg-warning/10 rounded-lg">
                  <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-warning" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Média por COMP</p>
                  <p className="text-lg sm:text-2xl font-bold text-warning">{formatCurrency(averageValue)}</p>
                </div>
              </div>
            </Card>

            {currentManagerStats && (
              <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 bg-accent/10 rounded-lg">
                    <Target className="w-4 h-4 sm:w-6 sm:h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Meus COMPs</p>
                    <p className="text-lg sm:text-2xl font-bold text-accent-foreground">{formatCurrency(currentManagerStats.totalValue)}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{currentManagerStats.totalCount} COMPs registrados</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Tabs para diferentes relatórios */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-2 lg:grid-cols-5 w-full mb-6 h-auto p-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-3 sm:px-4">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="waiters" className="text-xs sm:text-sm px-2 py-3 sm:px-4">
                Funcionários
              </TabsTrigger>
              <TabsTrigger value="managers" className="text-xs sm:text-sm px-2 py-3 sm:px-4">
                Gerentes
              </TabsTrigger>
              <TabsTrigger value="perdas" className="text-xs sm:text-sm px-2 py-3 sm:px-4">
                Perdas de Serviço
              </TabsTrigger>
              <TabsTrigger value="export" className="text-xs sm:text-sm px-2 py-3 sm:px-4">
                Exportar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              {/* Gráfico de Tendência */}
              <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
                <h3 className="text-base sm:text-lg font-semibold mb-4">Evolução dos COMPs</h3>
                <div className="h-64 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={reportData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="dia" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), "Valor"]}
                        labelFormatter={(label) => `Dia: ${label}`}
                      />
                       <Line 
                        type="monotone" 
                        dataKey="valor" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--chart-1))", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Distribuição por Tipo */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Distribuição por Tipo</h3>
                  <div className="h-64 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={window.innerWidth < 640 ? 60 : 80}
                          dataKey="value"
                          label={({ name, percent }) => 
                            window.innerWidth >= 640 ? 
                            `${name} ${(percent * 100).toFixed(0)}%` : 
                            `${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
                  <h3 className="text-base sm:text-lg font-semibold mb-4">Ranking por Tipo</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {typeData.map((type, index) => (
                      <div key={type.name} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-2 sm:p-0">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <span className="font-medium text-sm sm:text-base">{type.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm sm:text-base">{formatCurrency(type.value)}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{type.quantidade} ocorrências</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="waiters" className="space-y-4 sm:space-y-6">
              <WaiterRankingChart data={waiterRanking} formatCurrency={formatCurrency} />
            </TabsContent>

            <TabsContent value="managers" className="space-y-4 sm:space-y-6">
              <ManagerRankingChart data={managerRanking} formatCurrency={formatCurrency} />
            </TabsContent>

            <TabsContent value="perdas" className="space-y-4 sm:space-y-6">
              {perdasLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : perdas.length === 0 ? (
                <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma perda de serviço registrada no período</p>
                  </div>
                </Card>
              ) : (
                <>
                  {/* Cards de Estatísticas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="p-4 bg-gradient-card shadow-card">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Total de Perdas</p>
                          <p className="text-2xl font-bold text-red-600">{perdas.length}</p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-gradient-card shadow-card">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Users className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Atendentes Afetados</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {new Set(perdas.map(p => p.atendente_nome)).size}
                          </p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-gradient-card shadow-card">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Target className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Mesas Afetadas</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {new Set(perdas.map(p => p.numero_mesa)).size}
                          </p>
                        </div>
                      </div>
                    </Card>
                    
                    <Card className="p-4 bg-gradient-card shadow-card">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <TrendingUp className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Média por Dia</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {reportType === 'diario' ? perdas.length : Math.round(perdas.length / Math.max(1, (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24) + 1))}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Gráfico de Perdas por Atendente */}
                  <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-orange-600" />
                      <h3 className="text-base sm:text-lg font-semibold">Perdas por Atendente</h3>
                    </div>
                    <div className="h-64 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={(() => {
                            const perdasPorAtendente = perdas.reduce((acc, perda) => {
                              acc[perda.atendente_nome] = (acc[perda.atendente_nome] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>);
                            
                            return Object.entries(perdasPorAtendente)
                              .map(([nome, quantidade]) => ({ nome, quantidade }))
                              .sort((a, b) => b.quantidade - a.quantidade)
                              .slice(0, 10); // Top 10
                          })()
                          }
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="nome" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            formatter={(value: number) => [value, "Perdas"]}
                            labelFormatter={(label) => `Atendente: ${label}`}
                          />
                          <Bar 
                            dataKey="quantidade" 
                            fill="hsl(var(--destructive))"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Gráfico de Perdas por Período */}
                  {reportType !== 'diario' && (
                    <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <h3 className="text-base sm:text-lg font-semibold">Evolução das Perdas</h3>
                      </div>
                      <div className="h-64 sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart 
                            data={(() => {
                              const perdasPorDia = perdas.reduce((acc, perda) => {
                                const dia = format(new Date(perda.created_at), 'dd/MM', { locale: ptBR });
                                acc[dia] = (acc[dia] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>);
                              
                              return Object.entries(perdasPorDia)
                                .map(([dia, quantidade]) => ({ dia, quantidade }))
                                .sort((a, b) => a.dia.localeCompare(b.dia));
                            })()}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="dia" 
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip 
                              formatter={(value: number) => [value, "Perdas"]}
                              labelFormatter={(label) => `Dia: ${label}`}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="quantidade" 
                              stroke="hsl(var(--destructive))" 
                              strokeWidth={3}
                              dot={{ fill: "hsl(var(--destructive))", strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  )}

                  {/* Gráfico de Pizza - Principais Motivos */}
                  <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h3 className="text-base sm:text-lg font-semibold">Principais Motivos</h3>
                    </div>
                    <div className="h-64 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={(() => {
                              // Agrupar motivos similares por palavras-chave
                              const categorizarMotivo = (motivo: string) => {
                                const motivoLower = motivo.toLowerCase();
                                if (motivoLower.includes('demora') || motivoLower.includes('demorou') || motivoLower.includes('tempo')) {
                                  return 'Demora no Atendimento';
                                } else if (motivoLower.includes('erro') || motivoLower.includes('errado') || motivoLower.includes('pedido')) {
                                  return 'Erro no Pedido';
                                } else if (motivoLower.includes('cliente') || motivoLower.includes('reclamação') || motivoLower.includes('insatisfeito')) {
                                  return 'Reclamação do Cliente';
                                } else if (motivoLower.includes('mesa') || motivoLower.includes('abandonada') || motivoLower.includes('saiu')) {
                                  return 'Mesa Abandonada';
                                } else if (motivoLower.includes('qualidade') || motivoLower.includes('comida') || motivoLower.includes('bebida')) {
                                  return 'Qualidade do Produto';
                                } else {
                                  return 'Outros';
                                }
                              };

                              const motivosPorCategoria = perdas.reduce((acc, perda) => {
                                const categoria = categorizarMotivo(perda.motivo);
                                acc[categoria] = (acc[categoria] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>);
                              
                              const cores = [
                                'hsl(var(--destructive))',
                                'hsl(var(--warning))',
                                'hsl(var(--primary))',
                                'hsl(var(--secondary))',
                                'hsl(var(--accent))',
                                'hsl(var(--muted))'
                              ];
                              
                              return Object.entries(motivosPorCategoria)
                                .map(([categoria, quantidade], index) => ({ 
                                  categoria, 
                                  quantidade,
                                  fill: cores[index % cores.length]
                                }))
                                .sort((a, b) => b.quantidade - a.quantidade);
                            })()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ categoria, quantidade, percent }) => 
                              `${categoria}: ${quantidade} (${(percent * 100).toFixed(0)}%)`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="quantidade"
                          >
                            {(() => {
                              const motivosPorCategoria = perdas.reduce((acc, perda) => {
                                const categorizarMotivo = (motivo: string) => {
                                  const motivoLower = motivo.toLowerCase();
                                  if (motivoLower.includes('demora') || motivoLower.includes('demorou') || motivoLower.includes('tempo')) {
                                    return 'Demora no Atendimento';
                                  } else if (motivoLower.includes('erro') || motivoLower.includes('errado') || motivoLower.includes('pedido')) {
                                    return 'Erro no Pedido';
                                  } else if (motivoLower.includes('cliente') || motivoLower.includes('reclamação') || motivoLower.includes('insatisfeito')) {
                                    return 'Reclamação do Cliente';
                                  } else if (motivoLower.includes('mesa') || motivoLower.includes('abandonada') || motivoLower.includes('saiu')) {
                                    return 'Mesa Abandonada';
                                  } else if (motivoLower.includes('qualidade') || motivoLower.includes('comida') || motivoLower.includes('bebida')) {
                                    return 'Qualidade do Produto';
                                  } else {
                                    return 'Outros';
                                  }
                                };
                                const categoria = categorizarMotivo(perda.motivo);
                                acc[categoria] = (acc[categoria] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>);
                              
                              const cores = [
                                'hsl(var(--destructive))',
                                'hsl(var(--warning))',
                                'hsl(var(--primary))',
                                'hsl(var(--secondary))',
                                'hsl(var(--accent))',
                                'hsl(var(--muted))'
                              ];
                              
                              return Object.entries(motivosPorCategoria)
                                .map(([categoria, quantidade], index) => ({ 
                                  categoria, 
                                  quantidade,
                                  fill: cores[index % cores.length]
                                }))
                                .sort((a, b) => b.quantidade - a.quantidade)
                                .map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ));
                            })()}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [value, "Perdas"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* Lista Detalhada de Perdas */}
                  <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h3 className="text-base sm:text-lg font-semibold">Registros Detalhados</h3>
                    </div>
                    <div className="space-y-3">
                      {perdas.map((perda) => (
                        <div key={perda.id} className="border rounded-lg p-4 bg-card">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  Mesa {perda.numero_mesa}
                                </Badge>
                                <span className="font-medium">{perda.atendente_nome}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{perda.motivo}</p>
                            </div>
                            <div className="text-right text-xs text-muted-foreground">
                              {format(new Date(perda.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}
            </TabsContent>

            <TabsContent value="export" className="space-y-4 sm:space-y-6">
              {/* Visualização da Planilha em Tempo Real */}
              <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
                <SpreadsheetViewer />
              </Card>

              {/* Botões de Exportação */}
              <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
                <h3 className="text-base sm:text-lg font-semibold mb-4 text-center sm:text-left">
                  Exportar Relatórios
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 max-w-md mx-auto sm:max-w-none sm:grid-cols-2 lg:grid-cols-4">
                    <Button 
                      onClick={() => exportReport("excel")} 
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-button h-14 text-base font-semibold w-full text-white"
                    >
                      <Download className="w-5 h-5 mr-3" />
                      Excel Completo
                    </Button>
                    <Button 
                      onClick={() => exportReport("excel-formato")} 
                      className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-button h-14 text-base font-semibold w-full text-white"
                    >
                      <Download className="w-5 h-5 mr-3" />
                      Excel Formato
                    </Button>
                    <Button 
                      onClick={() => exportReport("pdf")} 
                      className="bg-gradient-primary shadow-button h-14 text-base font-semibold w-full"
                    >
                      <Download className="w-5 h-5 mr-3" />
                      Exportar PDF
                    </Button>
                    <Button 
                      onClick={() => exportReport("csv")} 
                      variant="outline" 
                      className="shadow-card h-14 text-base font-semibold w-full border-2"
                    >
                      <Download className="w-5 h-5 mr-3" />
                      Exportar CSV
                    </Button>
                  </div>
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground text-center sm:text-left mb-2">
                      Os relatórios incluem dados de todos os períodos selecionados nos filtros acima.
                    </p>
                    <p className="text-xs text-muted-foreground text-center sm:text-left">
                      <strong>Excel Completo:</strong> Arquivo com múltiplas abas (Resumo, Funcionários, Gerentes, Detalhado, Por Tipo) • 
                      <strong>Excel Formato:</strong> Planilha no formato da imagem com percentuais e justificativas • 
                      <strong>PDF:</strong> Relatório visual para impressão • 
                      <strong>CSV:</strong> Dados em formato de planilha simples
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Componente PDF oculto para exportação */}
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <PDFReport
            ref={pdfRef}
            reportData={reportData}
            typeData={typeData}
            waiterRanking={waiterRanking}
            managerRanking={managerRanking}
            filters={filters}
            totalValue={totalValue}
            totalQuantity={totalQuantity}
            averageValue={averageValue}
            formatCurrency={formatCurrency}
            compTypes={compTypes}
          />
        </div>
      </Layout>
    </div>
  );
}