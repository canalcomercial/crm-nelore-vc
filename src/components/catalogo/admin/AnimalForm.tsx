import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { mensagemDeErro } from "@/lib/erros";
import { uploadFotoAnimal, useSalvarAnimal, type Animal, type GeneticaAnimal, type SexoAnimal } from "@/hooks/useCatalogo";
import { GeneticaEditor } from "./GeneticaEditor";
import { Loader2, Upload } from "lucide-react";

const CATEGORIAS = ["Touro", "Matriz", "Garrote", "Novilha", "Bezerro", "Bezerra", "Embrião"];

const SEXOS: { value: SexoAnimal; label: string }[] = [
  { value: "macho", label: "Macho (touro)" },
  { value: "femea", label: "Fêmea (matriz)" },
];

type Form = Partial<Animal>;

export function AnimalForm({ open, onOpenChange, animal }: { open: boolean; onOpenChange: (v: boolean) => void; animal: Animal | null }) {
  const [form, setForm] = useState<Form>({});
  const [uploading, setUploading] = useState(false);
  const salvar = useSalvarAnimal();

  useEffect(() => {
    setForm(animal ?? { destaque: false, ativo: true });
  }, [animal, open]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadFotoAnimal(file);
      set("foto_url", url);
    } catch (e) {
      toast.error(mensagemDeErro(e, "Erro no upload"));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!form.nome) { toast.error("Nome é obrigatório"); return; }
    try {
      await salvar.mutateAsync(form);
      onOpenChange(false);
    } catch {
      /* erro já exibido via toast */
    }
  };

  const num = (v: string) => (v === "" ? null : Number(v));

  const genetica: GeneticaAnimal = (form.genetica ?? {}) as GeneticaAnimal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[calc(100vw-1.5rem)] max-h-[92dvh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 border-b shrink-0">
          <DialogTitle>{animal ? "Editar animal" : "Novo animal"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <Field label="Nome *"><Input value={form.nome ?? ""} onChange={(e) => set("nome", e.target.value)} /></Field>
          <Field label="Lote"><Input value={form.lote ?? ""} onChange={(e) => set("lote", e.target.value)} /></Field>
          <Field label="Registro (aparece na ficha)">
            <Input value={form.registro ?? ""} onChange={(e) => set("registro", e.target.value)} placeholder="VCA - 9335" />
          </Field>
          <Field label="Sexo">
            <Select value={form.sexo ?? undefined} onValueChange={(v) => set("sexo", v as SexoAnimal)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{SEXOS.map((sx) => <SelectItem key={sx.value} value={sx.value}>{sx.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Categoria">
            <Select value={form.categoria ?? undefined} onValueChange={(v) => set("categoria", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Raça"><Input value={form.raca ?? ""} onChange={(e) => set("raca", e.target.value)} /></Field>
          <Field label="Fazenda"><Input value={form.fazenda ?? ""} onChange={(e) => set("fazenda", e.target.value)} /></Field>
          <div />
          <Field label="IABCZ"><Input type="number" step="0.01" value={form.iabcz ?? ""} onChange={(e) => set("iabcz", num(e.target.value))} /></Field>
          <Field label="MGTE"><Input type="number" step="0.01" value={form.mgte ?? ""} onChange={(e) => set("mgte", num(e.target.value))} /></Field>
          <Field label="IQG"><Input type="number" step="0.01" value={form.iqg ?? ""} onChange={(e) => set("iqg", num(e.target.value))} /></Field>
          <div />
          <Field label="Preço total (R$)"><Input type="number" step="0.01" value={form.preco_total ?? ""} onChange={(e) => set("preco_total", num(e.target.value))} /></Field>
          <Field label="Nº de parcelas"><Input type="number" value={form.parcelas ?? ""} onChange={(e) => set("parcelas", num(e.target.value))} /></Field>
          <Field label="Valor da parcela (R$)"><Input type="number" step="0.01" value={form.valor_parcela ?? ""} onChange={(e) => set("valor_parcela", num(e.target.value))} /></Field>
          <Field label="Comissão (%)"><Input type="number" step="0.01" value={form.comissao_percentual ?? ""} onChange={(e) => set("comissao_percentual", num(e.target.value))} placeholder="Ex: 8" /></Field>
          <div className="sm:col-span-2">
            <Label className="text-xs">Link do vídeo (YouTube)</Label>
            <Input value={form.link_video ?? ""} onChange={(e) => set("link_video", e.target.value)} placeholder="https://youtu.be/..." />
          </div>
          <Field label="Link do pré-lance VC">
            <Input value={form.link_pre_lance ?? ""} onChange={(e) => set("link_pre_lance", e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Link do lote na VC">
            <Input value={form.link_erural ?? ""} onChange={(e) => set("link_erural", e.target.value)} placeholder="https://..." />
          </Field>
          <div className="sm:col-span-2 space-y-2">
            <Label className="text-xs">Foto principal</Label>
            <div className="flex items-center gap-3">
              {form.foto_url && <img src={form.foto_url} alt="" className="h-20 w-20 rounded object-cover border" />}
              <label className="inline-flex items-center gap-2 px-3 py-2 border rounded cursor-pointer text-sm hover:bg-neutral-50">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Enviar imagem
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
              </label>
            </div>
          </div>
          <Field label="Destaque">
            <div className="pt-2"><Switch checked={!!form.destaque} onCheckedChange={(v) => set("destaque", v)} /></div>
          </Field>
          <Field label="Ativo (visível na vitrine)">
            <div className="pt-2"><Switch checked={form.ativo ?? true} onCheckedChange={(v) => set("ativo", v)} /></div>
          </Field>
        </div>

        <Accordion type="multiple" className="mt-4">
          <AccordionItem value="descricao">
            <AccordionTrigger className="text-sm">Descrição longa</AccordionTrigger>
            <AccordionContent>
              <Textarea rows={5} value={form.descricao_longa ?? ""} onChange={(e) => set("descricao_longa", e.target.value)} placeholder="Descrição comercial do lote..." />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="ficha">
            <AccordionTrigger className="text-sm">Ficha técnica</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Nascimento"><Input type="date" value={form.nascimento ?? ""} onChange={(e) => set("nascimento", e.target.value)} /></Field>
                <Field label="Peso (kg)"><Input type="number" step="0.1" value={form.peso_kg ?? ""} onChange={(e) => set("peso_kg", num(e.target.value))} /></Field>
                <Field label="CE — circunferência escrotal (cm)"><Input type="number" step="0.1" value={form.ce_cm ?? ""} onChange={(e) => set("ce_cm", num(e.target.value))} placeholder="39" /></Field>
                <Field label="Localização"><Input value={form.localizacao ?? ""} onChange={(e) => set("localizacao", e.target.value)} placeholder="Cidade - UF" /></Field>
                <Field label="Fornecedor"><Input value={form.fornecedor ?? ""} onChange={(e) => set("fornecedor", e.target.value)} /></Field>
                <Field label="Estado reprodutivo"><Input value={form.estado_reprodutivo ?? ""} onChange={(e) => set("estado_reprodutivo", e.target.value)} placeholder="Prenhe, Vazia, etc." /></Field>
                <Field label="Previsão de parto"><Input type="date" value={form.previsao_parto ?? ""} onChange={(e) => set("previsao_parto", e.target.value)} /></Field>
                <Field label="Pai da prenhez"><Input value={form.pai_prenhez ?? ""} onChange={(e) => set("pai_prenhez", e.target.value)} /></Field>
                <Field label="Registrado na ABCZ">
                  <div className="pt-2"><Switch checked={!!form.registrado_abcz} onCheckedChange={(v) => set("registrado_abcz", v)} /></div>
                </Field>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="pedigree">
            <AccordionTrigger className="text-sm">Pedigree</AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Pai"><Input value={form.pai ?? ""} onChange={(e) => set("pai", e.target.value)} /></Field>
                <Field label="Mãe"><Input value={form.mae ?? ""} onChange={(e) => set("mae", e.target.value)} /></Field>
                <Field label="Avô paterno (pai)"><Input value={form.avo_paterno_pai ?? ""} onChange={(e) => set("avo_paterno_pai", e.target.value)} /></Field>
                <Field label="Avó paterna (mãe)"><Input value={form.avo_paterno_mae ?? ""} onChange={(e) => set("avo_paterno_mae", e.target.value)} /></Field>
                <Field label="Avô materno (pai)"><Input value={form.avo_materno_pai ?? ""} onChange={(e) => set("avo_materno_pai", e.target.value)} /></Field>
                <Field label="Avó materna (mãe)"><Input value={form.avo_materno_mae ?? ""} onChange={(e) => set("avo_materno_mae", e.target.value)} /></Field>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="genetica">
            <AccordionTrigger className="text-sm">Avaliação genética (PMGZ / ANCP / GenePlus)</AccordionTrigger>
            <AccordionContent>
              <GeneticaEditor value={genetica} onChange={(g) => set("genetica", g)} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        </div>

        <DialogFooter className="px-4 sm:px-6 py-3 border-t bg-background shrink-0 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={salvar.isPending}>{salvar.isPending ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>

    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
