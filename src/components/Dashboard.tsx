import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, DollarSign, Receipt, Users, TrendingUp, AlertTriangle } from "lucide-react";

interface DashboardStats {
  totalValue: number;
  totalCount: number;
  topTypes: Array<{ name: string; value: number; count: number }>;
  topWaiters: Array<{ name: string; value: number; count: number }>;
}

interface DashboardProps {
  stats: DashboardStats;
  operationalDay: string;
  onNewComp: () => void;
  onViewComps: () => void;
  onClosingDay?: () => void;
  canCloseDay?: boolean;
}

export function Dashboard({ 
  stats, 
  operationalDay, 
  onNewComp, 
  onViewComps, 
  onClosingDay,
  canCloseDay = false 
}: DashboardProps) {
  const formatCurrency = (cents: number) => {
    return (cents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Operational Day Header */}
      <Card className="bg-gradient-card shadow-card p-4 sm:p-6">
        <div className="text-center">
          <h2 className="text-base sm:text-lg font-semibold text-muted-foreground">Dia Operacional</h2>
          <p className="text-xl sm:text-2xl font-bold text-primary mt-1">{operationalDay}</p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">05:00 às 04:59:59 (próximo dia)</p>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Button 
          onClick={onNewComp}
          className="h-16 sm:h-20 bg-gradient-primary shadow-button hover:shadow-float transition-all duration-200"
          size="lg"
        >
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-xs sm:text-sm font-medium">Novo COMP</span>
          </div>
        </Button>
        
        <Button 
          onClick={onViewComps}
          variant="secondary"
          className="h-16 sm:h-20 shadow-card hover:shadow-button transition-all duration-200"
          size="lg"
        >
          <div className="flex flex-col items-center gap-1 sm:gap-2">
            <Receipt className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-xs sm:text-sm font-medium">Ver COMPs</span>
          </div>
        </Button>
      </div>

      {/* Perda de Serviço */}
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        <Link 
          to="/perda-servico"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
          onClick={() => {
            console.log('🔍 Dashboard: Clicando em Registrar Perda de Serviço');
          }}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Registrar Perda de Serviço
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-card shadow-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
              <p className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(stats.totalValue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-gradient-card shadow-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-success/10 rounded-lg">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Quantidade</p>
              <p className="text-lg sm:text-xl font-bold text-success">{stats.totalCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Types */}
      {stats.topTypes.length > 0 && (
        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Top Tipos de COMP</h3>
          </div>
          <div className="space-y-3">
            {stats.topTypes.slice(0, 3).map((type, index) => (
              <div key={type.name} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-primary">#{index + 1}</span>
                  <span className="text-sm font-medium">{type.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatCurrency(type.value)}</p>
                  <p className="text-xs text-muted-foreground">{type.count} itens</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Waiters */}
      {stats.topWaiters.length > 0 && (
        <Card className="p-6 bg-gradient-card shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Top Atendentes</h3>
          </div>
          <div className="space-y-3">
            {stats.topWaiters.slice(0, 3).map((waiter, index) => (
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
      )}

      {/* Closing Day Action */}
      {canCloseDay && onClosingDay && (
        <Button 
          onClick={onClosingDay}
          variant="destructive"
          className="w-full h-12 shadow-button hover:shadow-float transition-all duration-200"
          size="lg"
        >
          Fechar & Enviar Dia
        </Button>
      )}
    </div>
  );
}