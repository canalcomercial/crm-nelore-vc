import { useState, useEffect, ReactNode } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCriarVenda, useTodosLeads, useUsuarios, useUpdateVenda } from "@/hooks/useCrm";
import { CATEGORIAS_VENDA, FORMAS_PAGAMENTO, TIPOS_PARCELAMENTO, type Venda } from "@/types/crm";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/auth-context";

interface Props {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  leadId?: string | null;
  clienteNome?: string;
  venda?: Venda | null;
}

type TipoVendedor = "interno" | "externo" | "leiloeira";

export function VendaDialog({ trigger, open: openProp, onOpenChange, leadId, clienteNome, venda }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const editMode = !!venda;

  const { data: leads = [] } = useTodosLeads();
  const { data: usuarios = [] } = useUsuarios();
  const { user, isCoordenador } = useAuth();
  const criar = useCriarVenda();
  const atualizar = useUpdateVenda();

  const initial = () => {
    if (venda) {
      return {
        lead_id: venda.lead_id ?? "",
        cliente_nome: venda.cliente_nome,
        categoria: venda.categoria,
        produto: venda.produto ?? "",
        quantidade: venda.quantidade,
        valor_total: String(venda.valor_total ?? ""),
        leilao_evento: venda.leilao_evento ?? "",
        fazenda_fornecedor: venda.fazenda_fornecedor ?? "",
        vendedor_id: venda.vendedor_id ?? "",
        vendedor_externo: venda.vendedor_externo ?? "",
        tipo_vendedor: ((venda.tipo_vendedor as TipoVendedor) ?? "interno") as TipoVendedor,
        forma_pagamento: venda.forma_pagamento ?? "À vista",
        tipo_parcelamento: venda.tipo_parcelamento ?? "À vista",
        qtd_parcelas: venda.qtd_parcelas ? String(venda.qtd_parcelas) : "",
        parcelamento_descricao: venda.parcelamento_descricao ?? "",
        comissao_percentual: venda.comissao_percentual ? String(venda.comissao_percentual) : "",
        observacoes: venda.observacoes ?? "",
        data_venda: venda.data_venda ? new Date(venda.data_venda) : new Date(venda.criado_em),
      };
    }
    return {
      lead_id: leadId ?? "",
      cliente_nome: clienteNome ?? "",
      categoria: CATEGORIAS_VENDA[0],
      produto: "",
      quantidade: 1,
      valor_total: "",
      leilao_evento: "",
      fazenda_fornecedor: "",
      vendedor_id: user?.id ?? "",
      vendedor_externo: "",
      tipo_vendedor: "interno" as TipoVendedor,
      forma_pagamento: "À vista",
      tipo_parcelamento: "À vista",
      qtd_parcelas: "",
      parcelamento_descricao: "",
      comissao_percentual: "",
      observacoes: "",
      data_venda: new Date(),
    };
  };
  const [form, setForm] = useState(initial);

  useEffect(() => {
    if (open) setForm(initial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId, clienteNome, venda?.id]);

  const handleSelectLead = (id: string) => {
    const l = leads.find((x) => x.id === id);
    setForm((f) => ({ ...f, lead_id: id, cliente_nome: l?.nome ?? f.cliente_nome }));
  };

  const valorComissao = (() => {
    const v = Number(form.valor_total);
    const p = Number(form.comissao_percentual);
    if (!v || !p || isNaN(v) || isNaN(p)) return 0;
    return (v * p) / 100;
  })();

  const submit = () => {
    if (!form.cliente_nome || !form.valor_total) return;
    const isInterno = form.tipo_vendedor === "interno";
    const payload = {
      lead_id: form.lead_id || null,
      cliente_nome: form.cliente_nome,
      categoria: form.categoria,
      produto: form.produto || null,
      quantidade: Number(form.quantidade) || 1,
      valor_total: Number(form.valor_total),
      leilao_evento: form.leilao_evento || null,
      fazenda_fornecedor: form.fazenda_fornecedor || null,
      vendedor_id: isCoordenador ? (isInterno ? (form.vendedor_id || null) : null) : user?.id ?? null,
      vendedor_externo: !isInterno ? (form.vendedor_externo || null) : null,
      tipo_vendedor: form.tipo_vendedor,
      forma_pagamento: form.forma_pagamento || null,
      tipo_parcelamento: form.tipo_parcelamento || null,
      qtd_parcelas: form.qtd_parcelas ? Number(form.qtd_parcelas) : null,
      parcelamento_descricao: form.parcelamento_descricao || null,
      comissao_percentual: form.comissao_percentual ? Number(form.comissao_percentual) : null,
      observacoes: form.observacoes || null,
      data_venda: form.data_venda ? form.data_venda.toISOString() : null,
    };
    if (editMode && venda) {
      atualizar.mutate({ id: venda.id, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      criar.mutate({ ...payload, status: "em_aberto" }, { onSuccess: () => setOpen(false) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editMode ? "Editar venda" : "Registrar venda"}</DialogTitle>
          <DialogDescription>{editMode ? "Atualize os dados da venda." : "Preencha os dados para registrar uma nova venda."}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
          <Field label="Data da venda *">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-9 justify-start text-left font-normal text-xs",
                    !form.data_venda && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {form.data_venda
                    ? format(form.data_venda, "dd/MM/yyyy", { locale: ptBR })
                    : "Escolher data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.data_venda}
                  onSelect={(d) => d && setForm({ ...form, data_venda: d })}
                  locale={ptBR}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </Field>
          <Field label="Lead (opcional)">
            <Select value={form.lead_id} onValueChange={handleSelectLead}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar lead..." /></SelectTrigger>
              <SelectContent className="max-h-72">
                {leads.slice(0, 200).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    #{l.numero} — {l.nome}{l.fazenda ? ` (${l.fazenda})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Cliente *">
            <Input value={form.cliente_nome} onChange={(e) => setForm({ ...form, cliente_nome: e.target.value })} className="h-9 text-xs" />
          </Field>
          <Field label="Categoria *">
            <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIAS_VENDA.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Produto / descrição">
            <Input value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })}
              placeholder="Ex: Matriz Nelore PO 24m" className="h-9 text-xs" />
          </Field>
          <Field label="Quantidade">
            <Input type="number" value={form.quantidade}
              onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })} className="h-9 text-xs" />
          </Field>
          <Field label="Valor total (R$) *">
            <Input type="number" step="0.01" value={form.valor_total}
              onChange={(e) => setForm({ ...form, valor_total: e.target.value })} className="h-9 text-xs" />
          </Field>
          <Field label="Forma de pagamento">
            <Select value={form.forma_pagamento} onValueChange={(v) => setForm({ ...form, forma_pagamento: v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Tipo de parcelamento">
            <Select value={form.tipo_parcelamento} onValueChange={(v) => setForm({ ...form, tipo_parcelamento: v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_PARCELAMENTO.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Nº de parcelas">
            <Input type="number" min={1} value={form.qtd_parcelas}
              onChange={(e) => setForm({ ...form, qtd_parcelas: e.target.value })}
              placeholder="Ex: 30" className="h-9 text-xs" />
          </Field>
          <Field label="Comissão (%)">
            <Input type="number" min={0} max={100} step="0.1" value={form.comissao_percentual}
              onChange={(e) => setForm({ ...form, comissao_percentual: e.target.value })}
              placeholder="Ex: 10" className="h-9 text-xs" />
          </Field>
          <Field label="Valor da comissão">
            <Input
              readOnly
              value={valorComissao
                ? valorComissao.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                : "—"}
              className="h-9 text-xs bg-muted/50 cursor-default"
              tabIndex={-1}
            />
          </Field>
          <Field label="Descrição do parcelamento" full>
            <Input value={form.parcelamento_descricao}
              onChange={(e) => setForm({ ...form, parcelamento_descricao: e.target.value })}
              placeholder='Ex: "30x diretas" ou "12x + 12x duplo"' className="h-9 text-xs" />
          </Field>

          <Field label="Tipo de vendedor">
            <Select value={form.tipo_vendedor} onValueChange={(v) => setForm({ ...form, tipo_vendedor: v as TipoVendedor })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="interno">Vendedor interno (equipe)</SelectItem>
                <SelectItem value="externo">Vendedor externo</SelectItem>
                <SelectItem value="leiloeira">Leiloeira</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {form.tipo_vendedor === "interno" ? (
            <Field label="Vendedor da equipe">
              <Select value={form.vendedor_id} onValueChange={(v) => setForm({ ...form, vendedor_id: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {usuarios.filter((u) => isCoordenador || u.id === user?.id).map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <Field label={form.tipo_vendedor === "leiloeira" ? "Nome da leiloeira" : "Nome do vendedor externo"}>
              <Input
                value={form.vendedor_externo}
                onChange={(e) => setForm({ ...form, vendedor_externo: e.target.value })}
                placeholder={form.tipo_vendedor === "leiloeira" ? "Ex: Programa Leilões" : "Ex: João Silva"}
                className="h-9 text-xs"
              />
            </Field>
          )}

          <Field label="Leilão / evento">
            <Input value={form.leilao_evento} onChange={(e) => setForm({ ...form, leilao_evento: e.target.value })}
              placeholder="Opcional" className="h-9 text-xs" />
          </Field>
          <Field label="Fazenda fornecedora" full>
            <Input value={form.fazenda_fornecedor} onChange={(e) => setForm({ ...form, fazenda_fornecedor: e.target.value })}
              placeholder="Ex: Fazenda Boa Vista" className="h-9 text-xs" />
          </Field>
          <Field label="Observações" full>
            <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="text-xs min-h-[60px]" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={criar.isPending || atualizar.isPending}>
            {editMode ? "Salvar alterações" : "Registrar venda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <div className={cn("min-w-0 space-y-1", full && "sm:col-span-2")}>
      <label className="block text-[11px] font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
