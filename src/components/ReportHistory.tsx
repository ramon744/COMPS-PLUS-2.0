import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, DollarSign, FileText, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { useReportHistory } from "@/hooks/useReportHistory";
import { formatCurrency } from "@/lib/utils";

export function ReportHistory() {
  const { reports, isLoading, refreshHistory } = useReportHistory();

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-card shadow-card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Carregando histórico...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-card shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Histórico de Relatórios Enviados</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshHistory}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhum relatório enviado nos últimos 30 dias</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-4 border-l-4 border-l-primary/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-medium">
                      {(() => {
                        const [year, month, day] = report.diaOperacional.split('-');
                        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('pt-BR');
                      })()}
                    </span>
                    <Badge variant="secondary" className="ml-2">
                      {report.enviadoPara.length > 0 ? 'Enviado' : 'Não Enviado'}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{formatCurrency(report.totalValor)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>{report.totalQuantidade} COMPs</span>
                    </div>
                    <span>Fechado por: {report.fechadoPor}</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Enviado em: {report.fechadoEm}
                  </div>
                  
                  {report.observacao && (
                    <div className="text-xs text-muted-foreground italic">
                      Obs: {report.observacao}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {report.enviadoPara.length > 0 ? (
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Enviado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-warning">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Pendente</span>
                    </div>
                  )}
                </div>
              </div>

              {report.enviadoPara.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">Enviado para:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {report.enviadoPara.map((email, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {email}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          Exibindo relatórios dos últimos 30 dias • Total: {reports.length} relatórios
        </p>
      </div>
    </Card>
  );
}
