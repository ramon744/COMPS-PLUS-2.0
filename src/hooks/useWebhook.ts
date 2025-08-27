
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WebhookConfig {
  url: string;
  ativo: boolean;
}

export function useWebhook() {
  const { toast } = useToast();
  const [config, setConfig] = useState<WebhookConfig>({
    url: '',
    ativo: false,
  });

  // Carregar configuração do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('webhook-config');
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  // Salvar configuração no localStorage
  const saveConfig = (newConfig: WebhookConfig) => {
    setConfig(newConfig);
    localStorage.setItem('webhook-config', JSON.stringify(newConfig));
  };

  // Enviar dados para o webhook
  const sendWebhook = async (data: any) => {
    if (!config.ativo || !config.url) {
      return;
    }

    try {
      const response = await fetch(config.url, {
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

      toast({
        title: "Webhook enviado",
        description: "Dados enviados para o webhook configurado.",
      });
    } catch (error) {
      console.error('Erro ao enviar webhook:', error);
      toast({
        title: "Erro no webhook",
        description: "Falha ao enviar dados para o webhook.",
        variant: "destructive",
      });
    }
  };

  return {
    config,
    saveConfig,
    sendWebhook,
  };
}
