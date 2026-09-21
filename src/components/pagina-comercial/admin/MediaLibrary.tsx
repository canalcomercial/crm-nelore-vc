import { useState } from "react";
import { Copy, Trash2, Loader2, Check, FileVideo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListarMidia, useDeletarMidia, type MidiaItem } from "@/hooks/usePaginaComercial";
import { MediaUploader } from "./MediaUploader";
import { toast } from "sonner";

export function MediaLibrary({
  onPick, filter = "all",
}: {
  onPick?: (item: MidiaItem) => void;
  filter?: "all" | "imagem" | "video";
}) {
  const { data: items = [], isLoading } = useListarMidia();
  const deletar = useDeletarMidia();
  const [copied, setCopied] = useState<string | null>(null);

  const rows = items.filter((i) => filter === "all" || i.tipo === filter);

  async function copy(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(url);
    toast.success("URL copiada");
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-4">
      <MediaUploader />
      {isLoading ? (
        <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">Nenhum arquivo ainda.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {rows.map((it) => (
            <div key={it.path} className="group relative border rounded-lg overflow-hidden bg-muted/30">
              <div className="aspect-square bg-black/5 flex items-center justify-center">
                {it.tipo === "imagem" ? (
                  <img src={it.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : it.tipo === "video" ? (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <FileVideo className="h-8 w-8" />
                    <span className="text-[10px]">{(it.tamanho / 1024 / 1024).toFixed(1)}MB</span>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Arquivo</div>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                {onPick && (
                  <Button size="sm" className="h-7 flex-1 text-xs" onClick={() => onPick(it)}>Usar</Button>
                )}
                <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => copy(it.url)}>
                  {copied === it.url ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => {
                  if (confirm("Remover este arquivo?")) deletar.mutate(it.path);
                }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}