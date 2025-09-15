import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/usePermissions";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Users, FileText, CheckCircle, XCircle, UserCheck, Search } from "lucide-react";
import { CompType, Waiter, Manager } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useRegistry } from "@/contexts/RegistryContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Management() {
  const { toast } = useToast();
  const { signUp } = useAuth();
  const { hasPermission } = usePermissions();
  const {
    compTypes,
    waiters,
    managers,
    isLoading,
    addCompType,
    updateCompType,
    toggleCompTypeStatus,
    deleteCompType,
    addWaiter,
    updateWaiter,
    toggleWaiterStatus,
    deleteWaiter,
    addManager,
    updateManager,
    toggleManagerStatus,
    deleteManager,
  } = useRegistry();
  const [editingCompType, setEditingCompType] = useState<CompType | null>(null);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'compType' | 'waiter' | 'manager', name: string} | null>(null);
  
  // Estados de pesquisa para cada aba
  const [searchCompTypes, setSearchCompTypes] = useState("");
  const [searchWaiters, setSearchWaiters] = useState("");
  const [searchManagers, setSearchManagers] = useState("");

  // Funções de filtro para cada tipo de dados
  const filteredCompTypes = compTypes.filter(compType => 
    compType.codigo.toLowerCase().includes(searchCompTypes.toLowerCase()) ||
    compType.nome.toLowerCase().includes(searchCompTypes.toLowerCase()) ||
    compType.descricao.toLowerCase().includes(searchCompTypes.toLowerCase())
  );

  const filteredWaiters = waiters.filter(waiter => 
    waiter.nome.toLowerCase().includes(searchWaiters.toLowerCase()) ||
    (waiter.matricula && waiter.matricula.toLowerCase().includes(searchWaiters.toLowerCase()))
  );

  const filteredManagers = managers.filter(manager => 
    manager.nome.toLowerCase().includes(searchManagers.toLowerCase()) ||
    manager.usuario.toLowerCase().includes(searchManagers.toLowerCase()) ||
    (manager.ipPermitido && manager.ipPermitido.toLowerCase().includes(searchManagers.toLowerCase()))
  );

  const handleSaveCompType = (compType: Partial<CompType>) => {
    if (editingCompType?.id) {
      updateCompType(editingCompType.id, compType);
      toast({
        title: "Tipo de COMP atualizado",
        description: "As informações foram salvas com sucesso.",
      });
    } else {
      addCompType({
        codigo: compType.codigo || "",
        nome: compType.nome || "",
        descricao: compType.descricao || "",
        ativo: true,
      });
      toast({
        title: "Tipo de COMP criado",
        description: "Novo tipo adicionado com sucesso.",
      });
    }
    setEditingCompType(null);
    setIsDialogOpen(false);
  };

  const handleSaveWaiter = (waiter: Partial<Waiter>) => {
    if (editingWaiter?.id) {
      updateWaiter(editingWaiter.id, waiter);
      toast({
        title: "Atendente atualizado",
        description: "As informações foram salvas com sucesso.",
      });
    } else {
      addWaiter({
        nome: waiter.nome || "",
        matricula: waiter.matricula,
        ativo: true,
      });
      toast({
        title: "Atendente criado",
        description: "Novo atendente adicionado com sucesso.",
      });
    }
    setEditingWaiter(null);
    setIsDialogOpen(false);
  };

  const handleSaveManager = async (managerData: ManagerFormData) => {
    try {
      if (editingManager?.id) {
        // Atualizando gerente existente
        const updateData: Partial<Manager> = {
          nome: managerData.nome,
          usuario: managerData.email, // Mudança: email -> usuario
          telefone: managerData.telefone,
          tipoAcesso: managerData.tipoAcesso,
          ipPermitido: managerData.ipPermitido,
        };
        
        // Só atualiza senha se foi fornecida
        if (managerData.senha?.trim()) {
          updateData.senha = managerData.senha;
        }
        
        updateManager(editingManager.id, updateData);
        toast({
          title: "Gerente atualizado",
          description: "As informações foram salvas com sucesso.",
        });
      } else {
        // Criando novo gerente
        if (!managerData.senha?.trim()) {
          toast({
            title: "Erro de validação",
            description: "Senha é obrigatória para novos gerentes.",
            variant: "destructive",
          });
          return;
        }
        
        const newManager: Omit<Manager, 'id' | 'criadoEm'> = {
          nome: managerData.nome || "",
          usuario: managerData.email || "", // Mudança: email -> usuario
          senha: managerData.senha || "",
          telefone: managerData.telefone || "",
          tipoAcesso: managerData.tipoAcesso || "qualquer_ip",
          ipPermitido: managerData.ipPermitido || "",
          ativo: true,
        };
        
        // Criar conta no Supabase Auth
        const authResult = await signUp(managerData.email || "", managerData.senha || "", managerData.nome || "");
        
        if (authResult.error) {
          toast({
            title: "Erro ao criar conta",
            description: authResult.error,
            variant: "destructive",
          });
          return;
        }
        
        // Adicionar gerente no banco
        addManager(newManager);
        toast({
          title: "Gerente criado",
          description: "Novo gerente adicionado com sucesso.",
        });
      }
      
      setEditingManager(null);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Erro ao salvar gerente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o gerente.",
        variant: "destructive",
      });
    }
  };

  const handleToggleCompTypeStatus = (id: string) => {
    toggleCompTypeStatus(id);
  };

  const handleToggleWaiterStatus = (id: string) => {
    toggleWaiterStatus(id);
  };

  const handleToggleManagerStatus = (id: string) => {
    toggleManagerStatus(id);
  };

  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    
    switch (itemToDelete.type) {
      case 'compType':
        deleteCompType(itemToDelete.id);
        toast({
          title: "Tipo de COMP excluído",
          description: `${itemToDelete.name} foi removido com sucesso.`,
        });
        break;
      case 'waiter':
        deleteWaiter(itemToDelete.id);
        toast({
          title: "Atendente excluído",
          description: `${itemToDelete.name} foi removido com sucesso.`,
        });
        break;
      case 'manager':
        deleteManager(itemToDelete.id);
        toast({
          title: "Gerente excluído",
          description: `${itemToDelete.name} foi removido com sucesso.`,
        });
        break;
    }
    
    setItemToDelete(null);
    setDeleteConfirmOpen(false);
  };

  const openDeleteConfirmDialog = (id: string, type: 'compType' | 'waiter' | 'manager', name: string) => {
    setItemToDelete({ id, type, name });
    setDeleteConfirmOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Layout title="Cadastros">
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
      <Layout title="Cadastros">
        <div className="space-y-6 animate-fade-in">
          <Tabs defaultValue="tipos" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tipos">
                <FileText className="w-4 h-4 mr-2" />
                Tipos de COMP
              </TabsTrigger>
              <TabsTrigger value="waiters">
                <Users className="w-4 h-4 mr-2" />
                Atendentes
              </TabsTrigger>
              {hasPermission('access_cadastros') && (
                <TabsTrigger value="managers">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Gerentes
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="tipos">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Tipos de COMP</h3>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setEditingCompType({} as CompType)}
                        className="bg-gradient-primary shadow-button"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Tipo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingCompType?.id ? "Editar" : "Novo"} Tipo de COMP
                        </DialogTitle>
                      </DialogHeader>
                      <CompTypeForm 
                        compType={editingCompType}
                        onSave={handleSaveCompType}
                        onCancel={() => {
                          setEditingCompType(null);
                          setIsDialogOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Barra de pesquisa para Tipos de COMP */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por código, nome ou descrição..."
                    value={searchCompTypes}
                    onChange={(e) => setSearchCompTypes(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-3">
                  {filteredCompTypes
                    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                    .map((compType) => (
                    <Card key={compType.id} className="p-4 bg-gradient-card shadow-card">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{compType.codigo}</h4>
                            <Badge variant={compType.ativo ? "default" : "secondary"}>
                              {compType.ativo ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Ativo</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Inativo</>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{compType.nome}</p>
                          <p className="text-xs text-muted-foreground">{compType.descricao}</p>
                        </div>
                         <div className="flex gap-2">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => {
                               setEditingCompType(compType);
                               setIsDialogOpen(true);
                             }}
                           >
                             <Edit className="w-4 h-4" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleToggleCompTypeStatus(compType.id)}
                           >
                             {compType.ativo ? (
                               <XCircle className="w-4 h-4 text-destructive" />
                             ) : (
                               <CheckCircle className="w-4 h-4 text-success" />
                             )}
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => openDeleteConfirmDialog(compType.id, 'compType', compType.nome)}
                           >
                             <Trash2 className="w-4 h-4 text-destructive" />
                           </Button>
                         </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
              </TabsContent>

            <TabsContent value="waiters">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Atendentes</h3>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setEditingWaiter({} as Waiter)}
                        className="bg-gradient-primary shadow-button"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Atendente
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingWaiter?.id ? "Editar" : "Novo"} Atendente
                        </DialogTitle>
                      </DialogHeader>
                      <WaiterForm 
                        waiter={editingWaiter}
                        onSave={handleSaveWaiter}
                        onCancel={() => {
                          setEditingWaiter(null);
                          setIsDialogOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Barra de pesquisa para Atendentes */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por nome ou matrícula..."
                    value={searchWaiters}
                    onChange={(e) => setSearchWaiters(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-3">
                  {filteredWaiters
                    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                    .map((waiter) => (
                    <Card key={waiter.id} className="p-4 bg-gradient-card shadow-card">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{waiter.nome}</h4>
                            <Badge variant={waiter.ativo ? "default" : "secondary"}>
                              {waiter.ativo ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Ativo</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Inativo</>
                              )}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {waiter.matricula && `Matrícula: ${waiter.matricula}`}
                          </p>
                        </div>
                         <div className="flex gap-2">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => {
                               setEditingWaiter(waiter);
                               setIsDialogOpen(true);
                             }}
                           >
                             <Edit className="w-4 h-4" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleToggleWaiterStatus(waiter.id)}
                           >
                             {waiter.ativo ? (
                               <XCircle className="w-4 h-4 text-destructive" />
                             ) : (
                               <CheckCircle className="w-4 h-4 text-success" />
                             )}
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => openDeleteConfirmDialog(waiter.id, 'waiter', waiter.nome)}
                           >
                             <Trash2 className="w-4 h-4 text-destructive" />
                           </Button>
                         </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {hasPermission('access_cadastros') && (
              <TabsContent value="managers">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Gerentes</h3>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setEditingManager({} as Manager)}
                        className="bg-gradient-primary shadow-button"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Gerente
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingManager?.id ? "Editar" : "Novo"} Gerente
                        </DialogTitle>
                        {!editingManager?.id && (
                          <p className="text-sm text-muted-foreground">
                            Ao criar um novo gerente, uma conta será automaticamente criada no sistema de autenticação.
                          </p>
                        )}
                      </DialogHeader>
                      <ManagerForm 
                        manager={editingManager}
                        onSave={handleSaveManager}
                        onCancel={() => {
                          setEditingManager(null);
                          setIsDialogOpen(false);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Barra de pesquisa para Gerentes */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar por nome, usuário ou IP..."
                    value={searchManagers}
                    onChange={(e) => setSearchManagers(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="space-y-3">
                  {filteredManagers
                    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                    .map((manager) => (
                    <Card key={manager.id} className="p-4 bg-gradient-card shadow-card">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{manager.nome}</h4>
                            <Badge variant={manager.ativo ? "default" : "secondary"}>
                              {manager.ativo ? (
                                <><CheckCircle className="w-3 h-3 mr-1" /> Ativo</>
                              ) : (
                                <><XCircle className="w-3 h-3 mr-1" /> Inativo</>
                              )}
                            </Badge>
                          </div>
                           <p className="text-sm text-muted-foreground">
                             Usuário: {manager.usuario}
                           </p>
                           <div className="flex items-center gap-2 mt-1">
                             <Badge variant="outline" className="text-xs">
                               {manager.tipoAcesso === "qualquer_ip" ? "Qualquer IP" : "IP Específico"}
                             </Badge>
                             {manager.tipoAcesso === "ip_especifico" && manager.ipPermitido && (
                               <span className="text-xs text-muted-foreground">
                                 IP: {manager.ipPermitido}
                               </span>
                             )}
                           </div>
                        </div>
                         <div className="flex gap-2">
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => {
                               setEditingManager(manager);
                               setIsDialogOpen(true);
                             }}
                           >
                             <Edit className="w-4 h-4" />
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleToggleManagerStatus(manager.id)}
                           >
                             {manager.ativo ? (
                               <XCircle className="w-4 h-4 text-destructive" />
                             ) : (
                               <CheckCircle className="w-4 h-4 text-success" />
                             )}
                           </Button>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => openDeleteConfirmDialog(manager.id, 'manager', manager.nome)}
                           >
                             <Trash2 className="w-4 h-4 text-destructive" />
                           </Button>
                         </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
            )}
          </Tabs>
        </div>
        
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir <strong>{itemToDelete?.name}</strong>? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteItem}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Layout>
    </div>
  );
}

function CompTypeForm({ 
  compType, 
  onSave, 
  onCancel 
}: { 
  compType: CompType | null;
  onSave: (data: Partial<CompType>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    codigo: compType?.codigo || "",
    nome: compType?.nome || "",
    descricao: compType?.descricao || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Código *</Label>
        <Input
          value={formData.codigo}
          onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
          placeholder="Ex: COMPS 14"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Nome *</Label>
        <Input
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          placeholder="Ex: Produto queimado"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={formData.descricao}
          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
          placeholder="Descrição detalhada do tipo de COMP"
          rows={3}
        />
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1 bg-gradient-primary">
          Salvar
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function WaiterForm({ 
  waiter, 
  onSave, 
  onCancel 
}: { 
  waiter: Waiter | null;
  onSave: (data: Partial<Waiter>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    nome: waiter?.nome || "",
    matricula: waiter?.matricula || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome Completo *</Label>
        <Input
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          placeholder="Ex: Maria da Silva"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Matrícula</Label>
        <Input
          value={formData.matricula}
          onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
          placeholder="Ex: 001"
        />
      </div>
      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1 bg-gradient-primary">
          Salvar
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

interface ManagerFormData {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  tipoAcesso: "qualquer_ip" | "ip_especifico";
  ipPermitido?: string;
}

function ManagerForm({ 
  manager, 
  onSave, 
  onCancel 
}: { 
  manager: Manager | null;
  onSave: (data: Partial<Manager>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<ManagerFormData>({
    nome: manager?.nome || "",
    email: manager?.usuario || "", // Mudança: usuario -> email
    senha: manager?.senha || "",
    telefone: manager?.telefone || "",
    tipoAcesso: manager?.tipoAcesso || "qualquer_ip",
    ipPermitido: manager?.ipPermitido || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    
    if (!manager?.id && !formData.senha.trim()) {
      newErrors.senha = "Senha é obrigatória para novos gerentes";
    }
    
    if (formData.tipoAcesso === "ip_especifico" && !formData.ipPermitido.trim()) {
      newErrors.ipPermitido = "IP é obrigatório para acesso restrito";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome Completo *</Label>
        <Input
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          placeholder="Ex: Alice Silva"
          className={errors.nome ? "border-destructive" : ""}
          required
        />
        {errors.nome && (
          <p className="text-xs text-destructive">{errors.nome}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>Email *</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Ex: alice.silva@restaurante.com"
          className={errors.email ? "border-destructive" : ""}
          required
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Este email será usado para fazer login no sistema
        </p>
      </div>
      
      <div className="space-y-2">
        <Label>Senha {!manager?.id && "*"}</Label>
        <Input
          type="password"
          value={formData.senha}
          onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
          placeholder={manager?.id ? "Deixe em branco para manter a atual" : "Digite a senha"}
          className={errors.senha ? "border-destructive" : ""}
          required={!manager?.id}
        />
        {errors.senha && (
          <p className="text-xs text-destructive">{errors.senha}</p>
        )}
        {manager?.id && (
          <p className="text-xs text-muted-foreground">
            Deixe em branco para manter a senha atual
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input
          type="tel"
          value={formData.telefone || ""}
          onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
          placeholder="Ex: (11) 99999-9999"
        />
        <p className="text-xs text-muted-foreground">
          Telefone para contato (opcional)
        </p>
      </div>
      
      <div className="space-y-2">
        <Label>Tipo de Acesso *</Label>
        <Select
          value={formData.tipoAcesso}
          onValueChange={(value: "qualquer_ip" | "ip_especifico") => 
            setFormData(prev => ({ 
              ...prev, 
              tipoAcesso: value,
              ipPermitido: value === "qualquer_ip" ? "" : prev.ipPermitido
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de acesso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="qualquer_ip">Qualquer IP</SelectItem>
            <SelectItem value="ip_especifico">IP Específico</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {formData.tipoAcesso === "ip_especifico" && (
        <div className="space-y-2">
          <Label>IP Permitido *</Label>
          <Input
            value={formData.ipPermitido}
            onChange={(e) => setFormData(prev => ({ ...prev, ipPermitido: e.target.value }))}
            placeholder="Ex: 192.168.1.100 ou 192.168.1.0/24"
            className={errors.ipPermitido ? "border-destructive" : ""}
            required={formData.tipoAcesso === "ip_especifico"}
          />
          {errors.ipPermitido && (
            <p className="text-xs text-destructive">{errors.ipPermitido}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Digite o endereço IP ou range da rede WiFi onde o gerente poderá fazer login
          </p>
        </div>
      )}
      <div className="flex gap-3 pt-4">
        <Button type="submit" className="flex-1 bg-gradient-primary">
          Salvar
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}