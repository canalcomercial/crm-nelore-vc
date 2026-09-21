import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { useCriarFunil, useAtualizarFunil, useDuplicarFunil, useExcluirFunil, useContarLeadsFunil, useFunis } from "@/hooks/useCrm";
import type { Funil } from "@/types/crm";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  funil?: Funil | null;
}

export function FunilEditor({ open, onOpenChange, funil }: Props) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState("#2D6A4F");
  const [etapas, setEtapas] = useState<string[]>([]);
  const [novaEtapa, setNovaEtapa] = useState("");
  const criar = useCriarFunil();
  const atualizar = useAtualizarFunil();
  const duplicar = useDuplicarFunil();
  const excluir = useExcluirFunil();
  const editando = !!funil;

  const [confirmExcluirOpen, setConfirmExcluirOpen] = useState(false);
  const [destinoFunilId, setDestinoFunilId] = useState<string>("");
  const { data: leadsCount = 0 } = useContarLeadsFunil(confirmExcluirOpen ? funil?.id : undefined);
  const { data: todosFunis = [] } = useFunis();
  const outrosFunis = todosFunis.filter((f) => f.id !== funil?.id && f.ativo);
  const destinoFunil = outrosFunis.find((f) => f.id === destinoFunilId);

  useEffect(() => {
    if (open) {
      setNome(funil?.nome ?? "");
      setCor(funil?.cor ?? "#2D6A4F");
      setEtapas(funil?.etapas ?? ["Novo lead", "Em contato", "Proposta", "Fechado", "Perdido"]);
      setNovaEtapa("");
    }
  }, [open, funil]);

  const addEtapa = () => {
    const v = novaEtapa.trim();
    if (!v) return;
    if (etapas.includes(v)) { toast.error("Etapa já existe"); return; }
    setEtapas([...etapas, v]);
    setNovaEtapa("");
  };

  const removeEtapa = (i: number) => setEtapas(etapas.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= etapas.length) return;
    const arr = [...etapas];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setEtapas(arr);
  };
  const renomear = (i: number, v: string) => {
    const arr = [...etapas];
    arr[i] = v;
    setEtapas(arr);
  };

  const salvar = async () => {
    if (!nome.trim()) { toast.error("Informe o nome do funil"); return; }
    const etapasLimpas = etapas.map((e) => e.trim()).filter(Boolean);
    if (etapasLimpas.length === 0) { toast.error("Adicione ao menos uma etapa"); return; }
    if (new Set(etapasLimpas).size !== etapasLimpas.length) { toast.error("Etapas duplicadas"); return; }

    if (editando && funil) {
      await atualizar.mutateAsync({ id: funil.id, nome: nome.trim(), etapas: etapasLimpas, cor });
    } else {
      await criar.mutateAsync({ nome: nome.trim(), etapas: etapasLimpas, cor });
    }
    onOpenChange(false);
  };

  const arquivar = async () => {
    if (!funil) return;
    if (!confirm("Arquivar este funil? Ele não aparecerá mais na lista.")) return;
    await atualizar.mutateAsync({ id: funil.id, ativo: false });
    onOpenChange(false);
  };

  const duplicarAtual = async () => {
    if (!funil) return;
    await duplicar.mutateAsync(funil);
    onOpenChange(false);
  };

  const excluirAtual = async () => {
    if (!funil) return;
    setDestinoFunilId("");
    setConfirmExcluirOpen(true);
  };

  const confirmarExclusao = async (mover: boolean) => {
    if (!funil) return;
    if (mover) {
      if (!destinoFunil || !destinoFunil.etapas?.[0]) {
        toast.error("Selecione o funil de destino");
        return;
      }
      await excluir.mutateAsync({
        id: funil.id,
        moverParaFunilId: destinoFunil.id,
        moverParaEtapa: destinoFunil.etapas[0],
      });
    } else {
      await excluir.mutateAsync({ id: funil.id });
    }
    setConfirmExcluirOpen(false);
    onOpenChange(false);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editando ? "Editar funil" : "Novo funil"}</DialogTitle>
          <DialogDescription>Configure o nome e as etapas do funil.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div>
              <Label className="text-xs">Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Vendas Matrizes" />
            </div>
            <div>
              <Label className="text-xs">Cor</Label>
              <Input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="h-10 w-16 p-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Etapas</Label>
            <div className="space-y-1.5 mt-1">
              {etapas.map((et, i) => (
                <div key={i} className="flex items-center gap-1 bg-secondary/40 rounded-md px-2 py-1">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={et}
                    onChange={(e) => renomear(i, e.target.value)}
                    className="h-8 border-0 bg-transparent focus-visible:ring-1"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, -1)} disabled={i === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => move(i, 1)} disabled={i === etapas.length - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeEtapa(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <Input
                value={novaEtapa}
                onChange={(e) => setNovaEtapa(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEtapa(); } }}
                placeholder="Nova etapa"
                className="h-9"
              />
              <Button type="button" variant="outline" onClick={addEtapa}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              Dica: leads em etapas removidas continuam no banco mas deixam de aparecer no kanban — mova-os antes de excluir.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {editando && (
            <div className="flex items-center gap-2 mr-auto flex-wrap">
              <Button variant="outline" onClick={duplicarAtual} disabled={duplicar.isPending}>
                Duplicar
              </Button>
              <Button variant="ghost" onClick={arquivar}>
                Arquivar
              </Button>
              <Button variant="ghost" className="text-destructive" onClick={excluirAtual} disabled={excluir.isPending}>
                Excluir
              </Button>
            </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} disabled={criar.isPending || atualizar.isPending}>
            {editando ? "Salvar" : "Criar funil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={confirmExcluirOpen} onOpenChange={setConfirmExcluirOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir funil</DialogTitle>
          <DialogDescription>
            {leadsCount > 0
              ? `Este funil tem ${leadsCount} lead${leadsCount === 1 ? "" : "s"}. O que deseja fazer com ${leadsCount === 1 ? "ele" : "eles"}?`
              : "Este funil não tem leads vinculados. Confirmar exclusão?"}
          </DialogDescription>
        </DialogHeader>

        {leadsCount > 0 && (
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Mover leads para outro funil</Label>
              <Select value={destinoFunilId} onValueChange={setDestinoFunilId}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Selecionar funil de destino..." />
                </SelectTrigger>
                <SelectContent>
                  {outrosFunis.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Nenhum outro funil disponível
                    </div>
                  ) : outrosFunis.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {destinoFunil && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Os leads serão movidos para a etapa "{destinoFunil.etapas?.[0]}"
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setConfirmExcluirOpen(false)}>
            Cancelar
          </Button>
          {leadsCount > 0 && (
            <Button
              variant="ghost"
              onClick={() => confirmarExclusao(false)}
              disabled={excluir.isPending}
              title="Desvincula os leads (eles ficam sem funil) e exclui"
            >
              Apenas desvincular
            </Button>
          )}
          <Button
            onClick={() => confirmarExclusao(leadsCount > 0)}
            disabled={excluir.isPending || (leadsCount > 0 && !destinoFunilId)}
          >
            {leadsCount > 0 ? "Mover e excluir funil" : "Excluir funil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
