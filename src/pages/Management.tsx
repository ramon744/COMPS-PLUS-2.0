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
import { Plus, Edit, Trash2, Users, FileText, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { CompType, Waiter, Manager } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useRegistry } from "@/contexts/RegistryContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Management() {
  const { toast } = useToast();
  const { signUp } = useAuth();
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

  const handleSaveManager = async (manager: Partial<Manager>) => {
    if (editingManager?.id) {
      updateManager(editingManager.id, manager);
      toast({
        title: "Gerente atualizado",
        description: "As informações foram salvas com sucesso.",
      });
    } else {
      try {
        // Primeiro adiciona o gerente na base
        await addManager({
          nome: manager.nome || "",
          usuario: manager.usuario || "",
          senha: manager.senha || "",
          tipoAcesso: manager.tipoAcesso || "qualquer_ip",
          ipPermitido: manager.ipPermitido,
          ativo: true,
        });

        // Depois tenta criar a conta de usuário
        if (manager.usuario && manager.senha && manager.nome) {
          const { error } = await signUp(manager.usuario, manager.senha, manager.nome);
          
          if (error) {
            toast({
              title: "Gerente criado, mas erro na conta",
              description: `Gerente adicionado ao sistema, mas houve erro na criação da conta: ${error}`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Gerente criado com sucesso",
              description: "Gerente adicionado e conta criada no sistema de autenticação.",
            });
          }
        } else {
          toast({
            title: "Gerente criado",
            description: "Gerente adicionado ao sistema.",
          });
        }
      } catch (error) {
        toast({
          title: "Erro ao criar gerente",
          description: "Houve um erro ao adicionar o gerente.",
          variant: "destructive",
        });
      }
    }
    setEditingManager(null);
    setIsDialogOpen(false);
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
              <TabsTrigger value="managers">
                <UserCheck className="w-4 h-4 mr-2" />
                Gerentes
              </TabsTrigger>
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

                <div className="space-y-3">
                  {compTypes.map((compType) => (
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

                <div className="space-y-3">
                  {waiters.map((waiter) => (
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

                <div className="space-y-3">
                  {managers.map((manager) => (
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

function ManagerForm({ 
  manager, 
  onSave, 
  onCancel 
}: { 
  manager: Manager | null;
  onSave: (data: Partial<Manager>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    nome: manager?.nome || "",
    usuario: manager?.usuario || "",
    senha: manager?.senha || "",
    tipoAcesso: manager?.tipoAcesso || "qualquer_ip",
    ipPermitido: manager?.ipPermitido || "",
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
          placeholder="Ex: Alice Silva"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Usuário *</Label>
        <Input
          value={formData.usuario}
          onChange={(e) => setFormData(prev => ({ ...prev, usuario: e.target.value }))}
          placeholder="Ex: alice.silva"
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Senha *</Label>
        <Input
          type="password"
          value={formData.senha}
          onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
          placeholder="Digite a senha"
          required
        />
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
            placeholder="Ex: 192.168.1.100"
            required={formData.tipoAcesso === "ip_especifico"}
          />
          <p className="text-xs text-muted-foreground">
            Digite o endereço IP da rede WiFi onde o gerente poderá fazer login
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