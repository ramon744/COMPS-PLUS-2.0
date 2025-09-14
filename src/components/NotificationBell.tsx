import React, { useState } from 'react';
import { Bell, Download, ExternalLink, Check, CheckCheck, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/contexts/NotificationContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, isRealtimeConnected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  
  // Debug logs mais detalhados
  console.log('🔔 NotificationBell - Renderizando componente');
  console.log('🔔 NotificationBell - notifications:', notifications);
  console.log('🔔 NotificationBell - unreadCount:', unreadCount);
  console.log('🔔 NotificationBell - isLoading:', isLoading);
  console.log('🔔 NotificationBell - isRealtimeConnected:', isRealtimeConnected);
  console.log('🔔 NotificationBell - notifications.length:', notifications?.length || 0);

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Se for uma notificação de PDF, abrir o link diretamente
    if (notification.type === 'pdf_ready' && notification.pdf_url) {
      window.open(notification.pdf_url, '_blank');
    }
  };

  const handleViewPdf = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank');
  };

  const handleDownloadPdf = (pdfUrl: string) => {
    window.open(pdfUrl, '_blank');
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pdf_ready':
        return <Download className="h-4 w-4 text-green-600" />;
      case 'error':
        return <ExternalLink className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'pdf_ready':
        return 'border-l-green-500 bg-green-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Notificações</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Marcar todas como lidas
                </Button>
              )}
            </div>
          </div>
          
          <ScrollArea className="h-96">
            {isLoading ? (
              <div className="p-4 text-center text-muted-foreground">
                Carregando notificações...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhuma notificação
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                      !notification.read ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium text-sm ${
                            !notification.read ? 'font-semibold' : ''
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                          
                          {notification.type === 'pdf_ready' && notification.pdf_url && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewPdf(notification.pdf_url);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadPdf(notification.pdf_url);
                                }}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Baixar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  );
}
