import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFunis, useUsuarios } from "@/hooks/useCrm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Funil } from "@/types/crm";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIPOS_CLIENTE = ["Pecuarista", "Investidor", "Revenda", "Outro"];
const ORIGENS = ["WhatsApp", "Indicação", "Instagram", "Facebook", "Site", "Leilão", "Evento", "Importação", "Outro"];

interface NovoLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funilPadrao?: Funil | null;
  etapaPadrao?: string;
}

export function NovoLeadDialog({ open, onOpenChange, funilPadrao, etapaPadrao }: NovoLeadDialogProps) {
  const { data: funis = [] } = useFunis();
  const { data: usuarios = [] } = useUsuarios();
  const qc = useQueryClient();

  const [salvando, setSalvando] = useState(false);
  const [destino, setDestino] = useState<"funil" | "banco">("funil");
  const [funilId, setFunilId] = useState<string>("");
  const [etapa, setEtapa] = useState<string>("");
  const [responsavelId, setResponsavelId] = useState<string>("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [fazenda, setFazenda] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [tipoCliente, setTipoCliente] = useState<string>("");
  const [origem, setOrigem] = useState<string>("");
  const [interesse, setInteresse] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const funilSelecionado = useMemo(() => funis.find((f) => f.id === funilId), [funis, funilId]);

  useEffect(() => {
    if (!open) return;
    setSalvando(false);
    setNome(""); setTelefone(""); setEmail(""); setFazenda("");
    setCidade(""); setEstado(""); setTipoCliente(""); setOrigem("");
    setInteresse(""); setObservacoes(""); setResponsavelId("");
    if (funilPadrao) {
      setDestino("funil");
      setFunilId(funilPadrao.id);
      setEtapa(etapaPadrao && funilPadrao.etapas.includes(etapaPadrao) ? etapaPadrao : funilPadrao.etapas[0] ?? "");
    } else if (funis.length) {
      setDestino("funil");
      setFunilId(funis[0].id);
      setEtapa(funis[0].etapas[0] ?? "");
    } else {
      setDestino("banco");
      setFunilId(""); setEtapa("");
    }
  }, [open, funilPadrao, etapaPadrao, funis]);

  function validar(): string | null {
    if (!nome.trim()) return "Informe o nome do lead.";
    if (email && !EMAIL_REGEX.test(email.trim())) return "Email inválido.";
    if (estado && estado.trim().length !== 2) return "UF deve ter 2 letras (ex: MG).";
    if (destino === "funil" && (!funilId || !etapa)) return "Escolha funil e etapa.";
    return null;
  }

  async function salvar() {
    const erro = validar();
    if (erro) { toast.error(erro); return; }
    setSalvando(true);

    const campos_extras: Record<string, string> = {};
    if (email.trim()) campos_extras.email = email.trim();

    const novo = {
      nome: nome.trim(),
      telefone: telefone.trim() || null,
      fazenda: fazenda.trim() || null,
      cidade: cidade.trim() || null,
      estado: estado.trim().toUpperCase() || null,
      tipo_cliente: tipoCliente || null,
      origem: origem || "manual",
      interesse: interesse.trim() || null,
      observacoes: observacoes.trim() || null,
      responsavel_id: responsavelId || null,
      funil_id: destino === "funil" ? funilId : null,
      etapa: destino === "funil" ? etapa : null,
      campos_extras,
      arquivado: destino === "banco",
      arquivado_em: destino === "banco" ? new Date().toISOString() : null,
    };

    const { error } = await supabase.from("leads").insert(novo);
    setSalvando(false);
    if (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
      return;
    }
    toast.success(destino === "funil" ? `Lead criado em ${etapa}` : "Lead salvo no Banco de Contatos");
    qc.invalidateQueries({ queryKey: ["leads"] });
    qc.invalidateQueries({ queryKey: ["leads-arquivados"] });
    qc.invalidateQueries({ queryKey: ["todos-leads"] });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Novo Lead
          </DialogTitle>
          <DialogDescription>
            Preencha os dados. Apenas <strong>nome</strong> é obrigatório.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Nome *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cliente@exemplo.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1.5 md:col-span-3">
              <Label>Fazenda</Label>
              <Input value={fazenda} onChange={(e) => setFazenda(e.target.value)} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label>Cidade</Label>
              <Input value={cidade} onChange={(e) => setCidade(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>UF</Label>
              <Input maxLength={2} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} placeholder="MG" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de cliente</Label>
              <Select value={tipoCliente} onValueChange={setTipoCliente}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {TIPOS_CLIENTE.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Origem</Label>
              <Select value={origem} onValueChange={setOrigem}>
                <SelectTrigger><SelectValue placeholder="Como chegou?" /></SelectTrigger>
                <SelectContent>
                  {ORIGENS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Interesse</Label>
            <Input value={interesse} onChange={(e) => setInteresse(e.target.value)} placeholder="O que ele procura?" />
          </div>

          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Onde colocar?</Label>
                <Select value={destino} onValueChange={(v: "funil" | "banco") => setDestino(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="funil">Em um funil</SelectItem>
                    <SelectItem value="banco">Banco de Contatos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Responsável</Label>
                <Select value={responsavelId || "_nenhum"} onValueChange={(v) => setResponsavelId(v === "_nenhum" ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_nenhum">Sem responsável</SelectItem>
                    {usuarios.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {destino === "funil" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Funil *</Label>
                  <Select value={funilId} onValueChange={(v) => {
                    setFunilId(v);
                    const f = funis.find((x) => x.id === v);
                    setEtapa(f?.etapas[0] ?? "");
                  }}>
                    <SelectTrigger><SelectValue placeholder="Escolha..." /></SelectTrigger>
                    <SelectContent>
                      {funis.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Etapa *</Label>
                  <Select value={etapa} onValueChange={setEtapa} disabled={!funilSelecionado}>
                    <SelectTrigger><SelectValue placeholder="Escolha..." /></SelectTrigger>
                    <SelectContent>
                      {funilSelecionado?.etapas.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : "Criar Lead"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
