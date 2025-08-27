import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { CompForm } from "@/components/CompForm";
import { CompEditDialog } from "@/components/CompEditDialog";
import { useOperationalDay } from "@/hooks/useOperationalDay";
import { useComps } from "@/hooks/useComps";
import { useRegistry } from "@/contexts/RegistryContext";

const Index = () => {
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

  // Ensure all contexts are loaded before rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const todayComps = getTodayComps();

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
      gerenteId: "current-user",
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
          {todayComps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Nenhum COMP registrado hoje</p>
              <p className="text-sm text-muted-foreground mt-2">Clique em "Novo COMP" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Group COMPs by waiter
                const waiterGroups = todayComps.reduce((groups, comp) => {
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
                            
                            return (
                              <div key={comp.id} className={`p-4 ${index > 0 ? 'border-t border-border/50' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-primary">{compType?.codigo}</h4>
                                    <p className="text-sm text-muted-foreground">{compType?.nome}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="text-right">
                                      <p className="font-bold text-primary">
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
                                <p className="text-sm">{comp.motivo}</p>
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
