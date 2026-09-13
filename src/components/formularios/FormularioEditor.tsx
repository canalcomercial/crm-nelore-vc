import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFunis, useUsuarios, useAtributosPersonalizados, useCriarAtributo } from "@/hooks/useCrm";
import { useSalvarFormulario } from "@/hooks/useFormularios";
import {
  CAMPOS_PADRAO,
  type CampoFormulario,
  type CampoFormularioMapeamento,
  type CampoFormularioTipo,
  type Formulario,
  slugify,
} from "@/types/formulario";

const TIPOS: { value: CampoFormularioTipo; label: string }[] = [
  { value: "texto", label: "Texto curto" },
  { value: "textarea", label: "Texto longo" },
  { value: "email", label: "Email" },
  { value: "telefone", label: "Telefone" },
  { value: "numero", label: "Número" },
  { value: "selecao", label: "Seleção" },
];

const MAPEAMENTOS: { value: CampoFormularioMapeamento | "nenhum"; label: string }[] = [
  { value: "nenhum", label: "Resposta livre (não mapear)" },
  { value: "nome", label: "Nome do lead" },
  { value: "telefone", label: "Telefone" },
  { value: "email", label: "Email" },
  { value: "cidade", label: "Cidade" },
  { value: "estado", label: "Estado (UF)" },
  { value: "fazenda", label: "Fazenda" },
  { value: "tipo_cliente", label: "Tipo de cliente" },
  { value: "interesse", label: "Interesse" },
  { value: "observacoes", label: "Observações" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  formulario?: Formulario | null;
};

export function FormularioEditor({ open, onClose, formulario }: Props) {
  const { data: funis = [] } = useFunis();
  const { data: usuarios = [] } = useUsuarios();
  const { data: atributos = [] } = useAtributosPersonalizados();
  const criarAttr = useCriarAtributo();
  const salvar = useSalvarFormulario();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [funilId, setFunilId] = useState<string>("");
  const [etapa, setEtapa] = useState<string>("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [mensagemSucesso, setMensagemSucesso] = useState(
    "Recebemos seus dados! Em breve entraremos em contato.",
  );
  const [cor, setCor] = useState("#2D6A4F");
  const [ativo, setAtivo] = useState(true);
  const [campos, setCampos] = useState<CampoFormulario[]>(CAMPOS_PADRAO);

  const funilSelecionado = funis.find((f) => f.id === funilId);

  useEffect(() => {
    if (open) {
      if (formulario) {
        setTitulo(formulario.titulo);
        setDescricao(formulario.descricao ?? "");
        setSlug(formulario.slug);
        setSlugManual(true);
        setFunilId(formulario.funil_id ?? "");
        setEtapa(formulario.etapa ?? "");
        setResponsavelId(formulario.responsavel_id ?? "");
        setMensagemSucesso(formulario.mensagem_sucesso);
        setCor(formulario.cor);
        setAtivo(formulario.ativo);
        setCampos(formulario.campos.length ? formulario.campos : CAMPOS_PADRAO);
      } else {
        setTitulo("");
        setDescricao("");
        setSlug("");
        setSlugManual(false);
        setFunilId("");
        setEtapa("");
        setResponsavelId("");
        setMensagemSucesso("Recebemos seus dados! Em breve entraremos em contato.");
        setCor("#2D6A4F");
        setAtivo(true);
        setCampos(CAMPOS_PADRAO);
      }
    }
  }, [open, formulario]);

  useEffect(() => {
    if (!slugManual) setSlug(slugify(titulo));
  }, [titulo, slugManual]);

  function adicionarCampo() {
    const n = campos.length + 1;
    setCampos([
      ...campos,
      {
        key: `campo_${Date.now()}`,
        label: `Pergunta ${n}`,
        tipo: "texto",
        obrigatorio: false,
        mapeamento: null,
      },
    ]);
  }

  function moverCampo(idx: number, dir: -1 | 1) {
    const novo = [...campos];
    const j = idx + dir;
    if (j < 0 || j >= novo.length) return;
    [novo[idx], novo[j]] = [novo[j], novo[idx]];
    setCampos(novo);
  }

  function atualizarCampo(idx: number, patch: Partial<CampoFormulario>) {
    setCampos(campos.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function removerCampo(idx: number) {
    setCampos(campos.filter((_, i) => i !== idx));
  }

  async function handleSalvar() {
    if (!titulo.trim()) return;
    if (!slug.trim()) return;
    await salvar.mutateAsync({
      id: formulario?.id,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      slug: slug.trim(),
      campos,
      funil_id: funilId || null,
      etapa: etapa || null,
      responsavel_id: responsavelId || null,
      mensagem_sucesso: mensagemSucesso,
      cor,
      ativo,
    });
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle>{formulario ? "Editar formulário" : "Novo formulário"}</DialogTitle>
          <DialogDescription>Configure os campos e opções do formulário.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 px-6 py-5 overflow-auto flex-1">
          {/* Coluna esquerda: configurações + campos */}
          <div className="space-y-5">
            <Card className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label>Título</Label>
                  <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Cadastro Leilão Outubro" maxLength={120} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Descrição (opcional)</Label>
                  <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} maxLength={500} placeholder="Texto curto que aparece acima do formulário" />
                </div>
                <div className="space-y-1.5">
                  <Label>Link público (slug)</Label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">/f/</span>
                    <Input
                      value={slug}
                      onChange={(e) => { setSlugManual(true); setSlug(slugify(e.target.value)); }}
                      placeholder="cadastro-leilao"
                      maxLength={60}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Cor de destaque</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} className="h-9 w-14 rounded border bg-background" />
                    <Input value={cor} onChange={(e) => setCor(e.target.value)} maxLength={7} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Funil de destino</Label>
                  <Select value={funilId || "_banco"} onValueChange={(v) => { setFunilId(v === "_banco" ? "" : v); setEtapa(""); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_banco">Banco de Contatos</SelectItem>
                      {funis.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Etapa</Label>
                  <Select value={etapa} onValueChange={setEtapa} disabled={!funilSelecionado}>
                    <SelectTrigger><SelectValue placeholder={funilSelecionado ? "Escolha..." : "—"} /></SelectTrigger>
                    <SelectContent>
                      {funilSelecionado?.etapas.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Vendedor responsável (opcional)</Label>
                  <Select value={responsavelId || "_none"} onValueChange={(v) => setResponsavelId(v === "_none" ? "" : v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Sem responsável definido</SelectItem>
                      {usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={ativo} onCheckedChange={setAtivo} id="ativo" />
                    <Label htmlFor="ativo">Formulário ativo</Label>
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Mensagem de sucesso</Label>
                  <Textarea value={mensagemSucesso} onChange={(e) => setMensagemSucesso(e.target.value)} rows={2} maxLength={500} />
                </div>
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Campos do formulário</h3>
                <Button size="sm" variant="outline" onClick={adicionarCampo}>
                  <Plus className="h-4 w-4 mr-1" /> Adicionar campo
                </Button>
              </div>
              <div className="space-y-2">
                {campos.map((c, idx) => (
                  <div key={c.key} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-0.5 pt-1.5">
                        <button onClick={() => moverCampo(idx, -1)} className="text-muted-foreground hover:text-foreground text-[10px]">▲</button>
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                        <button onClick={() => moverCampo(idx, 1)} className="text-muted-foreground hover:text-foreground text-[10px]">▼</button>
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div className="col-span-2">
                          <Input value={c.label} onChange={(e) => atualizarCampo(idx, { label: e.target.value })} placeholder="Pergunta" maxLength={120} />
                        </div>
                        <Select value={c.tipo} onValueChange={(v: CampoFormularioTipo) => atualizarCampo(idx, { tipo: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select
                          value={c.mapeamento ?? "nenhum"}
                          onValueChange={(v) => {
                            if (v === "__novo_attr") {
                              const nome = window.prompt("Nome do novo atributo personalizado:");
                              if (!nome?.trim()) return;
                              criarAttr.mutate(
                                { label: nome.trim() },
                                {
                                  onSuccess: (a) => {
                                    atualizarCampo(idx, { mapeamento: `attr:${a.chave}` as CampoFormularioMapeamento });
                                  },
                                }
                              );
                              return;
                            }
                            atualizarCampo(idx, { mapeamento: v === "nenhum" ? null : (v as CampoFormularioMapeamento) });
                          }}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {MAPEAMENTOS.map((m) => <SelectItem key={m.value ?? "nenhum"} value={m.value ?? "nenhum"}>{m.label}</SelectItem>)}
                            {atributos.length > 0 && (
                              <>
                                <SelectItem value="__sep" disabled>── Atributos personalizados ──</SelectItem>
                                {atributos.map((a) => (
                                  <SelectItem key={a.chave} value={`attr:${a.chave}`}>
                                    {a.label}
                                  </SelectItem>
                                ))}
                              </>
                            )}
                            <SelectItem value="__novo_attr">+ Novo atributo personalizado…</SelectItem>
                          </SelectContent>
                        </Select>
                        {c.tipo === "selecao" && (
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Opções (uma por linha)</Label>
                            <Textarea
                              rows={3}
                              value={(c.opcoes ?? []).join("\n")}
                              onChange={(e) => atualizarCampo(idx, { opcoes: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                            />
                          </div>
                        )}
                        <div className="col-span-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch checked={c.obrigatorio} onCheckedChange={(v) => atualizarCampo(idx, { obrigatorio: v })} id={`req_${c.key}`} />
                            <Label htmlFor={`req_${c.key}`} className="text-xs">Obrigatório</Label>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => removerCampo(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!campos.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sem campos. Adicione pelo menos um.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Coluna direita: pré-visualização */}
          <div className="lg:sticky lg:top-0 lg:self-start space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pré-visualização</p>
            <Card className="p-5 space-y-3 border-t-4" style={{ borderTopColor: cor }}>
              <h3 className="font-bold text-lg">{titulo || "Título do formulário"}</h3>
              {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
              <div className="space-y-3 pt-2">
                {campos.map((c) => (
                  <div key={c.key} className="space-y-1">
                    <Label className="text-xs">
                      {c.label} {c.obrigatorio && <span className="text-destructive">*</span>}
                    </Label>
                    {c.tipo === "textarea" ? (
                      <Textarea disabled rows={2} placeholder={c.placeholder} />
                    ) : c.tipo === "selecao" ? (
                      <Select disabled>
                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      </Select>
                    ) : (
                      <Input disabled type={c.tipo === "numero" ? "number" : c.tipo === "email" ? "email" : c.tipo === "telefone" ? "tel" : "text"} />
                    )}
                  </div>
                ))}
                <Button disabled className="w-full" style={{ backgroundColor: cor }}>Enviar</Button>
              </div>
            </Card>
            {slug && (
              <p className="text-[11px] text-muted-foreground break-all">
                Link: <Badge variant="secondary">/f/{slug}</Badge>
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-3">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" /> Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={salvar.isPending || !titulo.trim() || !slug.trim() || !campos.length}>
            {salvar.isPending ? "Salvando..." : "Salvar formulário"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
