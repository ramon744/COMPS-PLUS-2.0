import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyInput } from "./MoneyInput";
import { Save, SaveAll } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { CompType, Waiter } from "@/types";

interface CompFormData {
  compTypeId: string;
  waiterId: string;
  value: number; // in cents
  motivo: string;
}

interface CompFormProps {
  compTypes: CompType[];
  waiters: Waiter[];
  onSubmit: (data: CompFormData, saveAndNew: boolean) => void;
  onCancel: () => void;
  defaultValues?: Partial<CompFormData>;
}

export function CompForm({
  compTypes,
  waiters,
  onSubmit,
  onCancel,
  defaultValues,
}: CompFormProps) {
  const { toast } = useToast();
  const { config } = useSettings();
  const [formData, setFormData] = useState<CompFormData>({
    compTypeId: defaultValues?.compTypeId || "",
    waiterId: defaultValues?.waiterId || "",
    value: defaultValues?.value || 0,
    motivo: defaultValues?.motivo || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.compTypeId) {
      newErrors.compTypeId = "Tipo de COMP é obrigatório";
    }
    if (!formData.waiterId) {
      newErrors.waiterId = "Atendente é obrigatório";
    }
    if (formData.value <= 0) {
      newErrors.value = "Valor deve ser maior que zero";
    }
    if (!formData.motivo || formData.motivo.length < 5) {
      newErrors.motivo = "Motivo deve ter pelo menos 5 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (saveAndNew: boolean) => {
    if (!validateForm()) {
      toast({
        title: "Erro de validação",
        description: "Por favor, corrija os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    onSubmit(formData, saveAndNew);

    if (saveAndNew) {
      // Reset form but keep selected values based on preferences from settings
      setFormData({
        compTypeId: config.manterTipoSelecionado ? formData.compTypeId : "",
        waiterId: config.manterWaiterSelecionado ? formData.waiterId : "",
        value: 0,
        motivo: "",
      });
      setErrors({});
      
      toast({
        title: "COMP salvo com sucesso!",
        description: "Pronto para o próximo lançamento.",
      });
    }
  };

  const updateFormData = (field: keyof CompFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="p-6 bg-gradient-card shadow-card">
        <div className="space-y-6">
          {/* Tipo de COMP */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Tipo de COMP <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.compTypeId}
              onValueChange={(value) => updateFormData("compTypeId", value)}
            >
              <SelectTrigger className={errors.compTypeId ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {compTypes
                  .filter(type => type.ativo)
                  .map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.codigo} - {type.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.compTypeId && (
              <p className="text-sm text-destructive">{errors.compTypeId}</p>
            )}
          </div>

          {/* Atendente */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Atendente <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.waiterId}
              onValueChange={(value) => updateFormData("waiterId", value)}
            >
              <SelectTrigger className={errors.waiterId ? "border-destructive" : ""}>
                <SelectValue placeholder="Selecione o atendente" />
              </SelectTrigger>
              <SelectContent>
                {waiters
                  .filter(waiter => waiter.ativo)
                  .map((waiter) => (
                    <SelectItem key={waiter.id} value={waiter.id}>
                      {waiter.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.waiterId && (
              <p className="text-sm text-destructive">{errors.waiterId}</p>
            )}
          </div>

          {/* Valor */}
          <MoneyInput
            value={formData.value}
            onChange={(value) => updateFormData("value", value)}
            label="Valor"
            required
            error={errors.value}
          />

          {/* Motivo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={formData.motivo}
              onChange={(e) => updateFormData("motivo", e.target.value)}
              placeholder="Descreva o motivo do desconto (mín. 5 caracteres)"
              className={errors.motivo ? "border-destructive" : ""}
              rows={3}
            />
            {errors.motivo && (
              <p className="text-sm text-destructive">{errors.motivo}</p>
            )}
          </div>

        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => handleSubmit(true)}
          className="h-12 bg-gradient-primary shadow-button hover:shadow-float transition-all duration-200"
          size="lg"
        >
          <SaveAll className="mr-2 h-5 w-5" />
          Salvar & Novo
        </Button>
        
        <Button
          onClick={() => handleSubmit(false)}
          variant="secondary"
          className="h-12 shadow-card hover:shadow-button transition-all duration-200"
          size="lg"
        >
          <Save className="mr-2 h-5 w-5" />
          Salvar & Fechar
        </Button>
      </div>

      <Button
        onClick={onCancel}
        variant="outline"
        className="w-full"
      >
        Cancelar
      </Button>
    </div>
  );
}
