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
    deleteCompType,
    addWaiter,
    updateWaiter,
    deleteWaiter,
    addManager,
    updateManager,
    deleteManager,
  } = useRegistry();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompType, setEditingCompType] = useState<CompType | null>(null);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'compType' | 'waiter' | 'manager', id: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleDelete = (type: 'compType' | 'waiter' | 'manager', id: string) => {
    setItemToDelete({ type, id });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!itemToDelete) return;

    switch (itemToDelete.type) {
      case 'compType':
        deleteCompType(itemToDelete.id);
        break;
      case 'waiter':
        deleteWaiter(itemToDelete.id);
        break;
      case 'manager':
        deleteManager(itemToDelete.id);
        break;
    }

    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const filteredCompTypes = compTypes.filter(compType =>
    compType.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    compType.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWaiters = waiters.filter(waiter =>
    waiter.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredManagers = managers.filter(manager =>
    manager.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                        onClick={() => setEditingCompType(null)}
                        className="bg-gradient-primary shadow-button"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Tipo
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingCompType ? 'Editar Tipo de COMP' : 'Novo Tipo de COMP'}
                        </DialogTitle>
                      </DialogHeader>
                      <CompTypeForm
                        compType={editingCompType}
                        onSave={(data) => {
                          if (editingCompType) {
                            updateCompType(editingCompType.id, data);
                          } else {
                            addCompType(data);
                          }
                          setIsDialogOpen(false);
                        }}
                        onCancel={() => setIsDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar tipos de COMP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCompTypes.map((compType) => (
                    <Card key={compType.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">{compType.codigo}</h4>
                          <p className="text-muted-foreground">{compType.nome}</p>
                        </div>
                        <Badge variant={compType.ativo ? "default" : "secondary"}>
                          {compType.ativo ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {compType.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      {compType.descricao && (
                        <p className="text-sm text-muted-foreground mb-3">{compType.descricao}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCompType(compType);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete('compType', compType.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Excluir
                        </Button>
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
                        onClick={() => setEditingWaiter(null)}
                        className="bg-gradient-primary shadow-button"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Atendente
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingWaiter ? 'Editar Atendente' : 'Novo Atendente'}
                        </DialogTitle>
                      </DialogHeader>
                      <WaiterForm
                        waiter={editingWaiter}
                        onSave={(data) => {
                          if (editingWaiter) {
                            updateWaiter(editingWaiter.id, data);
                          } else {
                            addWaiter(data);
                          }
                          setIsDialogOpen(false);
                        }}
                        onCancel={() => setIsDialogOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar atendentes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredWaiters.map((waiter) => (
                    <Card key={waiter.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">{waiter.nome}</h4>
                        </div>
                        <Badge variant={waiter.ativo ? "default" : "secondary"}>
                          {waiter.ativo ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <XCircle className="w-3 h-3 mr-1" />
                          )}
                          {waiter.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingWaiter(waiter);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete('waiter', waiter.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Excluir
                        </Button>
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
                            {editingManager?.id ? 'Editar Gerente' : 'Novo Gerente'}
                          </DialogTitle>
                        </DialogHeader>
                        <ManagerForm
                          manager={editingManager}
                          onSave={(data) => {
                            if (editingManager?.id) {
                              updateManager(editingManager.id, data);
                            } else {
                              addManager(data);
                            }
                            setIsDialogOpen(false);
                          }}
                          onCancel={() => setIsDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar gerentes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredManagers.map((manager) => (
                      <Card key={manager.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{manager.nome}</h4>
                            <p className="text-sm text-muted-foreground">{manager.email}</p>
                          </div>
                          <Badge variant={manager.ativo ? "default" : "secondary"}>
                            {manager.ativo ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {manager.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingManager(manager);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete('manager', manager.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Excluir
                          </Button>
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
                Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
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
          placeholder="Ex: João Silva"
          required
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
    email: manager?.email || "",
    senha: "",
    tipoAcesso: manager?.tipoAcesso || "qualquer_ip",
    ipPermitido: manager?.ipPermitido || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome é obrigatório";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }
    
    if (!manager?.id && !formData.senha.trim()) {
      newErrors.senha = "Senha é obrigatória para novos gerentes";
    }
    
    if (formData.tipoAcesso === "ip_especifico" && !formData.ipPermitido?.trim()) {
      newErrors.ipPermitido = "IP é obrigatório quando o tipo de acesso é 'IP Específico'";
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      const dataToSave: Partial<Manager> = {
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        tipoAcesso: formData.tipoAcesso,
        ipPermitido: formData.tipoAcesso === "ip_especifico" ? formData.ipPermitido?.trim() : undefined,
      };
      
      if (formData.senha.trim()) {
        dataToSave.senha = formData.senha;
      }
      
      onSave(dataToSave);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome Completo *</Label>
        <Input
          value={formData.nome}
          onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
          placeholder="Ex: João Silva"
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
          placeholder="Ex: joao@restaurante.com"
          required
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>Senha {!manager?.id && '*'}</Label>
        <Input
          type="password"
          value={formData.senha}
          onChange={(e) => setFormData(prev => ({ ...prev, senha: e.target.value }))}
          placeholder={manager?.id ? "Deixe em branco para manter a atual" : "Digite a senha"}
        />
        {errors.senha && (
          <p className="text-xs text-destructive">{errors.senha}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label>Tipo de Acesso *</Label>
        <Select
          value={formData.tipoAcesso}
          onValueChange={(value: "qualquer_ip" | "ip_especifico") => 
            setFormData(prev => ({ ...prev, tipoAcesso: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
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
            value={formData.ipPermitido || ""}
            onChange={(e) => setFormData(prev => ({ ...prev, ipPermitido: e.target.value }))}
            placeholder="Ex: 192.168.1.100 ou 192.168.1.0/24"
            required
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
