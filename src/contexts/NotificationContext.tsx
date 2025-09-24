import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  closing_id: string;
  title: string;
  message: string;
  type: 'pdf_ready' | 'error' | 'info';
  created_at: string;
  read: boolean;
  pdf_url?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => Promise<void>;
  isLoading: boolean;
  isRealtimeConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const { user } = useAuth();

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Erro ao carregar notificações:', error);
        return;
      }
      
      setNotifications(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
    }
  }, [user]);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          user_id: user.id,
          read: false
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar notificação:', error);
        return;
      }

      setNotifications(prev => [data, ...prev]);
    } catch (error) {
      console.error('Erro ao adicionar notificação:', error);
    }
  }, [user]);

  // Carregar notificações quando o usuário estiver autenticado
  useEffect(() => {
    if (user) {
      loadNotifications();
    } else {
      setNotifications([]);
      setIsLoading(false);
    }
  }, [user]); // Removido loadNotifications da dependência para evitar loop

  // Limpeza automática removida daqui - agora é feita apenas no useCleanup.ts
  // para evitar execuções duplicadas

  // Fallback: recarregar notificações periodicamente caso Realtime falhe
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, 30000); // Recarregar a cada 30 segundos

    return () => {
      clearInterval(interval);
    };
  }, [user]); // Removido loadNotifications da dependência para evitar loop

  // Real-time subscription para notificações
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes', {
        config: {
          broadcast: { self: false },
          presence: { key: user.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Verificar se a notificação já existe para evitar duplicatas
          setNotifications(prev => {
            const exists = prev.some(n => n.id === newNotification.id);
            if (exists) {
              return prev;
            }
            
            return [newNotification, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => 
            prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
          );
        }
      )
      .on('broadcast', { event: 'pdf-received' }, (payload) => {
        // Recarregar notificações quando receber broadcast
        loadNotifications();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Erro na subscription de notificações');
          setIsRealtimeConnected(false);
        } else if (status === 'TIMED_OUT') {
          console.warn('⚠️ Subscription timeout');
          setIsRealtimeConnected(false);
        } else if (status === 'CLOSED') {
          setIsRealtimeConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]); // Removido loadNotifications da dependência para evitar loop

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
        isLoading,
        isRealtimeConnected
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
