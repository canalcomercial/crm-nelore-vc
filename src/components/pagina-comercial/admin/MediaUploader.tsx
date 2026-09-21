import { useRef, useState } from "react";
import { Upload, Loader2, ImageIcon, VideoIcon } from "lucide-react";
import { useUploadMidia, type MidiaItem } from "@/hooks/usePaginaComercial";

export function MediaUploader({
  onUploaded, accept = "image/*,video/*", compact = false,
}: {
  onUploaded?: (item: MidiaItem) => void;
  accept?: string;
  compact?: boolean;
}) {
  const upload = useUploadMidia();
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      const item = await upload.mutateAsync(file).catch(() => null);
      if (item) onUploaded?.(item);
    }
    if (ref.current) ref.current.value = "";
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      onClick={() => ref.current?.click()}
      className={`cursor-pointer border-2 border-dashed rounded-lg transition-colors ${
        drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
      } ${compact ? "p-3" : "p-6"} flex flex-col items-center justify-center text-center gap-2`}
    >
      <input ref={ref} type="file" accept={accept} multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      {upload.isPending ? (
        <><Loader2 className="h-5 w-5 animate-spin" /><span className="text-sm">Enviando...</span></>
      ) : (
        <>
          <div className="flex gap-2 text-muted-foreground">
            <Upload className="h-5 w-5" /> <ImageIcon className="h-5 w-5" /> <VideoIcon className="h-5 w-5" />
          </div>
          <div className={compact ? "text-xs" : "text-sm"}>
            <span className="font-medium">Clique</span> ou arraste arquivos
          </div>
          {!compact && <div className="text-xs text-muted-foreground">Imagens até 5MB · Vídeos até 1GB</div>}
        </>
      )}
    </div>
  );
}