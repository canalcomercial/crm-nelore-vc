import { useRef, useState } from "react";
import { Paperclip, Download, Trash2, FileText, Image as ImageIcon, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDocumentosLead, useUploadDocumento, useDeleteDocumento, getDocumentoUrl,
} from "@/hooks/useCrm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DocumentoLead } from "@/types/crm";
import { toast } from "sonner";

interface Props {
  leadId: string;
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function iconFor(mime: string | null) {
  if (mime?.startsWith("image/")) return ImageIcon;
  if (mime === "application/pdf") return FileText;
  return File;
}

export function DocumentosLead({ leadId }: Props) {
  const { data: docs = [], isLoading } = useDocumentosLead(leadId);
  const upload = useUploadDocumento();
  const remover = useDeleteDocumento();
  const inputRef = useRef<HTMLInputElement>(null);
  const [baixandoId, setBaixandoId] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    upload.mutate({ leadId, file });
  };

  const baixar = async (doc: DocumentoLead) => {
    try {
      setBaixandoId(doc.id);
      const url = await getDocumentoUrl(doc.storage_path);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error("Erro ao gerar link", { description: (e as Error).message });
    } finally {
      setBaixandoId(null);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs w-full"
        onClick={() => inputRef.current?.click()}
        disabled={upload.isPending}
      >
        <Paperclip className="h-3.5 w-3.5 mr-1.5" />
        {upload.isPending ? "Enviando..." : "Anexar documento"}
      </Button>

      <div className="mt-2 space-y-1.5">
        {isLoading && (
          <p className="text-[11px] text-muted-foreground">Carregando...</p>
        )}
        {!isLoading && docs.length === 0 && (
          <p className="text-[11px] text-muted-foreground">Nenhum documento anexado.</p>
        )}
        {docs.map((d) => {
          const Icon = iconFor(d.mime_type);
          return (
            <div
              key={d.id}
              className="flex items-center gap-2 bg-background border border-border rounded-md p-2 text-xs"
            >
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{d.nome}</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatBytes(d.tamanho_bytes)} · {format(new Date(d.criado_em), "dd/MM/yy HH:mm", { locale: ptBR })}
                </p>
              </div>
              <button
                onClick={() => baixar(d)}
                disabled={baixandoId === d.id}
                className="h-7 w-7 rounded hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
                title="Baixar"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Remover "${d.nome}"?`)) remover.mutate(d);
                }}
                className="h-7 w-7 rounded hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive"
                title="Remover"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
