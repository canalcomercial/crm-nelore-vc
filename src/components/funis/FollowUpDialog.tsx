import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCriarFollowUp, useUsuarios } from "@/hooks/useCrm";
import type { Lead } from "@/types/crm";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: Lead | null;
}

const TIPOS = [
  { value: "ligacao", label: "Ligação" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "visita", label: "Visita" },
  { value: "email", label: "E-mail" },
];

function defaultDateTime() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  // formato yyyy-MM-ddTHH:mm
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FollowUpDialog({ open, onOpenChange, lead }: Props) {
  const { data: usuarios = [] } = useUsuarios();
  const criar = useCriarFollowUp();

  const [tipo, setTipo] = useState("ligacao");
  const [dataHora, setDataHora] = useState(defaultDateTime());
  const [responsavelId, setResponsavelId] = useState<string>("none");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (open) {
      setTipo("ligacao");
      setDataHora(defaultDateTime());
      setResponsavelId(lead?.responsavel_id ?? "none");
      setObservacao("");
    }
  }, [open, lead?.responsavel_id]);

  const handleSalvar = () => {
    if (!lead) return;
    if (!dataHora) {
      toast.error("Informe a data e hora do follow-up");
      return;
    }
    criar.mutate(
      {
        lead_id: lead.id,
        tipo,
        data_hora: new Date(dataHora).toISOString(),
        observacao: observacao.trim() || null,
        responsavel_id: responsavelId === "none" ? null : responsavelId,
        status: "pendente",
      },
      {
        onSuccess: () => {
          toast.success("Follow-up agendado");
          onOpenChange(false);
        },
        onError: (e: Error) => {
          toast.error("Erro ao agendar", { description: e?.message });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar follow-up</DialogTitle>
          <DialogDescription>
            {lead ? `Próxima ação para ${lead.nome}` : "Próxima ação"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo de contato</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Data e hora</Label>
            <Input
              type="datetime-local"
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Responsável</Label>
            <Select value={responsavelId} onValueChange={setResponsavelId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {usuarios.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Observação (opcional)</Label>
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Sobre o que falar, lembrete, próximo passo..."
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={criar.isPending}>
            {criar.isPending ? "Agendando..." : "Agendar follow-up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
