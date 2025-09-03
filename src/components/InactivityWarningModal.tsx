import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface InactivityWarningModalProps {
  isOpen: boolean;
  remainingTime: number;
  onExtendSession: () => void;
  onLogout?: () => void;
}

export function InactivityWarningModal({ 
  isOpen, 
  remainingTime, 
  onExtendSession,
  onLogout 
}: InactivityWarningModalProps) {
  const { signOut } = useAuth();

  // Converter tempo restante em minutos e segundos
  const minutes = Math.floor(remainingTime / 60000);
  const seconds = Math.floor((remainingTime % 60000) / 1000);

  const handleLogout = async () => {
    try {
      if (onLogout) {
        onLogout();
      } else {
        await signOut();
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  // Formatação do tempo restante
  const formatTime = () => {
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-yellow-700">
                Sessão Expirando
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-sm text-gray-600">
            Sua sessão expirará em <strong className="text-yellow-700">{formatTime()}</strong> devido à inatividade.
            <br />
            <br />
            Deseja continuar usando o sistema ou fazer logout agora?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="bg-yellow-50 rounded-lg p-3 my-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Tempo restante:</p>
              <p className="text-yellow-700 font-mono text-lg">{formatTime()}</p>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex-1"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Fazer Logout
          </Button>
          
          <Button
            onClick={onExtendSession}
            className="flex-1 bg-gradient-primary"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Continuar Sessão
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
