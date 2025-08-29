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
import { Download, Calendar, Filter, TrendingUp, DollarSign, Crown, Users, Target } from "lucide-react";
import { useReports } from "@/hooks/useReports";
import { WaiterRankingChart } from "@/components/charts/WaiterRankingChart";
import { ManagerRankingChart } from "@/components/charts/ManagerRankingChart";
import { useAuth } from "@/contexts/AuthContext";
import { useOperationalDay } from "@/hooks/useOperationalDay";
import { useRegistry } from "@/contexts/RegistryContext";

export default function Reports() {
  const { 
    getReportsData, 
    getWaiterRanking, 
    getManagerRanking, 
    getManagerCompsData, 
    getCurrentManagerStats,
    formatCurrency 
  } = useReports();
  const { user } = useAuth();
  const { currentOperationalDay } = useOperationalDay();
  const { compTypes, isLoading: registryLoading } = useRegistry();
  
  const [dateRange, setDateRange] = useState({
    start: currentOperationalDay,
    end: currentOperationalDay
  });
  const [reportType, setReportType] = useState("diario");
  const [selectedWaiter, setSelectedWaiter] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

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
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 6); // 7 dias incluindo hoje
        return {
          start: weekStart.toISOString().split('T')[0],
          end: currentOperationalDay
        };
      case "mensal":
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 29); // 30 dias incluindo hoje
        return {
          start: monthStart.toISOString().split('T')[0],
          end: currentOperationalDay
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

  const totalValue = reportData.reduce((sum, item) => sum + item.valor, 0);
  const totalQuantity = reportData.reduce((sum, item) => sum + item.quantidade, 0);
  const averageValue = totalQuantity > 0 ? totalValue / totalQuantity : 0;

  const exportReport = (format: "pdf" | "csv") => {
    console.log(`Exportando relatório em ${format.toUpperCase()}`);
    // Implementar exportação
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
                    {compTypes.map((compType) => (
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
            <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full mb-6 h-auto p-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 py-3 sm:px-4">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="waiters" className="text-xs sm:text-sm px-2 py-3 sm:px-4">
                Funcionários
              </TabsTrigger>
              <TabsTrigger value="managers" className="text-xs sm:text-sm px-2 py-3 sm:px-4">
                Gerentes
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

            <TabsContent value="export" className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
                <h3 className="text-base sm:text-lg font-semibold mb-4 text-center sm:text-left">
                  Exportar Relatórios
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 max-w-md mx-auto sm:max-w-none sm:grid-cols-2">
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
                    <p className="text-sm text-muted-foreground text-center sm:text-left">
                      Os relatórios incluem dados de todos os períodos selecionados nos filtros acima.
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </div>
  );
}