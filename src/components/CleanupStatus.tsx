import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Clock, Database, Bell, FileText, RefreshCw } from "lucide-react";
import { useCleanup } from "@/hooks/useCleanup";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function CleanupStatus() {
  const { 
    status, 
    manualCleanup, 
    cleanupNotifications, 
    cleanupPDFs, 
    shouldCleanup 
  } = useCleanup();

  const formatLastCleanup = (date: Date | null) => {
    if (!date) return "Nunca executada";
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <Card className="p-6 bg-gradient-card shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Limpeza Automática do Sistema
        </h3>
        <Badge variant={status.isRunning ? "default" : "secondary"}>
          {status.isRunning ? "Executando..." : "Ativo"}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Status da Limpeza */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Notificações</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Limpas automaticamente às 5h (início do dia operacional)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Última limpeza: {formatLastCleanup(status.lastCleanup)}
            </p>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-green-500" />
              <span className="font-medium">PDFs</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Removidos automaticamente após 72 horas
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Economiza espaço no banco de dados
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        {(status.notificationsDeleted > 0 || status.closingsDeleted > 0) && (
          <div className="p-4 bg-info/10 rounded-lg border border-info/20">
            <h4 className="font-medium text-info mb-2">Última Limpeza</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Notificações removidas:</span>
                <span className="ml-2 font-medium">{status.notificationsDeleted}</span>
              </div>
              <div>
                <span className="text-muted-foreground">PDFs removidos:</span>
                <span className="ml-2 font-medium">{status.closingsDeleted}</span>
              </div>
            </div>
          </div>
        )}

        {/* Próxima Limpeza */}
        <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-warning" />
            <span className="font-medium text-warning">Próxima Limpeza</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {shouldCleanup 
              ? "Executando agora (5h da manhã)" 
              : "Próxima execução às 5h da manhã"
            }
          </p>
        </div>

        {/* Botões de Limpeza Manual */}
        <div className="space-y-3">
          <h4 className="font-medium">Limpeza Manual</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button
              onClick={cleanupNotifications}
              disabled={status.isRunning}
              variant="outline"
              size="sm"
              className="justify-start"
            >
              <Bell className="h-4 w-4 mr-2" />
              Limpar Notificações
            </Button>
            
            <Button
              onClick={cleanupPDFs}
              disabled={status.isRunning}
              variant="outline"
              size="sm"
              className="justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Limpar PDFs Antigos
            </Button>
            
            <Button
              onClick={manualCleanup}
              disabled={status.isRunning}
              variant="default"
              size="sm"
              className="justify-start"
            >
              {status.isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Limpeza Completa
            </Button>
          </div>
        </div>

        {/* Erro */}
        {status.error && (
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-sm text-destructive">
              <strong>Erro:</strong> {status.error}
            </p>
          </div>
        )}

        {/* Informações Adicionais */}
        <div className="p-4 bg-muted/20 rounded-lg">
          <h4 className="font-medium mb-2">Como Funciona</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>Notificações:</strong> Removidas às 5h da manhã (início do dia operacional)</li>
            <li>• <strong>PDFs:</strong> Removidos automaticamente após 72 horas</li>
            <li>• <strong>Economia:</strong> Evita acúmulo de dados desnecessários</li>
            <li>• <strong>Segurança:</strong> Apenas dados antigos são removidos</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
