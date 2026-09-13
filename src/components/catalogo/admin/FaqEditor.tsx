import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useConfiguracao, useSalvarConfiguracao, type FaqItem } from "@/hooks/useCatalogo";

export function FaqEditor() {
  const { data: config } = useConfiguracao();
  const salvar = useSalvarConfiguracao();
  const [itens, setItens] = useState<FaqItem[]>([]);

  // Só semeia o editor quando muda o registro carregado. Reagir a toda mudança
  // de `config` faria um refetch em background apagar edições não salvas.
  const idCarregado = useRef<string | null>(null);
  useEffect(() => {
    if (!config || idCarregado.current === config.id) return;
    idCarregado.current = config.id;
    if (config.faq) setItens(config.faq);
  }, [config]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= itens.length) return;
    const c = [...itens];
    [c[i], c[j]] = [c[j], c[i]];
    setItens(c);
  };

  return (
    <div className="bg-surface rounded-lg border p-4 max-w-3xl space-y-3">
      <p className="text-xs text-muted-foreground">Estes chips aparecem na página de detalhes do lote na seção "Qual informação você precisa?".</p>
      <div className="space-y-3">
        {itens.map((f, i) => (
          <div key={i} className="rounded-lg border p-3 space-y-2 bg-white">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Label className="text-[11px]">Título do chip</Label>
                <Input value={f.titulo} maxLength={60} onChange={(e) => { const c = [...itens]; c[i] = { ...c[i], titulo: e.target.value }; setItens(c); }} />
              </div>
              <div className="flex flex-col gap-0.5 pt-4">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => move(i, 1)} disabled={i === itens.length - 1}><ChevronDown className="h-3.5 w-3.5" /></Button>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setItens(itens.filter((_, x) => x !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
            <div>
              <Label className="text-[11px]">Conteúdo</Label>
              <Textarea rows={3} maxLength={1000} value={f.conteudo} onChange={(e) => { const c = [...itens]; c[i] = { ...c[i], conteudo: e.target.value }; setItens(c); }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => setItens([...itens, { titulo: "", conteudo: "" }])} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo chip
        </Button>
        <Button onClick={() => salvar.mutate({ faq: itens })} disabled={salvar.isPending}>
          {salvar.isPending ? "Salvando..." : "Salvar FAQ"}
        </Button>
      </div>
    </div>
  );
}