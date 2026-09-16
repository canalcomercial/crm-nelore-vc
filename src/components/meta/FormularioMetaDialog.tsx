import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFunis, useUsuarios } from "@/hooks/useCrm";
import { MapaCamposEditor } from "./MapaCamposEditor";
import { useSalvarFormularioMeta, type MetaFormulario } from "@/hooks/useMeta";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  formulario?: MetaFormulario | null;
};

export function FormularioMetaDialog({ open, onOpenChange, formulario }: Props) {
  const { data: funis = [] } = useFunis();
  const { data: usuarios = [] } = useUsuarios();
  const salvar = useSalvarFormularioMeta();

  const [form, setForm] = useState<Partial<MetaFormulario>>({});

  useEffect(() => {
    if (open) {
      setForm(
        formulario ?? {
          form_id: "",
          form_nome: "",
          page_id: "",
          page_nome: "",
          funil_id: null,
          etapa: null,
          responsavel_id: null,
          mapa_campos: {},
          ativo: true,
        },
      );
    }
  }, [open, formulario]);

  const funil = funis.find((f) => f.id === form.funil_id);

  const handleSalvar = () => {
    if (!form.form_id) return;
    salvar.mutate(
      {
        id: (form as any).id,
        form_id: form.form_id,
        form_nome: form.form_nome ?? null,
        page_id: form.page_id ?? null,
        page_nome: form.page_nome ?? null,
        funil_id: form.funil_id ?? null,
        etapa: form.etapa ?? null,
        responsavel_id: form.responsavel_id ?? null,
        mapa_campos: (form.mapa_campos ?? {}) as any,
        ativo: form.ativo ?? true,
      } as any,
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formulario ? "Editar formulário Meta" : "Novo formulário Meta"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Form ID *</Label>
              <Input value={form.form_id ?? ""} onChange={(e) => setForm({ ...form, form_id: e.target.value })} className="font-mono text-xs" />
            </div>
            <div>
              <Label className="text-xs">Nome do formulário</Label>
              <Input value={form.form_nome ?? ""} onChange={(e) => setForm({ ...form, form_nome: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Page ID</Label>
              <Input value={form.page_id ?? ""} onChange={(e) => setForm({ ...form, page_id: e.target.value })} className="font-mono text-xs" />
            </div>
            <div>
              <Label className="text-xs">Nome da página</Label>
              <Input value={form.page_nome ?? ""} onChange={(e) => setForm({ ...form, page_nome: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Funil</Label>
              <Select
                value={form.funil_id ?? "__none"}
                onValueChange={(v) => setForm({ ...form, funil_id: v === "__none" ? null : v, etapa: null })}
              >
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Padrão —</SelectItem>
                  {funis.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Etapa</Label>
              <Select
                value={form.etapa ?? "__none"}
                onValueChange={(v) => setForm({ ...form, etapa: v === "__none" ? null : v })}
                disabled={!funil}
              >
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Primeira —</SelectItem>
                  {funil?.etapas.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Responsável</Label>
              <Select
                value={form.responsavel_id ?? "__none"}
                onValueChange={(v) => setForm({ ...form, responsavel_id: v === "__none" ? null : v })}
              >
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">— Sem responsável —</SelectItem>
                  {usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <Label className="text-xs mb-2 block">Mapa de campos</Label>
            <MapaCamposEditor
              value={(form.mapa_campos ?? {}) as Record<string, string>}
              onChange={(mapa) => setForm({ ...form, mapa_campos: mapa as any })}
              formId={form.form_id}
            />
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <Label className="text-xs">Ativo</Label>
            <Switch checked={form.ativo ?? true} onCheckedChange={(v) => setForm({ ...form, ativo: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSalvar} disabled={!form.form_id || salvar.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}