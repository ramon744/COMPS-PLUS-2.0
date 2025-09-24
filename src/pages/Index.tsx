import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, Calendar, Filter } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Dashboard } from "@/components/Dashboard";
import { CompForm } from "@/components/CompForm";
import { CompEditDialog } from "@/components/CompEditDialog";
import { useOperationalDay } from "@/hooks/useOperationalDay";
import { useComps } from "@/hooks/useComps";
import { useAuth } from "@/contexts/AuthContext";
import { useRegistry } from "@/contexts/RegistryContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Comp } from "@/types";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const Index = () => {
  const { user } = useAuth();
  
  console.log('🔍 Index: Carregando dashboard, user:', !!user);
  
  // Verificação simples de autenticação
  if (!user) {
    console.log('🔍 Index: Usuário não encontrado, redirecionando para login');
    window.location.href = '/login';
    return null;
  }
  
  console.log('🔍 Index: Usuário autenticado, continuando...');
  
  // Interceptar erros que podem causar reload
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Erro capturado em Index:', event.error);
      event.preventDefault(); // Evitar reload
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Promise rejeitada em Index:', event.reason);
      event.preventDefault(); // Evitar reload
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  const { currentOperationalDay, formatOperationalDayDisplay, getCurrentTurn, getBrazilTimeString } = useOperationalDay();
  const { 
    comps,
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
  const [managerProfiles, setManagerProfiles] = useState<any[]>([]);
  const [todayComps, setTodayComps] = useState<Comp[]>([]);
  
  // Estados para filtro de período
  const [periodFilter, setPeriodFilter] = useState<"diario" | "semanal" | "mensal" | "personalizado">("diario");
  const [customDateRange, setCustomDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  });
  const [filteredComps, setFilteredComps] = useState<Comp[]>([]);

  // Funções de filtro de período
  const getDateRange = () => {
    const today = new Date();
    
    switch (periodFilter) {
      case "diario":
        return {
          from: currentOperationalDay,
          to: currentOperationalDay
        };
      case "semanal":
        const startWeek = startOfWeek(today, { weekStartsOn: 1 }); // Segunda-feira
        const endWeek = endOfWeek(today, { weekStartsOn: 1 });
        return {
          from: format(startWeek, 'yyyy-MM-dd'),
          to: format(endWeek, 'yyyy-MM-dd')
        };
      case "mensal":
        const startMonth = startOfMonth(today);
        const endMonth = endOfMonth(today);
        return {
          from: format(startMonth, 'yyyy-MM-dd'),
          to: format(endMonth, 'yyyy-MM-dd')
        };
      case "personalizado":
        return {
          from: customDateRange.from ? format(customDateRange.from, 'yyyy-MM-dd') : undefined,
          to: customDateRange.to ? format(customDateRange.to, 'yyyy-MM-dd') : undefined
        };
      default:
        return {
          from: currentOperationalDay,
          to: currentOperationalDay
        };
    }
  };

  const filterCompsByPeriod = (comps: Comp[]) => {
    const { from, to } = getDateRange();
    
    console.log('🔍 Filtering comps:', {
      totalComps: comps.length,
      periodFilter,
      from,
      to,
      customDateRange
    });
    
    if (!from) return comps;
    
    const filtered = comps.filter(comp => {
      const compDate = comp.diaOperacional;
      
      if (to) {
        return compDate >= from && compDate <= to;
      } else {
        return compDate === from;
      }
    });
    
    console.log('✅ Filtered result:', {
      filteredCount: filtered.length,
      sampleComps: filtered.slice(0, 3).map(c => ({
        id: c.id,
        diaOperacional: c.diaOperacional,
        waiterId: c.waiterId
      }))
    });
    
    return filtered;
  };

  const getPeriodDisplayText = () => {
    const { from, to } = getDateRange();
    
    switch (periodFilter) {
      case "diario":
        return `Dia Operacional: ${formatOperationalDayDisplay(currentOperationalDay)}`;
      case "semanal":
        return `Semana: ${format(new Date(from!), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(to!), 'dd/MM/yyyy', { locale: ptBR })}`;
      case "mensal":
        return `Mês: ${format(new Date(from!), 'MMMM yyyy', { locale: ptBR })}`;
      case "personalizado":
        if (from && to) {
          return `Período: ${format(new Date(from), 'dd/MM/yyyy', { locale: ptBR })} - ${format(new Date(to), 'dd/MM/yyyy', { locale: ptBR })}`;
        } else if (from) {
          return `A partir de: ${format(new Date(from), 'dd/MM/yyyy', { locale: ptBR })}`;
        }
        return "Selecione um período";
      default:
        return "";
    }
  };

  // Initialize today's comps when contexts are ready
  useEffect(() => {
    try {
      const todayComps = getTodayComps();
      setTodayComps(todayComps);
    } catch (error) {
      console.error('Error getting today comps:', error);
      setTodayComps([]);
    }
  }, [getTodayComps]);

  // Apply period filter when comps or filter changes
  useEffect(() => {
    const filtered = filterCompsByPeriod(comps);
    setFilteredComps(filtered);
  }, [comps, periodFilter, customDateRange, currentOperationalDay]);

  // Update today's comps when data changes in the context
  useEffect(() => {
    try {
      const comps = getTodayComps();
      setTodayComps(comps);
    } catch (error) {
      console.error('Error updating today comps:', error);
    }
  }, [getTodayComps]);

  // Load manager profiles from Supabase
  useEffect(() => {
    const loadManagerProfiles = async () => {
      try {
        if (filteredComps.length === 0) return;
        
        // Get unique manager IDs from comps
        const managerIds = [...new Set(filteredComps.map(comp => comp.gerenteId))].filter(Boolean);
        
        console.log('Loading profiles for manager IDs:', managerIds);
        console.log('Filtered comps gerente IDs:', filteredComps.map(comp => ({ id: comp.id, gerenteId: comp.gerenteId })));

        if (managerIds.length === 0) {
          console.log('No manager IDs found in filtered comps');
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .in('id', managerIds);

        if (error) {
          console.error('Error loading manager profiles:', error);
          throw error;
        }
        
        console.log('Loaded manager profiles:', data);
        setManagerProfiles(data || []);
      } catch (error) {
        console.error('Error loading manager profiles:', error);
      }
    };

    loadManagerProfiles();
  }, [filteredComps]);

  // Ensure all contexts are loaded before rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Filter COMPs based on search term
  const searchFilteredComps = filteredComps.filter(comp => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const waiter = waiters.find(w => w.id === comp.waiterId);
    const compType = compTypes.find(t => t.id === comp.compTypeId);
    const manager = managerProfiles.find(m => m.id === comp.gerenteId);
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
  const dashboardStats = calculateStats(filteredComps);

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
        />
      )}

      {currentView === "compList" && (
        <div className="space-y-4 animate-fade-in">
          {/* Period Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Select value={periodFilter} onValueChange={(value: "diario" | "semanal" | "mensal" | "personalizado") => setPeriodFilter(value)}>
                <SelectTrigger className="w-full">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diario">Dia Operacional Atual</SelectItem>
                  <SelectItem value="semanal">Esta Semana</SelectItem>
                  <SelectItem value="mensal">Este Mês</SelectItem>
                  <SelectItem value="personalizado">Período Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {periodFilter === "personalizado" && (
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {customDateRange.from ? format(customDateRange.from, 'dd/MM/yyyy', { locale: ptBR }) : "Data inicial"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customDateRange.from}
                      onSelect={(date) => setCustomDateRange(prev => ({ ...prev, from: date }))}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {customDateRange.to ? format(customDateRange.to, 'dd/MM/yyyy', { locale: ptBR }) : "Data final"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={customDateRange.to}
                      onSelect={(date) => setCustomDateRange(prev => ({ ...prev, to: date }))}
                      locale={ptBR}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Period Display */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {getPeriodDisplayText()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {searchFilteredComps.length} COMP{searchFilteredComps.length !== 1 ? 's' : ''} encontrado{searchFilteredComps.length !== 1 ? 's' : ''}
            </span>
          </div>

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

          {filteredComps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Nenhum COMP encontrado no período selecionado</p>
              <p className="text-sm text-muted-foreground mt-2">Tente ajustar os filtros de período ou pesquisa</p>
            </div>
          ) : searchFilteredComps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">Nenhum COMP encontrado</p>
              <p className="text-sm text-muted-foreground mt-2">Tente ajustar os filtros de pesquisa</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                // Group filtered COMPs by waiter
                const waiterGroups = searchFilteredComps.reduce((groups, comp) => {
                  const waiterId = comp.waiterId;
                  if (!groups[waiterId]) {
                    groups[waiterId] = [];
                  }
                  groups[waiterId].push(comp);
                  return groups;
                }, {} as Record<string, typeof todayComps>);

                // Sort waiter groups alphabetically by waiter name
                const sortedWaiterGroups = Object.entries(waiterGroups)
                  .map(([waiterId, waiterComps]) => {
                    const waiter = waiters.find(w => w.id === waiterId);
                    return { waiterId, waiterComps, waiterName: waiter?.nome || 'Sem nome' };
                  })
                  .sort((a, b) => a.waiterName.localeCompare(b.waiterName, 'pt-BR'));

                return sortedWaiterGroups.map(({ waiterId, waiterComps }) => {
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
                          {waiterComps
                            .sort((a, b) => {
                              // Sort by operational day (newest first)
                              const dateA = new Date(a.diaOperacional);
                              const dateB = new Date(b.diaOperacional);
                              return dateB.getTime() - dateA.getTime();
                            })
                            .map((comp, index) => {
                            const compType = compTypes.find(t => t.id === comp.compTypeId);
                            const currentManager = managerProfiles.find(m => m.id === comp.gerenteId);
                            
                            return (
                              <div key={comp.id} className={`p-3 sm:p-4 ${index > 0 ? 'border-t border-border/50' : ''}`}>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-primary">{compType?.codigo}</h4>
                                    <p className="text-sm text-muted-foreground">{compType?.nome}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Registrado por: {currentManager?.nome || 'Gerente não encontrado'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Dia Operacional: {format(new Date(comp.diaOperacional), 'dd/MM/yyyy', { locale: ptBR })}
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