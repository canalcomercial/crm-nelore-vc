import { useState } from "react";
import { Plus, Pencil, Trash2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFunis } from "@/hooks/useCrm";
import {
  useMetaFormularios, useExcluirFormularioMeta, useListarFormsMeta,
  type MetaFormulario,
} from "@/hooks/useMeta";
import { FormularioMetaDialog } from "./FormularioMetaDialog";

export function FormulariosTab() {
  const { data: formularios = [], isLoading } = useMetaFormularios();
  const { data: funis = [] } = useFunis();
  const excluir = useExcluirFormularioMeta();
  const listar = useListarFormsMeta();

  const [editing, setEditing] = useState<MetaFormulario | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [descoberta, setDescoberta] = useState<Awaited<ReturnType<typeof listar.mutateAsync>> | null>(null);

  const funilNome = (id: string | null) => funis.find((f) => f.id === id)?.nome ?? "— Padrão —";

  const handleBuscar = async () => {
    const data = await listar.mutateAsync();
    setDescoberta(data);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Cada formulário do Meta cadastrado aqui é roteado para um funil / etapa / responsável específico.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleBuscar} disabled={listar.isPending} className="gap-1.5">
            {listar.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Buscar formulários da Meta
          </Button>
          <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo formulário
          </Button>
        </div>
      </div>

      {descoberta && (
        <div className="bg-info/5 border border-info/20 rounded-lg p-3 space-y-2 text-xs">
          <div className="font-semibold">Formulários encontrados na Meta:</div>
          {descoberta.paginas.length === 0 && <div className="text-muted-foreground">Nenhuma página retornada.</div>}
          {descoberta.paginas.map((p) => (
            <div key={p.page_id}>
              <div className="font-medium">{p.page_nome} <span className="text-muted-foreground font-mono">({p.page_id})</span></div>
              <ul className="ml-4">
                {p.forms.map((f) => (
                  <li key={f.id} className="flex items-center gap-2 py-0.5">
                    <span className="font-mono">{f.id}</span> — {f.name} <Badge variant="outline" className="text-[9px]">{f.status}</Badge>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px]"
                      onClick={() => {
                        setEditing({
                          id: "",
                          form_id: f.id,
                          form_nome: f.name,
                          page_id: p.page_id,
                          page_nome: p.page_nome,
                          funil_id: null,
                          etapa: null,
                          responsavel_id: null,
                          mapa_campos: {},
                          ativo: true,
                          criado_em: "",
                          atualizado_em: "",
                        });
                        setOpen(true);
                      }}
                    >Cadastrar</Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Form ID</TableHead>
              <TableHead className="text-xs">Nome</TableHead>
              <TableHead className="text-xs">Página</TableHead>
              <TableHead className="text-xs">Funil / Etapa</TableHead>
              <TableHead className="text-xs">Ativo</TableHead>
              <TableHead className="text-xs w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground">Carregando…</TableCell></TableRow>}
            {!isLoading && formularios.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">Nenhum formulário cadastrado.</TableCell></TableRow>
            )}
            {formularios.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-[11px]">{f.form_id}</TableCell>
                <TableCell className="text-xs">{f.form_nome || "—"}</TableCell>
                <TableCell className="text-xs">{f.page_nome || "—"}</TableCell>
                <TableCell className="text-xs">
                  {funilNome(f.funil_id)}{f.etapa ? ` › ${f.etapa}` : ""}
                </TableCell>
                <TableCell><Badge variant={f.ativo ? "default" : "outline"}>{f.ativo ? "Sim" : "Não"}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(f); setOpen(true); }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setConfirmDelete(f.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FormularioMetaDialog open={open} onOpenChange={setOpen} formulario={editing} />

      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover formulário?</AlertDialogTitle>
            <AlertDialogDescription>
              Novos leads desse form_id voltam a cair no funil padrão.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDelete) excluir.mutate(confirmDelete); setConfirmDelete(null); }}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}