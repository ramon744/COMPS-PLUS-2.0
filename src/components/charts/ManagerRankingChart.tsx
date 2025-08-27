import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Crown, Users } from "lucide-react";

interface ManagerRankingData {
  id: string;
  name: string;
  usuario: string;
  totalValue: number;
  totalCount: number;
  averageValue: number;
}

interface ManagerRankingChartProps {
  data: ManagerRankingData[];
  formatCurrency: (value: number) => string;
}

export function ManagerRankingChart({ data, formatCurrency }: ManagerRankingChartProps) {
  const chartData = data.map((manager, index) => ({
    name: manager.name.split(' ')[0], // First name only for chart
    value: manager.totalValue,
    count: manager.totalCount,
    color: `hsl(var(--chart-${((index % 8) + 1)}))`,
  }));

  const pieData = data.map((manager, index) => ({
    name: manager.name,
    value: manager.totalValue,
    color: `hsl(var(--chart-${((index % 8) + 1)}))`,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          Ranking Gerentes - Barras
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
                labelFormatter={(label) => `Gerente: ${label}`}
              />
              <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Pie Chart */}
      <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Distribuição por Gerente
        </h3>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percent }) => 
                  `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`
                }
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Ranking List - Full Width */}
      <Card className="p-4 sm:p-6 bg-gradient-card shadow-card lg:col-span-2">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          Ranking Detalhado - Gerentes
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((manager, index) => (
            <div key={manager.id} className="p-4 bg-background/50 rounded-lg border">
              <div className="flex items-center gap-3 mb-3">
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
                  <p className="font-medium">{manager.name}</p>
                  <p className="text-sm text-muted-foreground">@{manager.usuario}</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total:</span>
                  <span className="font-bold text-chart-1">{formatCurrency(manager.totalValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">COMPs:</span>
                  <span className="text-sm">{manager.totalCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Média:</span>
                  <span className="text-sm">{formatCurrency(manager.averageValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}