import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { 
  AlertTriangle, 
  Plus, 
  Search, 
  User, 
  Hash, 
  FileText, 
  Edit, 
  Trash2,
  Calendar,
  Filter,
  Check,
  ChevronsUpDown,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { usePerdaServico } from "@/contexts/PerdaServicoContext";
import { useRegistry } from "@/contexts/RegistryContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

// VERSÃO FINAL: 2025-01-25 16:30 - APENAS 2 BOTÕES: Cancelar e Registrar
export default function PerdaServico() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Interceptar erros que podem causar reload
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 Erro capturado em PerdaServico:', event.error);
      event.preventDefault(); // Evitar reload
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Promise rejeitada em PerdaServico:', event.reason);
      event.preventDefault(); // Evitar reload
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
  
  const { getActiveWaiters, waiters, isLoading: waitersLoading } = useRegistry();
  const { 
    perdas, 
    isLoading, 
    addPerdaServico, 
    updatePerdaServico, 
    deletePerdaServico,
    getTodayPerdas,
    getPerdasByDay,
    currentOperationalDay
  } = usePerdaServico();
  const { toast } = useToast();

  const [currentView, setCurrentView] = useState<"list" | "newPerda">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAtendente, setSelectedAtendente] = useState("all");
  const [editingPerda, setEditingPerda] = useState<string | null>(null);
  const [openWaiterCombobox, setOpenWaiterCombobox] = useState(false);
  const [showOnlyToday, setShowOnlyToday] = useState(true); // Por padrão, mostrar apenas perdas do dia atual
  const [expandedAtendentes, setExpandedAtendentes] = useState<Set<string>>(new Set()); // Para controlar quais atendentes estão expandidos
  const [formData, setFormData] = useState({
    atendente_nome: '',
    numero_mesa: '',
    motivo: ''
  });

  // Usar a mesma função que a página Index usa
  const activeWaiters = getActiveWaiters();

  // Função para alternar expansão dos atendentes (igual ao Index)
  const toggleAtendenteExpansion = (atendenteName: string) => {
    setExpandedAtendentes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(atendenteName)) {
        newSet.delete(atendenteName);
      } else {
        newSet.add(atendenteName);
      }
      return newSet;
    });
  };

  // Obter perdas baseado no filtro de dia
  const perdasToShow = showOnlyToday ? getTodayPerdas() : perdas;

  // Filtrar perdas
  const filteredPerdas = perdasToShow.filter(perda => {
    const matchesSearch = perda.atendente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         perda.numero_mesa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         perda.motivo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAtendente = selectedAtendente === "all" || perda.atendente_nome === selectedAtendente;
    
    return matchesSearch && matchesAtendente;
  });

  const handleSubmit = async () => {
    // Validação igual ao COMPs
    if (!formData.atendente_nome || !formData.numero_mesa || !formData.motivo) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos obrigatórios.",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }

    if (formData.motivo.length < 5) {
      toast({
        title: "Erro de validação",
        description: "Motivo deve ter pelo menos 5 caracteres.",
        variant: "destructive",
        duration: 1500,
      });
      return;
    }

    try {
      if (editingPerda) {
        await updatePerdaServico(editingPerda, formData);
        toast({
          title: "Perda de Serviço Atualizada",
          description: "Registro atualizado com sucesso.",
        });
      } else {
        await addPerdaServico(formData);
        toast({
          title: "Perda de Serviço Registrada",
          description: `Perda registrada para ${formData.atendente_nome} - Mesa ${formData.numero_mesa}`,
        });
      }
      
      // Reset form para permitir novo registro
      setFormData({
        atendente_nome: '',
        numero_mesa: '',
        motivo: ''
      });
      setEditingPerda(null);
      
      // Permanecer na página do formulário - não redirecionar
      // O usuário pode voltar manualmente se quiser
      
    } catch (error) {
      console.error('Erro ao salvar perda de serviço:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar perda de serviço.",
        variant: "destructive",
      });
    }
  };

  const handleNewPerda = () => {
    setFormData({
      atendente_nome: '',
      numero_mesa: '',
      motivo: ''
    });
    setEditingPerda(null);
    setCurrentView("newPerda");
  };

  const handleBackToList = () => {
    setFormData({
      atendente_nome: '',
      numero_mesa: '',
      motivo: ''
    });
    setEditingPerda(null);
    setCurrentView("list");
  };

  const handleEdit = (perda: any) => {
    setFormData({
      atendente_nome: perda.atendente_nome,
      numero_mesa: perda.numero_mesa,
      motivo: perda.motivo
    });
    setEditingPerda(perda.id);
    setCurrentView("newPerda");
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja remover esta perda de serviço?')) {
      try {
        await deletePerdaServico(id);
        toast({
          title: "Perda de Serviço Removida",
          description: "Registro removido com sucesso.",
        });
      } catch (error) {
        console.error('Erro ao remover perda de serviço:', error);
      }
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case "newPerda":
        return editingPerda ? "Editar Perda de Serviço" : "Nova Perda de Serviço";
      case "list":
      default:
        return "Perdas de Serviço";
    }
  };

  const showBack = currentView === "newPerda";
  
  const handleBackToDashboard = () => {
    setCurrentView("list");
  };

  // Debug: verificar se showBack está funcionando
  useEffect(() => {
    console.log('🔍 Current view:', currentView);
    console.log('🔍 Show back:', showBack);
  }, [currentView, showBack]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando perdas de serviço...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header simplificado sem ActiveManagerGuard */}
      <header className="bg-gradient-primary shadow-float sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            {showBack && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToDashboard} 
                className="text-primary-foreground hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-9 p-0"
              >
                <span className="text-sm sm:text-base">←</span>
              </Button>
            )}
            <h1 className="text-lg sm:text-xl font-bold text-primary-foreground">{getTitle()}</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {currentView === "list" && (
        <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
          {/* Header com botão de adicionar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Link 
                to="/"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                onClick={() => {
                  console.log('🔍 PerdaServico: Clicando na seta (Link) para navegar para dashboard');
                  console.log('🔍 PerdaServico: User antes da navegação:', !!user);
                }}
              >
                <span className="text-lg">←</span>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Perdas de Serviço</h1>
                <p className="text-muted-foreground">Gerencie as perdas de serviço dos atendentes</p>
              </div>
            </div>
            <Button
              onClick={handleNewPerda}
              className="bg-red-600 hover:bg-red-700 h-10 sm:h-11 text-sm sm:text-base"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Perda
            </Button>
          </div>

          {/* Filtros */}
          <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Filtros</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por atendente, mesa ou motivo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 sm:h-11 text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">Atendente</Label>
                <Select value={selectedAtendente} onValueChange={setSelectedAtendente}>
                  <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                    <SelectValue placeholder="Todos os atendentes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {activeWaiters.map((waiter) => (
                      <SelectItem key={waiter.id} value={waiter.nome}>
                        {waiter.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">Período</Label>
                <div className="flex items-center space-x-2 h-10 sm:h-11">
                  <Switch
                    id="show-only-today"
                    checked={showOnlyToday}
                    onCheckedChange={setShowOnlyToday}
                  />
                  <Label htmlFor="show-only-today" className="text-sm">
                    {showOnlyToday ? "Apenas hoje" : "Todos os dias"}
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  {showOnlyToday 
                    ? `Mostrando perdas do dia operacional atual (${currentOperationalDay})`
                    : "Mostrando todas as perdas registradas"
                  }
                </p>
              </div>
            </div>
          </Card>

          {/* Lista de perdas */}
          <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold">Registros de Perda de Serviço</h3>
            </div>
            
            {filteredPerdas.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || selectedAtendente !== "all" 
                    ? "Nenhuma perda encontrada com os filtros aplicados" 
                    : "Nenhuma perda de serviço registrada"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  // Agrupar perdas por atendente (igual ao Index com COMPs)
                  const atendenteGroups = filteredPerdas.reduce((groups, perda) => {
                    const atendenteName = perda.atendente_nome;
                    if (!groups[atendenteName]) {
                      groups[atendenteName] = [];
                    }
                    groups[atendenteName].push(perda);
                    return groups;
                  }, {} as Record<string, typeof filteredPerdas>);

                  // Ordenar grupos de atendentes alfabeticamente
                  const sortedAtendenteGroups = Object.entries(atendenteGroups)
                    .map(([atendenteName, atendentePerdas]) => {
                      return { atendenteName, atendentePerdas };
                    })
                    .sort((a, b) => a.atendenteName.localeCompare(b.atendenteName, 'pt-BR'));

                  return sortedAtendenteGroups.map(({ atendenteName, atendentePerdas }) => {
                    const isExpanded = expandedAtendentes.has(atendenteName);
                    const perdaCount = atendentePerdas.length;

                    return (
                      <div key={atendenteName} className="bg-gradient-card shadow-card rounded-lg border overflow-hidden">
                        {/* Cabeçalho do Atendente - Clicável */}
                        <button
                          onClick={() => toggleAtendenteExpansion(atendenteName)}
                          className="w-full p-4 flex justify-between items-center hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1 text-left">
                              <h3 className="font-semibold text-primary">{atendenteName}</h3>
                              <p className="text-sm text-muted-foreground">{perdaCount} Perda{perdaCount !== 1 ? 's' : ''} de Serviço</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold text-lg text-red-600">
                                {perdaCount} registro{perdaCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        {/* Lista de Perdas Expandida */}
                        {isExpanded && (
                          <div className="border-t bg-background/50">
                            {atendentePerdas
                              .sort((a, b) => {
                                // Ordenar por data de criação (mais recente primeiro)
                                const dateA = new Date(a.created_at);
                                const dateB = new Date(b.created_at);
                                return dateB.getTime() - dateA.getTime();
                              })
                              .map((perda, index) => (
                              <div key={perda.id} className={`p-3 sm:p-4 ${index > 0 ? 'border-t border-border/50' : ''}`}>
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                        Mesa {perda.numero_mesa}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(perda.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground break-words">{perda.motivo}</p>
                                  </div>
                                  <div className="flex gap-2 ml-0 sm:ml-4">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(perda)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(perda.id)}
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </Card>
        </div>
      )}

      {currentView === "newPerda" && (
        <div className="space-y-4 animate-fade-in p-2 sm:p-0">
          <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
              {/* Atendente */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">
                  Atendente <span className="text-destructive">*</span>
                </Label>
                <Popover open={openWaiterCombobox} onOpenChange={setOpenWaiterCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openWaiterCombobox}
                      className={cn(
                        "w-full justify-between h-10 sm:h-11 text-sm sm:text-base",
                        !formData.atendente_nome && "text-muted-foreground"
                      )}
                    >
                      {formData.atendente_nome || "Selecione o atendente"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-[calc(100vw-2rem)] sm:w-[--radix-popover-trigger-width] p-0 z-50" 
                    align="start"
                    side="bottom"
                    sideOffset={4}
                    avoidCollisions={false}
                    style={{
                      maxHeight: '40vh',
                      overflow: 'hidden'
                    }}
                  >
                    <Command>
                      <CommandInput placeholder="Buscar atendente..." className="h-10 sm:h-11 text-sm sm:text-base" />
                      <CommandList className="max-h-[150px] sm:max-h-[300px]">
                        <CommandEmpty>Nenhum atendente encontrado.</CommandEmpty>
                        <CommandGroup>
                          {(() => {
                            console.log('🔍 Active waiters no formulário:', activeWaiters.length);
                            
                            if (activeWaiters.length === 0) {
                              return (
                                <div className="p-4 text-center text-muted-foreground">
                                  <p>Nenhum atendente ativo encontrado.</p>
                                  <p className="text-xs mt-1">Verifique se há atendentes cadastrados no sistema.</p>
                                </div>
                              );
                            }
                            
                            return activeWaiters.map((waiter) => (
                              <CommandItem
                                key={waiter.id}
                                value={waiter.nome}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, atendente_nome: waiter.nome }));
                                  setOpenWaiterCombobox(false);
                                }}
                                className="h-10 sm:h-11 text-sm sm:text-base"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.atendente_nome === waiter.nome
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {waiter.nome}
                              </CommandItem>
                            ));
                          })()}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Número da Mesa */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">
                  Número da Mesa <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Ex: V91, 15, A12"
                  value={formData.numero_mesa}
                  onChange={(e) => setFormData(prev => ({ ...prev, numero_mesa: e.target.value }))}
                  className="h-10 sm:h-11 text-sm sm:text-base uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Aceita letras e números (ex: V91, 15, A12)
                </p>
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <Label className="text-sm sm:text-base font-medium">
                  Motivo da Perda <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="Descreva o motivo da perda de serviço (mín. 5 caracteres)"
                  value={formData.motivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                  rows={3}
                  className="text-sm sm:text-base"
                />
                {formData.motivo && formData.motivo.length < 5 && (
                  <p className="text-xs text-destructive">
                    Motivo deve ter pelo menos 5 caracteres
                  </p>
                )}
              </div>

              {/* Botões do formulário */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToList}
                  className="h-10 sm:h-11 text-sm sm:text-base"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.atendente_nome || !formData.numero_mesa || !formData.motivo || formData.motivo.length < 5}
                  className="bg-red-600 hover:bg-red-700 h-10 sm:h-11 text-sm sm:text-base"
                >
                  {editingPerda ? 'Atualizar' : 'Registrar'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      </main>
    </div>
  );
}
