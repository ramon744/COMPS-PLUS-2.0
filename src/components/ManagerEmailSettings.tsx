import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Mail, User } from 'lucide-react';
import { useManagerEmailSettings } from '@/hooks/useManagerEmailSettings';
import { toast } from 'sonner';

export function ManagerEmailSettings() {
  const { settings, isLoading, isSaving, error, saveSettings } = useManagerEmailSettings();
  const [formData, setFormData] = useState({
    texto_padrao: '',
    assinatura: '',
    ativo: true
  });

  // Atualizar formData quando settings carregar
  useEffect(() => {
    if (settings) {
      setFormData({
        texto_padrao: settings.texto_padrao || '',
        assinatura: settings.assinatura || '',
        ativo: settings.ativo
      });
    }
  }, [settings]);

  const handleSave = async () => {
    const success = await saveSettings(formData);
    if (success) {
      toast.success('Configurações de email salvas com sucesso!');
    } else {
      toast.error('Erro ao salvar configurações de email');
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        texto_padrao: settings.texto_padrao || '',
        assinatura: settings.assinatura || '',
        ativo: settings.ativo
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configurações de Email
          </CardTitle>
          <CardDescription>
            Personalize o texto padrão dos seus emails de relatório
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Carregando configurações...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Configurações de Email
        </CardTitle>
        <CardDescription>
          Personalize o texto padrão dos seus emails de relatório. 
          Use {'{data_operacional}'} para inserir a data automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="ativo" className="text-base font-medium">
                Configurações Ativas
              </Label>
              <p className="text-sm text-muted-foreground">
                Ative ou desative suas configurações personalizadas
              </p>
            </div>
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="texto_padrao" className="text-base font-medium">
              Texto Padrão do Email
            </Label>
            <p className="text-sm text-muted-foreground">
              Este texto será usado como corpo principal do email de relatório
            </p>
            <Textarea
              id="texto_padrao"
              placeholder="Relatório de fechamento do dia operacional {data_operacional}"
              value={formData.texto_padrao}
              onChange={(e) => setFormData(prev => ({ ...prev, texto_padrao: e.target.value }))}
              className="min-h-[100px]"
              disabled={!formData.ativo}
            />
            <p className="text-xs text-muted-foreground">
              💡 Dica: Use {'{data_operacional}'} para inserir a data automaticamente
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assinatura" className="text-base font-medium">
              Assinatura
            </Label>
            <p className="text-sm text-muted-foreground">
              Assinatura que será adicionada ao final do email
            </p>
            <Input
              id="assinatura"
              placeholder="Atenciosamente, Seu Nome"
              value={formData.assinatura}
              onChange={(e) => setFormData(prev => ({ ...prev, assinatura: e.target.value }))}
              disabled={!formData.ativo}
            />
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>Configurações individuais para cada gerente</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !formData.ativo}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
