import { Loader2, Check, RotateCcw, Rocket, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PublicarBar({
  dirty, publicado, saving, publishing,
  onSalvar, onPublicar, onDescartar,
  publicadoEm,
}: {
  dirty: boolean;
  publicado: boolean;
  saving: boolean;
  publishing: boolean;
  onSalvar: () => void;
  onPublicar: () => void;
  onDescartar: () => void;
  publicadoEm: string | null;
}) {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center gap-3 flex-wrap">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold truncate">Editor da Página Comercial</h1>
          {dirty ? (
            <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-500">Rascunho não publicado</Badge>
          ) : publicado ? (
            <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:text-emerald-500 gap-1"><Check className="h-3 w-3" /> Publicado</Badge>
          ) : null}
        </div>
        {publicadoEm && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Última publicação: {new Date(publicadoEm).toLocaleString("pt-BR")}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onDescartar} disabled={!dirty}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Descartar
        </Button>
        <Button variant="outline" size="sm" onClick={onSalvar} disabled={!dirty || saving}>
          {saving ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1.5" />} Salvar rascunho
        </Button>
        <Button size="sm" onClick={onPublicar} disabled={publishing}>
          {publishing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Rocket className="h-3.5 w-3.5 mr-1.5" />} Publicar
        </Button>
      </div>
    </div>
  );
}