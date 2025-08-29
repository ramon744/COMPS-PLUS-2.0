
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/use-toast';

export function useWebhook() {
  const { toast } = useToast();
  const { config } = useSettings();

  // Enviar dados para o webhook
  const sendWebhook = async (data: any) => {
    if (!config.webhookAtivo || !config.webhookUrl) {
      console.log('Webhook não está configurado ou ativo:', { 
        ativo: config.webhookAtivo, 
        url: config.webhookUrl 
      });
      return;
    }

    console.log('Enviando dados para webhook:', { 
      url: config.webhookUrl, 
      data 
    });

    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          triggered_from: window.location.origin,
          ...data, // Espalhar os dados diretamente no nível raiz
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('Webhook enviado com sucesso:', response.status);
      
      toast({
        title: "Webhook enviado",
        description: "Dados enviados para o webhook configurado.",
      });
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
      toast({
        title: "Erro no webhook",
        description: `Falha ao enviar dados para o webhook: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    }
  };

  return {
    sendWebhook,
  };
}
