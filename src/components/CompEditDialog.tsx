import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoneyInput } from "@/components/MoneyInput";
import { Comp, CompType, Waiter } from "@/types";
import { Edit, Trash2 } from "lucide-react";

interface CompEditDialogProps {
  comp: Comp;
  compTypes: CompType[];
  waiters: Waiter[];
  onUpdate: (id: string, data: Partial<Comp>) => void;
  onDelete: (id: string) => void;
}

export function CompEditDialog({ comp, compTypes, waiters, onUpdate, onDelete }: CompEditDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    compTypeId: comp.compTypeId,
    waiterId: comp.waiterId,
    valorCentavos: comp.valorCentavos,
    motivo: comp.motivo,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        compTypeId: comp.compTypeId,
        waiterId: comp.waiterId,
        valorCentavos: comp.valorCentavos,
        motivo: comp.motivo,
      });
    }
  }, [isOpen, comp]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.compTypeId || !formData.waiterId || !formData.motivo || formData.valorCentavos <= 0) {
      return;
    }

    onUpdate(comp.id, {
      compTypeId: formData.compTypeId,
      waiterId: formData.waiterId,
      valorCentavos: formData.valorCentavos,
      motivo: formData.motivo,
    });

    setIsOpen(false);
  };

  const handleDelete = () => {
    onDelete(comp.id);
    setIsOpen(false);
  };

  const compType = compTypes.find(t => t.id === comp.compTypeId);
  const waiter = waiters.find(w => w.id === comp.waiterId);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
      >
        <Edit className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar COMP</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="compType">Tipo de COMP</Label>
              <Select 
                value={formData.compTypeId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, compTypeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {compTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.codigo} - {type.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="waiter">Atendente</Label>
              <Select 
                value={formData.waiterId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, waiterId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o atendente" />
                </SelectTrigger>
                <SelectContent>
                  {waiters.map((waiter) => (
                    <SelectItem key={waiter.id} value={waiter.id}>
                      {waiter.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor</Label>
              <MoneyInput
                value={formData.valorCentavos}
                onChange={(value) => setFormData(prev => ({ ...prev, valorCentavos: value }))}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Textarea
                id="motivo"
                value={formData.motivo}
                onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
                placeholder="Descreva o motivo do COMP"
                rows={3}
                required
              />
            </div>

            <DialogFooter className="gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este COMP? Esta ação não pode ser desfeita.
                      <br /><br />
                      <strong>Tipo:</strong> {compType?.codigo}<br />
                      <strong>Atendente:</strong> {waiter?.nome}<br />
                      <strong>Valor:</strong> {(comp.valorCentavos / 100).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              
              <Button type="submit" className="bg-gradient-primary">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}