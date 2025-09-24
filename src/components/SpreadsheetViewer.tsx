import React, { useState, useEffect } from 'react';
import { useCompContext } from '@/contexts/CompContext';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function SpreadsheetViewer() {
  const { spreadsheetManager, isUpdating } = useCompContext();
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (spreadsheetManager) {
      const url = spreadsheetManager.getSpreadsheetUrl();
      setSpreadsheetUrl(url);
    }
  }, [spreadsheetManager]);

  const handleRefresh = async () => {
    if (!spreadsheetManager) return;
    
    setIsRefreshing(true);
    try {
      // Regenerar planilha
      const data = spreadsheetManager.getCurrentData();
      const newManager = new SpreadsheetManager(data);
      newManager.updateSpreadsheet(data.comps[0]); // Forçar atualização
      
      const newUrl = newManager.getSpreadsheetUrl();
      setSpreadsheetUrl(newUrl);
      
      toast.success('Planilha atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar planilha:', error);
      toast.error('Erro ao atualizar planilha');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDownload = () => {
    if (spreadsheetUrl) {
      const link = document.createElement('a');
      link.href = spreadsheetUrl;
      link.download = `relatorio_comps_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!spreadsheetManager) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Carregando planilha...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Planilha em Tempo Real</h3>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing || isUpdating}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            onClick={handleDownload}
            disabled={!spreadsheetUrl}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar
          </Button>
        </div>
      </div>

      {spreadsheetUrl ? (
        <div className="border rounded-lg overflow-hidden">
          <iframe
            src={spreadsheetUrl}
            className="w-full h-96"
            title="Planilha COMPS"
          />
        </div>
      ) : (
        <div className="p-6 text-center border rounded-lg">
          <p className="text-muted-foreground">Nenhuma planilha disponível</p>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        <p>• A planilha é atualizada automaticamente quando COMPs são criados</p>
        <p>• Mantém o formato exato da imagem original com cores e formatação</p>
        <p>• Substitui o sistema de webhook por atualização direta</p>
      </div>
    </div>
  );
}

