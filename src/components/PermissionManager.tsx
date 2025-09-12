import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Shield, Users, Settings } from 'lucide-react';
import { usePermissionManagement, PERMISSION_GROUPS } from '@/hooks/usePermissions';
import { toast } from 'sonner';

export function PermissionManager() {
  const { 
    allPermissions, 
    managers, 
    isLoading, 
    isSaving, 
    error, 
    isAdmin, 
    updatePermission 
  } = usePermissionManagement();

  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Apenas o administrador pode gerenciar permissões.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gerenciar Permissões
          </CardTitle>
          <CardDescription>
            Controle o acesso dos gerentes às diferentes seções do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando permissões...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handlePermissionChange = (managerId: string, permissionKey: string, granted: boolean) => {
    const key = `${managerId}::${permissionKey}`;
    setPendingChanges(prev => ({
      ...prev,
      [key]: granted
    }));
  };

  const saveChanges = async () => {
    const changes = Object.entries(pendingChanges);
    let successCount = 0;

    for (const [key, granted] of changes) {
      const [managerId, permissionKey] = key.split('::');
      const success = await updatePermission(managerId, permissionKey, granted);
      if (success) successCount++;
    }

    if (successCount === changes.length) {
      setPendingChanges({});
      toast.success('Permissões atualizadas com sucesso!');
    } else {
      toast.error('Algumas permissões não puderam ser atualizadas');
    }
  };

  const getManagerPermission = (managerId: string, permissionKey: string) => {
    const permission = allPermissions.find(p => 
      p.manager_id === managerId && p.permission_key === permissionKey
    );
    return permission?.granted ?? false;
  };

  const getManagerName = (managerId: string) => {
    const manager = managers.find(m => m.id === managerId);
    return manager?.nome || 'Gerente não encontrado';
  };

  const getManagerEmail = (managerId: string) => {
    const manager = managers.find(m => m.id === managerId);
    return manager?.email || 'Email não encontrado';
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Gerenciar Permissões
        </CardTitle>
        <CardDescription>
          Controle o acesso dos gerentes às diferentes seções do sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {PERMISSION_GROUPS.map((group) => (
          <div key={group.key} className="space-y-4">
            <div className="flex items-center gap-2">
              {group.category === 'cadastros' ? (
                <Users className="h-5 w-5 text-blue-600" />
              ) : (
                <Settings className="h-5 w-5 text-green-600" />
              )}
              <div>
                <h3 className="font-semibold text-lg">{group.label}</h3>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              {managers.map((manager) => {
                const currentValue = getManagerPermission(manager.id, group.key);
                const pendingValue = pendingChanges[`${manager.id}::${group.key}`];
                const displayValue = pendingValue !== undefined ? pendingValue : currentValue;
                const hasChanged = pendingValue !== undefined;

                return (
                  <div
                    key={`${manager.id}::${group.key}`}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      hasChanged ? 'border-orange-300 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{manager.nome}</span>
                        {hasChanged && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            Alterado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getManagerEmail(manager.id)}
                      </p>
                    </div>
                    <Switch
                      checked={displayValue}
                      onCheckedChange={(checked) => 
                        handlePermissionChange(manager.id, group.key, checked)
                      }
                    />
                  </div>
                );
              })}
            </div>

            <Separator />
          </div>
        ))}

        {hasPendingChanges && (
          <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {Object.keys(pendingChanges).length} alteração(ões) pendente(s)
              </span>
            </div>
            <Button
              onClick={saveChanges}
              disabled={isSaving}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
