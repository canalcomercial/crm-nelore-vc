import { useState } from "react";
import { Plus, Copy, ExternalLink, Pencil, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFormularios, useExcluirFormulario } from "@/hooks/useFormularios";
import { useFunis } from "@/hooks/useCrm";
import { FormularioEditor } from "./FormularioEditor";
import type { Formulario } from "@/types/formulario";
import { toast } from "sonner";

export function FormulariosTab() {
  const { data: formularios = [], isLoading } = useFormularios();
  const { data: funis = [] } = useFunis();
  const excluir = useExcluirFormulario();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editando, setEditando] = useState<Formulario | null>(null);

  function abrirNovo() {
    setEditando(null);
    setEditorOpen(true);
  }
  function abrirEdicao(f: Formulario) {
    setEditando(f);
    setEditorOpen(true);
  }
  function copiarLink(slug: string) {
    const url = `${window.location.origin}/f/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado");
  }
  function abrirPublico(slug: string) {
    window.open(`${window.location.origin}/f/${slug}`, "_blank");
  }

  return (
    <div className="space-y-5">
      <Card className="p-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" /> Formulários de captação
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crie um link público (ex.: <code>/f/cadastro-leilao</code>) e cole em anúncios. As respostas viram leads automaticamente no funil escolhido.
          </p>
        </div>
        <Button onClick={abrirNovo}>
          <Plus className="h-4 w-4 mr-2" /> Novo formulário
        </Button>
      </Card>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      {!isLoading && !formularios.length && (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          Nenhum formulário criado ainda. Clique em "Novo formulário" para começar.
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {formularios.map((f) => {
          const funil = funis.find((x) => x.id === f.funil_id);
          return (
            <Card key={f.id} className="p-4 space-y-3 border-l-4" style={{ borderLeftColor: f.cor }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{f.titulo}</h3>
                    {!f.ativo && <Badge variant="secondary">Inativo</Badge>}
                  </div>
                  {f.descricao && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{f.descricao}</p>}
                </div>
                <Badge variant="outline" className="shrink-0">{f.total_respostas} {f.total_respostas === 1 ? "lead" : "leads"}</Badge>
              </div>

              <div className="text-xs space-y-1">
                <div>
                  <span className="text-muted-foreground">Destino: </span>
                  {funil ? (
                    <span className="font-medium">{funil.nome} → {f.etapa || funil.etapas[0]}</span>
                  ) : (
                    <span className="font-medium">Banco de Contatos</span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-muted-foreground">Link:</span>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[11px]">/f/{f.slug}</code>
                </div>
              </div>

              <div className="flex items-center gap-1 pt-1 border-t flex-wrap">
                <Button size="sm" variant="ghost" onClick={() => copiarLink(f.slug)}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copiar link
                </Button>
                <Button size="sm" variant="ghost" onClick={() => abrirPublico(f.slug)}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Abrir
                </Button>
                <Button size="sm" variant="ghost" onClick={() => abrirEdicao(f)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive ml-auto"
                  onClick={() => {
                    if (confirm(`Excluir o formulário "${f.titulo}"? Os leads recebidos não serão apagados.`)) {
                      excluir.mutate(f.id);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <FormularioEditor open={editorOpen} onClose={() => setEditorOpen(false)} formulario={editando} />
    </div>
  );
}
