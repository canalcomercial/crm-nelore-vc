import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2, FileSpreadsheet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  lerAbas,
  mapearArquivo,
  gerarModeloBaseErural,
  type ResultadoImportacao,
} from "@/lib/importar-erural";

const LOTE_INSERCAO = 200;

/**
 * Importação do catálogo a partir da planilha base do catálogo.
 *
 * Aceita .xlsx, .xls e .csv, identifica o cabeçalho pelo nome das colunas e
 * mostra uma prévia antes de gravar — nada é inserido sem o usuário conferir
 * quantos animais foram reconhecidos.
 */
export function ImportarAnimaisDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [previa, setPrevia] = useState<ResultadoImportacao | null>(null);
  const [lendo, setLendo] = useState(false);
  const [gravando, setGravando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const limpar = () => {
    setArquivo(null);
    setPrevia(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const baixarModelo = () => {
    const blob = gerarModeloBaseErural();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalogo-base-crm-vc.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const aoEscolher = async (file: File) => {
    setArquivo(file);
    setPrevia(null);
    setLendo(true);
    try {
      const buffer = await file.arrayBuffer();
      const abas = lerAbas(buffer, file.name);
      const resultado = mapearArquivo(abas);
      setPrevia(resultado);
      if (resultado.animais.length === 0) {
        toast.error(resultado.avisos[0] ?? "Nenhum animal reconhecido no arquivo");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Não consegui ler o arquivo";
      toast.error(msg);
      limpar();
    } finally {
      setLendo(false);
    }
  };

  const importar = async () => {
    if (!previa?.animais.length) return;
    setGravando(true);
    try {
      let gravados = 0;
      for (let i = 0; i < previa.animais.length; i += LOTE_INSERCAO) {
        const fatia = previa.animais.slice(i, i + LOTE_INSERCAO);
        const { error } = await supabase.from("animais").insert(fatia as never);
        if (error) throw error;
        gravados += fatia.length;
      }
      toast.success(`${gravados} ${gravados === 1 ? "animal importado" : "animais importados"}`);
      qc.invalidateQueries({ queryKey: ["animais"] });
      onOpenChange(false);
      limpar();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao importar";
      toast.error(msg);
    } finally {
      setGravando(false);
    }
  };

  const nomes = (previa?.animais ?? []).slice(0, 5).map((a) => String(a.nome ?? ""));

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) limpar();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar catálogo (planilha da base ou do leilão)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-neutral-600 leading-relaxed">
            Envie a planilha (<strong>.xlsx</strong> ou <strong>.csv</strong>). Funciona tanto com a base do catálogo
            quanto com a planilha do leilão (abas MACHOS / FÊMEAS) — todas as abas são lidas e os repetidos são
            descartados. Tudo que a planilha traz vira a ficha do animal: lote, pedigree, os índices ABCZ / ANCP /
            GenePlus, prenhez e cria ao pé.
          </p>

          <Button variant="outline" onClick={baixarModelo} className="w-full gap-2">
            <Download className="h-4 w-4" /> Baixar modelo da base
          </Button>

          <label className="flex items-center gap-2 border rounded-md p-3 cursor-pointer hover:bg-neutral-50 transition-colors">
            {lendo ? <Loader2 className="h-4 w-4 animate-spin shrink-0" /> : <Upload className="h-4 w-4 shrink-0" />}
            <span className="truncate">{arquivo ? arquivo.name : "Escolher planilha"}</span>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && aoEscolher(e.target.files[0])}
            />
          </label>

          {previa && (
            <div className="rounded-md border bg-neutral-50 p-3 space-y-2.5">
              {previa.animais.length > 0 ? (
                <div className="flex items-start gap-2 text-neutral-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold">
                      {previa.animais.length} {previa.animais.length === 1 ? "animal pronto" : "animais prontos"} para importar
                    </div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      Cabeçalho lido na linha {previa.linhaCabecalho}
                      {previa.ignoradas > 0 && ` · ${previa.ignoradas} linha(s) sem nome de animal foram puladas`}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-neutral-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>{previa.avisos[0] ?? "Nenhum animal reconhecido."}</div>
                </div>
              )}

              {nomes.length > 0 && (
                <div className="text-xs text-neutral-600">
                  <div className="flex items-center gap-1.5 font-medium text-neutral-700 mb-1">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Primeiros lotes
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {nomes.map((n, i) => <li key={i} className="truncate">{n}</li>)}
                  </ul>
                  {previa.animais.length > nomes.length && (
                    <div className="mt-1 text-neutral-400">
                      e mais {previa.animais.length - nomes.length}…
                    </div>
                  )}
                </div>
              )}

              {previa.colunasDesconhecidas.length > 0 && (
                <details className="text-xs text-neutral-500">
                  <summary className="cursor-pointer">
                    {previa.colunasDesconhecidas.length} coluna(s) não reconhecida(s) — serão ignoradas
                  </summary>
                  <p className="mt-1 leading-relaxed">{previa.colunasDesconhecidas.join(", ")}</p>
                </details>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={importar} disabled={!previa?.animais.length || gravando}>
            {gravando ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Importando</>
            ) : (
              `Importar ${previa?.animais.length ?? 0}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
