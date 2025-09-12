import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Settings, User } from 'lucide-react';
import { useManagerFlowSettings } from '@/hooks/useManagerFlowSettings';
import { toast } from 'sonner';

export function ManagerFlowSettings() {
  const { settings, isLoading, isSaving, error, saveSettings } = useManagerFlowSettings();
  const [formData, setFormData] = useState({
    manter_tipo_selecionado: true,
    manter_waiter_selecionado: false,
    foco_apos_salvar: 'valor' as 'valor' | 'motivo',
    ativo: true
  });

  // Atualizar formData quando settings carregar
  useEffect(() => {
    if (settings) {
      console.log('🔄 Aplicando configurações no formulário:', settings);
      const newFormData = {
        manter_tipo_selecionado: settings.manter_tipo_selecionado,
        manter_waiter_selecionado: settings.manter_waiter_selecionado,
        foco_apos_salvar: settings.foco_apos_salvar,
        ativo: settings.ativo
      };
      console.log('🔄 Novo formData:', newFormData);
      setFormData(newFormData);
    } else {
      console.log('⚠️ Nenhuma configuração encontrada, usando padrões');
    }
  }, [settings]);

  const handleSave = async () => {
    console.log('💾 Estado atual do formData antes de salvar:', formData);
    console.log('💾 Salvando configurações:', formData);
    const success = await saveSettings(formData);
    if (success) {
      console.log('✅ Configurações salvas com sucesso');
      toast.success('Configurações de fluxo salvas com sucesso!');
    } else {
      console.log('❌ Erro ao salvar configurações');
      toast.error('Erro ao salvar configurações de fluxo');
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData({
        manter_tipo_selecionado: settings.manter_tipo_selecionado,
        manter_waiter_selecionado: settings.manter_waiter_selecionado,
        foco_apos_salvar: settings.foco_apos_salvar,
        ativo: settings.ativo
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Fluxo
          </CardTitle>
          <CardDescription>
            Personalize como o formulário de COMPs se comporta
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
          <Settings className="h-5 w-5" />
          Configurações de Fluxo
        </CardTitle>
        <CardDescription>
          Personalize como o formulário de COMPs se comporta para você
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
              <label className="text-base font-medium">
                Configurações Ativas
              </label>
              <p className="text-sm text-muted-foreground">
                Ative ou desative suas configurações personalizadas
              </p>
            </div>
            <Switch
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-base font-medium">
                Manter Tipo de COMP Selecionado
              </label>
              <p className="text-sm text-muted-foreground">
                Após registrar um COMP, manter o tipo selecionado para o próximo
              </p>
            </div>
            <Switch
              checked={formData.manter_tipo_selecionado}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, manter_tipo_selecionado: checked }))}
              disabled={!formData.ativo}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-base font-medium">
                Manter Atendente Selecionado
              </label>
              <p className="text-sm text-muted-foreground">
                Após registrar um COMP, manter o atendente selecionado para o próximo
              </p>
            </div>
            <Switch
              checked={formData.manter_waiter_selecionado}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, manter_waiter_selecionado: checked }))}
              disabled={!formData.ativo}
            />
          </div>

          <div className="space-y-2">
            <label className="text-base font-medium">
              Foco Após Salvar COMP
            </label>
            <p className="text-sm text-muted-foreground">
              Qual campo deve receber foco automaticamente após salvar um COMP
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={formData.foco_apos_salvar === "valor" ? "default" : "outline"}
                onClick={() => setFormData(prev => ({ ...prev, foco_apos_salvar: "valor" }))}
                className="justify-start"
                disabled={!formData.ativo}
              >
                Campo Valor
              </Button>
              <Button
                variant={formData.foco_apos_salvar === "motivo" ? "default" : "outline"}
                onClick={() => setFormData(prev => ({ ...prev, foco_apos_salvar: "motivo" }))}
                className="justify-start"
                disabled={!formData.ativo}
              >
                Campo Motivo
              </Button>
            </div>
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
