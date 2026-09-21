import { useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2, Download, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useEventos } from "@/hooks/useCatalogo";
import { gerarModeloEmbrioes, mapearArquivoEmbrioes, type ResultadoEmbrioes } from "@/lib/importar-embrioes";
import type { EmbriaoDados } from "@/types/embrioes";

const SEM_EVENTO = "__nenhum__";

/**
 * Importação EXCLUSIVA de embriões. Lê a planilha de embriões (uma linha por
 * acasalamento), mostra a prévia dos pacotes e grava em `animais` com
 * categoria "Embrião", vinculando ao evento de embriões escolhido.
 */
export function ImportarEmbrioesDialog({ open, onOpenChange, eventoInicial }: { open: boolean; onOpenChange: (v: boolean) => void; eventoInicial?: string }) {
  const { data: eventos = [] } = useEventos();
  // Lista todos os eventos: os de embriões primeiro. Se o usuário escolher um
  // evento que ainda está marcado como "Animais", ele é convertido na importação.
  const eventosEmbrioes = useMemo(
    () => [...eventos].sort((a, b) => Number(b.tipo === "embrioes") - Number(a.tipo === "embrioes")),
    [eventos],
  );
  const [eventoId, setEventoId] = useState<string>(eventoInicial ?? SEM_EVENTO);
  const [substituir, setSubstituir] = useState(true);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const [lendo, setLendo] = useState(false);
  const [gravando, setGravando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const evento = eventoId === SEM_EVENTO ? null : eventoId;
  const previa: ResultadoEmbrioes | null = useMemo(
    () => (bytes && arquivo ? mapearArquivoEmbrioes(bytes, arquivo.name, { eventoId: evento }) : null),
    [bytes, arquivo, evento],
  );

  const limpar = () => {
    setArquivo(null);
    setBytes(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const baixarModelo = () => {
    const url = URL.createObjectURL(gerarModeloEmbrioes());
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-planilha-embrioes.xlsx";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const aoEscolher = async (file: File) => {
    setLendo(true);
    try {
      const buf = await file.arrayBuffer();
      const r = mapearArquivoEmbrioes(buf, file.name);
      setArquivo(file);
      setBytes(buf);
      if (!r.pacotes.length) toast.error(r.avisos[0] ?? "Nenhum pacote de embriões encontrado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não consegui ler a planilha");
      limpar();
    } finally {
      setLendo(false);
    }
  };

  const importar = async () => {
    if (!previa?.pacotes.length) return;
    setGravando(true);
    try {
      if (evento) {
        const ev = eventos.find((e) => e.id === evento);
        if (ev && ev.tipo !== "embrioes") {
          const { error } = await supabase.from("eventos").update({ tipo: "embrioes" }).eq("id", evento);
          if (error) throw error;
        }
      }
      if (evento && substituir) {
        const { error } = await supabase.from("animais").delete().eq("evento_id", evento).eq("categoria", "Embrião");
        if (error) throw error;
      }
      for (let i = 0; i < previa.pacotes.length; i += 100) {
        const { error } = await supabase.from("animais").insert(previa.pacotes.slice(i, i + 100) as never);
        if (error) throw error;
      }
      toast.success(`${previa.pacotes.length} ${previa.pacotes.length === 1 ? "pacote de embriões importado" : "pacotes de embriões importados"}`);
      qc.invalidateQueries({ queryKey: ["animais"] });
      qc.invalidateQueries({ queryKey: ["animais-por-evento"] });
      qc.invalidateQueries({ queryKey: ["eventos"] });
      qc.invalidateQueries({ queryKey: ["eventos-ativos"] });
      onOpenChange(false);
      limpar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao importar embriões");
    } finally {
      setGravando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) limpar(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar planilha de embriões</DialogTitle>
          <DialogDescription>
            Exclusivo para pacotes de embriões. Cada lote vira uma página no layout do catálogo de embriões, com doadora,
            avô materno, acasalamento, garantia e projeções ANCP/PMGZ. Fêmeas e touros continuam no importador padrão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <Button variant="outline" onClick={baixarModelo} className="w-full gap-2">
            <Download className="h-4 w-4" /> Baixar modelo da planilha de embriões
          </Button>

          <div className="grid gap-3">
            <div className="space-y-1">
              <Label htmlFor="evento-embrioes" className="text-xs">Evento de embriões</Label>
              <Select value={eventoId} onValueChange={setEventoId}>
                <SelectTrigger id="evento-embrioes"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={SEM_EVENTO}>Sem evento (só cadastrar)</SelectItem>
                  {eventosEmbrioes.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}{e.tipo !== "embrioes" ? " (será marcado como embriões)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {eventosEmbrioes.length === 0 && (
                <p className="text-[11px] text-muted-foreground">Nenhum evento cadastrado. Crie um evento na aba Evento atual para publicar a página do catálogo.</p>
              )}
            </div>
            {evento && (
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={substituir} onCheckedChange={setSubstituir} id="substituir-embrioes" />
                Substituir pacotes já importados neste evento
              </label>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 hover:bg-muted/40">
            {lendo ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Upload className="h-4 w-4 shrink-0" />}
            <span className="truncate">{arquivo ? arquivo.name : "Escolher planilha de embriões (.xlsx, .xls ou .csv)"}</span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,text/csv"
              className="hidden"
              data-testid="input-planilha-embrioes"
              onChange={(e) => e.target.files?.[0] && aoEscolher(e.target.files[0])}
            />
          </label>

          {previa && (
            <div className="space-y-3 rounded-md border bg-muted/30 p-3">
              {previa.pacotes.length > 0 ? (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <div className="font-semibold" data-testid="previa-embrioes">
                      {previa.pacotes.length} {previa.pacotes.length === 1 ? "pacote" : "pacotes"} · {previa.acasalamentos} {previa.acasalamentos === 1 ? "acasalamento" : "acasalamentos"}
                    </div>
                    <div className="text-xs text-muted-foreground">Cabeçalho lido na linha {previa.linhaCabecalho}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />{previa.avisos[0]}</div>
              )}

              {previa.pacotes.length > 0 && (
                <div className="max-h-56 overflow-auto rounded border bg-background">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-muted text-left">
                      <tr><th className="px-2 py-1.5">Lote</th><th className="px-2 py-1.5">Pacote</th><th className="px-2 py-1.5">Criatório</th><th className="px-2 py-1.5 text-right">Embriões</th><th className="px-2 py-1.5 text-right">Garantia</th><th className="px-2 py-1.5 text-right">Acas.</th></tr>
                    </thead>
                    <tbody>
                      {previa.pacotes.map((p, i) => {
                        const d = p.embriao as EmbriaoDados;
                        return (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1.5 font-mono">{String(p.lote)}</td>
                            <td className="px-2 py-1.5">{String(p.nome)}</td>
                            <td className="px-2 py-1.5">{d.criatorio ?? "—"}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{d.quantidade ?? "—"}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{d.garantia_prenhezes ?? (d.garantia_percentual != null ? `${d.garantia_percentual}%` : "—")}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums">{d.acasalamentos.length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {previa.colunasDesconhecidas.length > 0 && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer">{previa.colunasDesconhecidas.length} coluna(s) não reconhecida(s) — ignoradas</summary>
                  <p className="mt-1">{previa.colunasDesconhecidas.join(", ")}</p>
                </details>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={importar} disabled={!previa?.pacotes.length || gravando}>
            {gravando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importando</> : `Importar ${previa?.pacotes.length ?? 0} pacotes`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
