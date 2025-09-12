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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MoneyInput } from "./MoneyInput";
import { Save, SaveAll, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useSettings";
import { useManagerFlowSettings } from "@/hooks/useManagerFlowSettings";
import { CompType, Waiter } from "@/types";
import { cn } from "@/lib/utils";

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
  const { settings: flowSettings } = useManagerFlowSettings();
  const [formData, setFormData] = useState<CompFormData>({
    compTypeId: defaultValues?.compTypeId || "",
    waiterId: defaultValues?.waiterId || "",
    value: defaultValues?.value || 0,
    motivo: defaultValues?.motivo || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openWaiterCombobox, setOpenWaiterCombobox] = useState(false);
  const [formKey, setFormKey] = useState(0); // Chave para forçar re-renderização

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
      // Reset form but keep selected values based on individual flow settings
      const manterTipo = flowSettings?.manter_tipo_selecionado ?? true;
      const manterWaiter = flowSettings?.manter_waiter_selecionado ?? false;
      
      setFormData({
        compTypeId: manterTipo ? formData.compTypeId : "",
        waiterId: manterWaiter ? formData.waiterId : "",
        value: 0,
        motivo: "",
      });
      setErrors({});
      setFormKey(prev => prev + 1); // Forçar re-renderização limpa
      
      // Focus no campo correto baseado nas configurações individuais
      // Usar requestAnimationFrame para evitar conflitos de DOM
      requestAnimationFrame(() => {
        const focoAposSalvar = flowSettings?.foco_apos_salvar ?? 'valor';
        if (focoAposSalvar === 'valor') {
          const valorInput = document.querySelector('input[name="value"]') as HTMLInputElement;
          if (valorInput && document.contains(valorInput)) {
            valorInput.focus();
          }
        } else if (focoAposSalvar === 'motivo') {
          const motivoInput = document.querySelector('textarea[name="motivo"]') as HTMLTextAreaElement;
          if (motivoInput && document.contains(motivoInput)) {
            motivoInput.focus();
          }
        }
      });
      
      toast({
        title: "COMP salvo com sucesso!",
        description: "Pronto para o próximo lançamento.",
      });
    }
  };

  const updateFormData = (field: keyof CompFormData, value: any) => {
    console.log(`🔄 Atualizando campo ${field}:`, value);
    setFormData(prev => {
      if (prev[field] === value) {
        console.log(`⚠️ Valor já é o mesmo para ${field}, ignorando atualização`);
        return prev;
      }
      return { ...prev, [field]: value };
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div key={formKey} className="space-y-4 sm:space-y-6 animate-fade-in">
      <Card className="p-4 sm:p-6 bg-gradient-card shadow-card">
        <div className="space-y-4 sm:space-y-6">
          {/* Atendente */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base font-medium">
              Atendente <span className="text-destructive">*</span>
            </Label>
            <Popover open={openWaiterCombobox} onOpenChange={setOpenWaiterCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openWaiterCombobox}
                  className={cn(
                    "w-full justify-between h-10 sm:h-11 text-sm sm:text-base",
                    errors.waiterId ? "border-destructive" : "",
                    !formData.waiterId && "text-muted-foreground"
                  )}
                >
                  {formData.waiterId
                    ? waiters.find((waiter) => waiter.id === formData.waiterId)?.nome
                    : "Selecione o atendente"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[calc(100vw-2rem)] sm:w-[--radix-popover-trigger-width] p-0 z-50" 
                align="start"
                side="bottom"
                sideOffset={4}
                avoidCollisions={false}
                style={{
                  maxHeight: '40vh',
                  overflow: 'hidden'
                }}
              >
                <Command>
                  <CommandInput placeholder="Buscar atendente..." className="h-10 sm:h-11 text-sm sm:text-base" />
                  <CommandList className="max-h-[150px] sm:max-h-[300px]">
                    <CommandEmpty>Nenhum atendente encontrado.</CommandEmpty>
                    <CommandGroup>
                      {(() => {
                        const activeWaiters = waiters.filter(waiter => waiter.ativo);
                        console.log('🔍 Waiters no formulário:', waiters.length, 'Ativos:', activeWaiters.length);
                        return activeWaiters
                          .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                          .map((waiter) => (
                          <CommandItem
                            key={waiter.id}
                            value={waiter.nome}
                            onSelect={() => {
                              updateFormData("waiterId", waiter.id);
                              setOpenWaiterCombobox(false);
                            }}
                            className="h-10 sm:h-11 text-sm sm:text-base"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.waiterId === waiter.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {waiter.nome}
                          </CommandItem>
                        ));
                      })()}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.waiterId && (
              <p className="text-xs sm:text-sm text-destructive">{errors.waiterId}</p>
            )}
          </div>

          {/* Tipo de COMP */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base font-medium">
              Tipo de COMP <span className="text-destructive">*</span>
            </Label>
            <Select
              key={`compType-${formKey}`}
              value={formData.compTypeId}
              onValueChange={(value) => {
                console.log('🔄 Selecionando tipo de COMP:', value);
                updateFormData("compTypeId", value);
              }}
            >
              <SelectTrigger className={cn(
                "h-10 sm:h-11 text-sm sm:text-base",
                errors.compTypeId ? "border-destructive" : ""
              )}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {compTypes
                  .filter(type => type.ativo)
                  .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                  .map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.codigo} - {type.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.compTypeId && (
              <p className="text-xs sm:text-sm text-destructive">{errors.compTypeId}</p>
            )}
          </div>

          {/* Valor */}
          <MoneyInput
            name="value"
            value={formData.value}
            onChange={(value) => updateFormData("value", value)}
            label="Valor"
            required
            error={errors.value}
          />

          {/* Motivo */}
          <div className="space-y-2">
            <Label className="text-sm sm:text-base font-medium">
              Motivo <span className="text-destructive">*</span>
            </Label>
            <Textarea
              name="motivo"
              value={formData.motivo}
              onChange={(e) => updateFormData("motivo", e.target.value)}
              placeholder="Descreva o motivo do desconto (mín. 5 caracteres)"
              className={cn(
                "min-h-[80px] sm:min-h-[100px] text-sm sm:text-base",
                errors.motivo ? "border-destructive" : ""
              )}
              rows={3}
            />
            {errors.motivo && (
              <p className="text-xs sm:text-sm text-destructive">{errors.motivo}</p>
            )}
          </div>

        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Button
          onClick={() => handleSubmit(true)}
          className="h-10 sm:h-12 bg-gradient-primary shadow-button hover:shadow-float transition-all duration-200 text-sm sm:text-base"
          size="lg"
        >
          <SaveAll className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Salvar & Novo
        </Button>
        
        <Button
          onClick={() => handleSubmit(false)}
          variant="secondary"
          className="h-10 sm:h-12 shadow-card hover:shadow-button transition-all duration-200 text-sm sm:text-base"
          size="lg"
        >
          <Save className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          Salvar & Fechar
        </Button>
      </div>

      <Button
        onClick={onCancel}
        variant="outline"
        className="w-full h-10 sm:h-11 text-sm sm:text-base"
      >
        Cancelar
      </Button>
    </div>
  );
}
