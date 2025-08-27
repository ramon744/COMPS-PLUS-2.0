import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { CompForm } from "@/components/CompForm";
import { CompEditDialog } from "@/components/CompEditDialog";
import { useOperationalDay } from "@/hooks/useOperationalDay";
import { useComps } from "@/hooks/useComps";
import { useAuth } from "@/contexts/AuthContext";
import { useRegistry } from "@/contexts/RegistryContext";
import { Input } from "@/components/ui/input";

const Index = () => {
  const { user } = useAuth();
  const { currentOperationalDay, formatOperationalDayDisplay, getCurrentTurn, getBrazilTimeString } = useOperationalDay();
  const { 
    getTodayComps, 
    addComp, 
    updateComp, 
    deleteComp, 
    calculateStats 
  } = useComps();
  const { getActiveCompTypes, getActiveWaiters, compTypes, waiters } = useRegistry();
  
  const [currentView, setCurrentView] = useState<"dashboard" | "newComp" | "compList">("dashboard");
  const [expandedWaiters, setExpandedWaiters] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Ensure all contexts are loaded before rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const todayComps = getTodayComps();

  // Get all managers for name lookup
  const getAllManagers = () => {
    const storedManagers = localStorage.getItem('registry-managers');
    if (storedManagers) {
      try {
        return JSON.parse(storedManagers);
      } catch (error) {
        console.error('Error loading managers:', error);
        return [];
      }
    }
    return [];
  };

  const managers = getAllManagers();

  // Filter COMPs based on search term
  const filteredComps = todayComps.filter(comp => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const waiter = waiters.find(w => w.id === comp.waiterId);
    const compType = compTypes.find(t => t.id === comp.compTypeId);
    const manager = managers.find((m: any) => m.id === comp.gerenteId);
    const value = (comp.valorCentavos / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).toLowerCase();

    return (
      waiter?.nome.toLowerCase().includes(search) ||
      compType?.nome.toLowerCase().includes(search) ||
      compType?.codigo.toLowerCase().includes(search) ||
      manager?.nome.toLowerCase().includes(search) ||
      comp.motivo.toLowerCase().includes(search) ||
      value.includes(search)
    );
  });

  // Calculate dashboard stats
  const dashboardStats = calculateStats(todayComps);

  const handleNewComp = () => {
    setCurrentView("newComp");
  };

  const handleViewComps = () => {
    setCurrentView("compList");
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  const toggleWaiterExpansion = (waiterId: string) => {
    setExpandedWaiters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(waiterId)) {
        newSet.delete(waiterId);
      } else {
        newSet.add(waiterId);
      }
      return newSet;
    });
  };

  const handleCompSubmit = (formData: any, saveAndNew: boolean) => {
    const brazilTime = getBrazilTimeString();
    const turno = getCurrentTurn();
    
    addComp({
      compTypeId: formData.compTypeId,
      waiterId: formData.waiterId,
      valorCentavos: formData.value,
      motivo: formData.motivo,
      dataHoraLocal: brazilTime,
      dataHoraUtc: brazilTime,
      diaOperacional: currentOperationalDay,
      turno: turno,
      gerenteId: user?.id || "unknown",
      status: "ativo",
    });

    if (!saveAndNew) {
      setCurrentView("dashboard");
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case "newComp":
        return "Novo COMP";
      case "compList":
        return "Lista de COMPs";
      default:
        return "COMPs Plus";
    }
  };

  const showBack = currentView !== "dashboard";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin mx-auto border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      title={getTitle()} 
      showBack={showBack} 
      onBack={handleBackToDashboard}
    >
      {currentView === "dashboard" && (
        <Dashboard
          stats={dashboardStats}
          operationalDay={formatOperationalDayDisplay(currentOperationalDay)}
          onNewComp={handleNewComp}
          onViewComps={handleViewComps}
          canCloseDay={true}
        />
      )}

      {currentView === "newComp" && (
        <CompForm
          compTypes={getActiveCompTypes()}
          waiters={getActiveWaiters()}
          onSubmit={handleCompSubmit}
          onCancel={handleBackToDashboard}
          keepTypeSelected={false}
          keepWaiterSelected={false}
        />
      )}

      {currentView === "compList" && (
        <div className="space-y-4 animate-fade-in">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome, valor, tipo, gerente ou motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {todayComps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Nenhum COMP registrado hoje</p>
              <p className="text-sm text-muted-foreground mt-2">Clique em "Novo COMP" para começar</p>
            </div>
          ) : filteredComps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Nenhum COMP encontrado</p>
              <p className="text-sm text-muted-foreground mt-2">Tente ajustar os filtros de pesquisa</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Group filtered COMPs by waiter
                const waiterGroups = filteredComps.reduce((groups, comp) => {
                  const waiterId = comp.waiterId;
                  if (!groups[waiterId]) {
                    groups[waiterId] = [];
                  }
                  groups[waiterId].push(comp);
                  return groups;
                }, {} as Record<string, typeof todayComps>);

                return Object.entries(waiterGroups).map(([waiterId, waiterComps]) => {
                  const waiter = waiters.find(w => w.id === waiterId);
                  const isExpanded = expandedWaiters.has(waiterId);
                  const totalValue = waiterComps.reduce((sum, comp) => sum + comp.valorCentavos, 0);
                  const compCount = waiterComps.length;

                  return (
                    <div key={waiterId} className="bg-gradient-card shadow-card rounded-lg border overflow-hidden">
                      {/* Waiter Header - Clickable */}
                      <button
                        onClick={() => toggleWaiterExpansion(waiterId)}
                        className="w-full p-4 flex justify-between items-center hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1 text-left">
                            <h3 className="font-semibold text-primary">{waiter?.nome}</h3>
                            <p className="text-sm text-muted-foreground">{compCount} COMPs</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-lg text-primary">
                              {(totalValue / 100).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </button>

                      {/* Expanded COMPs List */}
                      {isExpanded && (
                        <div className="border-t bg-background/50">
                          {waiterComps.map((comp, index) => {
                            const compType = compTypes.find(t => t.id === comp.compTypeId);
                            const manager = managers.find((m: any) => m.id === comp.gerenteId);
                            
                            return (
                              <div key={comp.id} className={`p-3 sm:p-4 ${index > 0 ? 'border-t border-border/50' : ''}`}>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-primary">{compType?.codigo}</h4>
                                    <p className="text-sm text-muted-foreground">{compType?.nome}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Registrado por: {manager?.nome || 'Gerente não encontrado'}
                                    </p>
                                  </div>
                                  <div className="flex flex-row sm:items-center gap-2 justify-between sm:justify-end">
                                    <div className="text-left sm:text-right">
                                      <p className="font-bold text-primary text-sm sm:text-base">
                                        {(comp.valorCentavos / 100).toLocaleString("pt-BR", {
                                          style: "currency",
                                          currency: "BRL",
                                        })}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(comp.dataHoraLocal).toLocaleTimeString("pt-BR", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </p>
                                    </div>
                                    <CompEditDialog
                                      comp={comp}
                                      compTypes={compTypes}
                                      waiters={waiters}
                                      onUpdate={updateComp}
                                      onDelete={deleteComp}
                                    />
                                  </div>
                                </div>
                                <p className="text-sm break-words">{comp.motivo}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Index;
