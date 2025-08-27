import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, User } from "lucide-react";

interface WaiterRankingData {
  id: string;
  name: string;
  matricula: string;
  totalValue: number;
  totalCount: number;
  averageValue: number;
}

interface WaiterRankingChartProps {
  data: WaiterRankingData[];
  formatCurrency: (value: number) => string;
}

export function WaiterRankingChart({ data, formatCurrency }: WaiterRankingChartProps) {
  const chartData = data.slice(0, 10).map(waiter => ({
    name: waiter.name.split(' ')[0], // First name only for chart
    value: waiter.totalValue,
    count: waiter.totalCount,
  }));

  return (
    <div className="space-y-6">
      {/* Chart */}
      <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Ranking Funcionários - Gráfico
        </h3>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), "Valor Total"]}
                labelFormatter={(label) => `Funcionário: ${label}`}
              />
              <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Ranking List */}
      <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Ranking Funcionários - Detalhado
        </h3>
        <div className="space-y-3">
          {data.map((waiter, index) => (
            <div key={waiter.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 bg-background/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge 
                  variant={index < 3 ? "default" : "secondary"}
                  className={
                    index === 0 ? "bg-chart-6 text-white border-0" :
                    index === 1 ? "bg-slate-400 text-white border-0" :
                    index === 2 ? "bg-amber-500 text-white border-0" : ""
                  }
                >
                  #{index + 1}
                </Badge>
                <div>
                  <p className="font-medium">{waiter.name}</p>
                  <p className="text-sm text-muted-foreground">Mat: {waiter.matricula}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-chart-2">{formatCurrency(waiter.totalValue)}</p>
                <div className="flex flex-col sm:flex-row gap-1 text-xs text-muted-foreground">
                  <span>{waiter.totalCount} COMPs</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Média: {formatCurrency(waiter.averageValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}