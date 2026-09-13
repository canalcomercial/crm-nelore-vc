import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";
import {
  GENETICA_FONTES,
  blocoGeneticoVazio,
  type GeneticaAnimal,
  type GeneticaBloco,
  type GeneticaFonte,
  type GeneticaLinha,
} from "@/hooks/useCatalogo";

/**
 * Editor dos blocos de avaliação genética exibidos na ficha do catálogo.
 *
 * Cada fonte (PMGZ / ANCP / GenePlus) tem os números de destaque (resumo) e a
 * tabela DEP / ÍNDICE / TOP. Os valores são texto por opção: o catálogo mostra
 * exatamente o que a associação divulga (ex.: "0,5", "-", "TOP 1%").
 */
export function GeneticaEditor({
  value,
  onChange,
}: {
  value: GeneticaAnimal;
  onChange: (v: GeneticaAnimal) => void;
}) {
  const setBloco = (fonte: GeneticaFonte, bloco: GeneticaBloco) => onChange({ ...value, [fonte]: bloco });

  return (
    <Tabs defaultValue="pmgz">
      <TabsList className="w-full justify-start">
        {GENETICA_FONTES.map((f) => (
          <TabsTrigger key={f.id} value={f.id}>{f.nome}</TabsTrigger>
        ))}
        <TabsTrigger value="ventre">Ventre</TabsTrigger>
      </TabsList>

      {GENETICA_FONTES.map((f) => (
        <TabsContent key={f.id} value={f.id} className="mt-4">
          <BlocoEditor
            bloco={value[f.id] ?? blocoGeneticoVazio(f.id)}
            onChange={(b) => setBloco(f.id, b)}
            onLimpar={() => setBloco(f.id, blocoGeneticoVazio(f.id))}
          />
        </TabsContent>
      ))}

      <TabsContent value="ventre" className="mt-4">
        <p className="text-xs text-neutral-500 mb-3">
          Exibido no rodapé da ficha das fêmeas, ao lado do pai da prenhez e da previsão de parto
          (esses dois são preenchidos na aba “Ficha técnica”).
        </p>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div className="space-y-1.5">
            <Label className="text-xs">iABCZ do ventre</Label>
            <Input
              value={value.ventre?.iabcz ?? ""}
              onChange={(e) => onChange({ ...value, ventre: { ...value.ventre, iabcz: e.target.value } })}
              placeholder="34,39"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">DECA do ventre</Label>
            <Input
              value={value.ventre?.deca ?? ""}
              onChange={(e) => onChange({ ...value, ventre: { ...value.ventre, deca: e.target.value } })}
              placeholder="1"
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function BlocoEditor({
  bloco,
  onChange,
  onLimpar,
}: {
  bloco: GeneticaBloco;
  onChange: (b: GeneticaBloco) => void;
  onLimpar: () => void;
}) {
  const resumo = bloco.resumo ?? [];
  const linhas = bloco.linhas ?? [];

  const setResumo = (i: number, patch: Partial<{ label: string; valor: string }>) => {
    const c = [...resumo];
    c[i] = { ...c[i], ...patch };
    onChange({ ...bloco, resumo: c });
  };

  const setLinha = (i: number, patch: Partial<GeneticaLinha>) => {
    const c = [...linhas];
    c[i] = { ...c[i], ...patch };
    onChange({ ...bloco, linhas: c });
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Números de destaque</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange({ ...bloco, resumo: [...resumo, { label: "", valor: "" }] })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Coluna
          </Button>
        </div>
        <div className="space-y-2">
          {resumo.length === 0 && (
            <p className="text-xs text-neutral-500">Nenhum número de destaque.</p>
          )}
          {resumo.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
              <Input placeholder="Rótulo (iABCZ)" value={r.label} onChange={(e) => setResumo(i, { label: e.target.value })} />
              <Input placeholder="Valor (27,42)" value={r.valor} onChange={(e) => setResumo(i, { valor: e.target.value })} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange({ ...bloco, resumo: resumo.filter((_, x) => x !== i) })}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs">Tabela DEP / ÍNDICE / TOP</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onChange({ ...bloco, linhas: [...linhas, { dep: "", indice: "", top: "" }] })}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Linha
          </Button>
        </div>
        <div className="space-y-2">
          {linhas.length === 0 && <p className="text-xs text-neutral-500">Nenhuma linha cadastrada.</p>}
          {linhas.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 items-center">
              <Input placeholder="DEP (PNg)" value={l.dep} onChange={(e) => setLinha(i, { dep: e.target.value })} />
              <Input placeholder="Índice (0,73)" value={l.indice} onChange={(e) => setLinha(i, { indice: e.target.value })} />
              <Input placeholder="Top (10)" value={l.top} onChange={(e) => setLinha(i, { top: e.target.value })} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange({ ...bloco, linhas: linhas.filter((_, x) => x !== i) })}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onLimpar} className="text-xs">
        Limpar bloco
      </Button>
    </div>
  );
}
