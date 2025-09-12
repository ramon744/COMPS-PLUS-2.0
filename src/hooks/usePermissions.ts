import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ManagerPermission {
  id: string;
  manager_id: string;
  permission_key: string;
  granted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PermissionGroup {
  key: string;
  label: string;
  description: string;
  category: 'cadastros' | 'settings';
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'access_cadastros',
    label: 'Cadastros',
    description: 'Acesso à seção de cadastros (Tipos de COMP, Atendentes, Gerentes)',
    category: 'cadastros'
  },
  {
    key: 'access_settings_geral',
    label: 'Configurações Gerais',
    description: 'Acesso às configurações gerais do sistema',
    category: 'settings'
  },
  {
    key: 'access_settings_email',
    label: 'Configurações de E-mail',
    description: 'Acesso às configurações globais de e-mail',
    category: 'settings'
  },
  {
    key: 'access_settings_webhook',
    label: 'Configurações de Webhook',
    description: 'Acesso às configurações de webhook',
    category: 'settings'
  },
  {
    key: 'access_settings_limpeza',
    label: 'Configurações de Limpeza',
    description: 'Acesso às configurações de limpeza automática',
    category: 'settings'
  },
  {
    key: 'access_settings_permissoes',
    label: 'Gerenciar Permissões',
    description: 'Acesso para gerenciar permissões de outros gerentes',
    category: 'settings'
  }
];

export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<ManagerPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar se o usuário tem uma permissão específica
  const hasPermission = useCallback((permissionKey: string): boolean => {
    if (!user) {
      console.log('🔍 hasPermission - Sem usuário');
      return false;
    }
    
    // ADM sempre tem todas as permissões
    if (user.email === 'ramonflora2@gmail.com') {
      console.log('🔍 hasPermission - ADM, permissão concedida:', permissionKey);
      return true;
    }
    
    console.log('🔍 hasPermission - Usuário:', user.email, 'ID:', user.id);
    console.log('🔍 hasPermission - Permissão solicitada:', permissionKey);
    console.log('🔍 hasPermission - Permissões disponíveis:', permissions);
    console.log('🔍 hasPermission - Total de permissões:', permissions.length);
    
    // Buscar permissão - agora as permissões já vêm com o ID correto do manager
    const permission = permissions.find(p => 
      p.permission_key === permissionKey && 
      p.granted
    );
    
    console.log('🔍 hasPermission - Permissão encontrada:', permission);
    console.log('🔍 hasPermission - Resultado:', !!permission);
    
    return !!permission;
  }, [user, permissions]);

  // Carregar permissões do usuário atual
  const loadPermissions = useCallback(async (showToast = false) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Agora o user.id é o mesmo ID do manager, então podemos usar diretamente
      const { data, error: fetchError } = await supabase
        .from('manager_permissions' as any)
        .select('*')
        .eq('manager_id', user.id);

      if (fetchError) {
        console.error('❌ Erro ao carregar permissões:', fetchError);
        throw fetchError;
      }

      console.log('🔍 Permissões carregadas para usuário:', user.email, data);
      console.log('🔍 Total de permissões carregadas:', (data as any)?.length || 0);
      setPermissions((data as any) || []);
      
      if (showToast) {
        console.log('✅ Permissões recarregadas com sucesso');
      }
    } catch (err) {
      console.error('Erro ao carregar permissões:', err);
      setError('Erro ao carregar permissões');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Carregar permissões quando o usuário estiver autenticado
  useEffect(() => {
    if (user) {
      loadPermissions();
    }
  }, [user, loadPermissions]);

  // Listener para mudanças em tempo real nas permissões
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('permissions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'manager_permissions',
          filter: `manager_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Mudança detectada nas permissões:', payload);
          console.log('🔄 Usuário atual:', user.email, 'ID:', user.id);
          console.log('🔄 Manager ID da mudança:', (payload.new as any)?.manager_id || (payload.old as any)?.manager_id);
          
          // Verificar se a mudança é para o usuário atual
          const changedManagerId = (payload.new as any)?.manager_id || (payload.old as any)?.manager_id;
          if (changedManagerId === user.id) {
            console.log('🔄 Mudança é para o usuário atual, recarregando permissões...');
            loadPermissions(); // Recarregar permissões quando houver mudanças
          } else {
            console.log('🔄 Mudança é para outro usuário, ignorando...');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadPermissions]);

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    loadPermissions
  };
}

// Hook para gerenciar permissões (apenas ADM)
export function usePermissionManagement() {
  const { user } = useAuth();
  const [allPermissions, setAllPermissions] = useState<ManagerPermission[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se é ADM
  const isAdmin = user?.email === 'ramonflora2@gmail.com';
  
  // Debug: verificar dados do usuário
  console.log('🔍 usePermissions - user:', user);
  console.log('🔍 usePermissions - isAdmin:', isAdmin);

  // Carregar todas as permissões e gerentes
  const loadAllData = useCallback(async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Carregar permissões
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('manager_permissions' as any)
        .select(`
          *,
          manager:manager_id (
            id,
            nome,
            usuario
          )
        `);

      if (permissionsError) throw permissionsError;

      // Carregar gerentes
      const { data: managersData, error: managersError } = await supabase
        .from('profiles')
        .select('*')
        .order('nome');

      if (managersError) throw managersError;

      setAllPermissions((permissionsData as any) || []);
      setManagers(managersData || []);
    } catch (err) {
      console.error('Erro ao carregar dados de permissões:', err);
      setError('Erro ao carregar dados de permissões');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Atualizar permissão
  const updatePermission = useCallback(async (
    managerId: string, 
    permissionKey: string, 
    granted: boolean
  ) => {
    if (!isAdmin || !user?.id) return false;

    try {
      setIsSaving(true);
      setError(null);

      const { error } = await supabase
        .from('manager_permissions' as any)
        .upsert({
          manager_id: managerId,
          permission_key: permissionKey,
          granted,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'manager_id,permission_key'
        });

      if (error) throw error;

      // Recarregar dados
      await loadAllData();
      return true;
    } catch (err) {
      console.error('Erro ao atualizar permissão:', err);
      setError('Erro ao atualizar permissão');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isAdmin, user?.id, loadAllData]);

  // Função para testar permissões de qualquer usuário (apenas para debug)
  const testUserPermission = useCallback(async (userId: string, permissionKey: string) => {
    try {
      const { data, error } = await supabase
        .from('manager_permissions' as any)
        .select('*')
        .eq('manager_id', userId)
        .eq('permission_key', permissionKey)
        .eq('granted', true)
        .single();

      if (error) {
        console.error('Erro ao testar permissão:', error);
        return false;
      }

      console.log('🧪 Teste de permissão:', {
        userId,
        permissionKey,
        hasPermission: !!data,
        permission: data
      });

      return !!data;
    } catch (err) {
      console.error('Erro ao testar permissão:', err);
      return false;
    }
  }, []);

  // Carregar dados quando for ADM
  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin, loadAllData]);

  console.log('🔍 usePermissionManagement - Exportando funções:', {
    allPermissions: typeof allPermissions,
    managers: typeof managers,
    updatePermission: typeof updatePermission
  });

  return {
    allPermissions,
    managers,
    isLoading,
    isSaving,
    error,
    isAdmin,
    updatePermission,
    loadAllData,
    testUserPermission
  };
}
