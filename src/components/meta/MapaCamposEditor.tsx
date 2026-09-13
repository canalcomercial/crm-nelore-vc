import { useMemo } from "react";
import { Plus, X, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAtributosPersonalizados } from "@/hooks/useCrm";

const DESTINOS: { value: string; label: string }[] = [
  { value: "nome", label: "Nome" },
  { value: "telefone", label: "Telefone" },
  { value: "email", label: "E-mail (observações)" },
  { value: "cidade", label: "Cidade" },
  { value: "estado", label: "Estado" },
  { value: "extra:", label: "Campo extra" },
];

const CAMPOS_META_PADRAO = ["full_name", "email", "phone_number", "city", "state"];

type Row = { campo_meta: string; destino: string; extra_key?: string };

function toRows(mapa: Record<string, string>): Row[] {
  return Object.entries(mapa).map(([campo_meta, destino]) => {
    if (destino.startsWith("extra:")) {
      return { campo_meta, destino: "extra:", extra_key: destino.slice(6) };
    }
    return { campo_meta, destino };
  });
}

function toMap(rows: Row[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rows) {
    if (!r.campo_meta || !r.destino) continue;
    if (r.destino === "extra:") {
      if (r.extra_key) out[r.campo_meta] = `extra:${r.extra_key}`;
    } else {
      out[r.campo_meta] = r.destino;
    }
  }
  return out;
}

function useUltimoPayload(formId?: string) {
  return useQuery({
    queryKey: ["meta_ultimo_payload", formId ?? ""],
    enabled: !!formId,
    queryFn: async () => {
      const { data } = await supabase
        .from("meta_eventos_log" as never)
        .select("payload")
        .eq("form_id", formId!)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as { payload?: unknown } | null)?.payload ?? null;
    },
  });
}

function extrairCampos(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;
  const fd = (p.field_data ?? (p.leadgen as { field_data?: unknown } | undefined)?.field_data) as
    | Array<{ name?: string }>
    | undefined;
  if (Array.isArray(fd)) return fd.map((f) => f.name ?? "").filter(Boolean);
  return Object.keys(p);
}

function sugerirDestino(campo: string): { destino: string; extra_key?: string } {
  const c = campo.toLowerCase();
  if (c.includes("phone") || c.includes("tel")) return { destino: "telefone" };
  if (c.includes("mail")) return { destino: "email" };
  if (c.includes("name") || c === "full_name") return { destino: "nome" };
  if (c.includes("city")) return { destino: "cidade" };
  if (c.includes("state")) return { destino: "estado" };
  return { destino: "extra:", extra_key: campo };
}

export function MapaCamposEditor({
  value,
  onChange,
  formId,
}: {
  value: Record<string, string>;
  onChange: (mapa: Record<string, string>) => void;
  formId?: string;
}) {
  const rows = toRows(value);
  const { data: atributos = [] } = useAtributosPersonalizados() as { data: Array<{ chave: string; nome: string }> };
  const { data: payload } = useUltimoPayload(formId);

  const camposDetectados = useMemo(() => {
    const set = new Set<string>([...CAMPOS_META_PADRAO, ...extrairCampos(payload)]);
    rows.forEach((r) => r.campo_meta && set.delete(r.campo_meta));
    return Array.from(set);
  }, [payload, rows]);

  const update = (next: Row[]) => onChange(toMap(next));
  const adicionarSugestao = (campo: string) => {
    const s = sugerirDestino(campo);
    update([...rows, { campo_meta: campo, ...s }]);
  };

  return (
    <div className="space-y-3">
      <div className="text-[11px] text-muted-foreground">
        Mapeie cada campo do formulário Meta para uma coluna do CRM. Sugestões abaixo vêm do último payload recebido para este form.
      </div>

      {camposDetectados.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-2 space-y-2">
          <div className="text-[11px] font-medium flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Campos detectados
          </div>
          <div className="flex flex-wrap gap-1.5">
            {camposDetectados.map((c) => (
              <button
                key={c}
                onClick={() => adicionarSugestao(c)}
                className="text-[11px] px-2 py-1 rounded border bg-background hover:bg-primary/5 hover:border-primary font-mono"
              >
                + {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 && (
        <div className="text-xs text-muted-foreground bg-muted/40 rounded p-3">
          Nenhum mapeamento — o webhook tentará detectar automaticamente.
        </div>
      )}

      {rows.map((r, i) => (
        <div key={i} className="flex gap-2 items-center bg-surface border rounded p-1.5">
          <Input
            value={r.campo_meta}
            onChange={(e) => {
              const next = [...rows];
              next[i] = { ...r, campo_meta: e.target.value };
              update(next);
            }}
            placeholder="campo Meta"
            className="h-9 text-xs flex-1 font-mono"
          />
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Select
            value={r.destino}
            onValueChange={(v) => {
              const next = [...rows];
              next[i] = { ...r, destino: v };
              update(next);
            }}
          >
            <SelectTrigger className="h-9 text-xs w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DESTINOS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {r.destino === "extra:" && (
            <Input
              value={r.extra_key ?? ""}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...r, extra_key: e.target.value };
                update(next);
              }}
              placeholder="chave"
              list={`atributos-${i}`}
              className="h-9 text-xs w-[140px] font-mono"
            />
          )}
          <datalist id={`atributos-${i}`}>
            {atributos.map((a) => <option key={a.chave} value={a.chave}>{a.nome}</option>)}
          </datalist>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => update(rows.filter((_, j) => j !== i))}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={() => update([...rows, { campo_meta: "", destino: "nome" }])} className="gap-1.5">
        <Plus className="h-3.5 w-3.5" /> Adicionar campo
      </Button>

      {payload && (
        <details className="text-[11px] mt-2">
          <summary className="cursor-pointer text-muted-foreground">Ver payload real recebido</summary>
          <pre className="mt-1 p-2 rounded bg-muted/40 overflow-auto max-h-40 text-[10px]">{JSON.stringify(payload, null, 2)}</pre>
        </details>
      )}
      {!formId && (
        <Badge variant="outline" className="text-[10px]">Salve o form primeiro para ver sugestões automáticas do payload real.</Badge>
      )}
    </div>
  );
}