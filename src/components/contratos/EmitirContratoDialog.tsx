import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCriarVenda, useVendasByLead } from "@/hooks/useCrm";
import { CATEGORIAS_VENDA, FORMAS_PAGAMENTO, TIPOS_PARCELAMENTO, type Lead, type Venda } from "@/types/crm";
import { ContratoDialog } from "./ContratoDialog";
import {
  CONTRATO_TIPOS, CAMPOS_EXTRAS_POR_TIPO, tipoDaCategoria, LABEL_TIPO,
  type ContratoTipo,
} from "@/types/contratos";

interface Props {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  lead: Lead;
}

/**
 * Diálogo compacto para emissão de contrato a partir do painel do lead.
 * Coleta apenas os campos essenciais do contrato, cria a venda vinculada
 * e abre o `ContratoDialog` (prévia + edição + geração de PDF) em seguida.
 */
export function EmitirContratoDialog({ trigger, open: openProp, onOpenChange, lead }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const criar = useCriarVenda();
  const { data: vendasAnteriores } = useVendasByLead(lead.id);
  const ultimaVenda = vendasAnteriores?.[0];
  const [vendaCriada, setVendaCriada] = useState<Venda | null>(null);
  const [contratoOpen, setContratoOpen] = useState(false);

  const [form, setForm] = useState({
    categoria: CATEGORIAS_VENDA[0] as string,
    produto: "",
    quantidade: 1,
    valor_total: "",
    forma_pagamento: "À vista",
    tipo_parcelamento: "À vista",
    qtd_parcelas: "",
    parcelamento_descricao: "",
    observacoes: "",
    data_venda: new Date(),
  });
  const [tipo, setTipo] = useState<ContratoTipo>('bovinos');
  const [extras, setExtras] = useState<Record<string, string>>({});

  // A última venda é lida por ref: o formulário é semeado só ao abrir ou quando
  // muda a venda de origem. Reagir a cada campo faria um refetch em background
  // apagar o que o usuário já digitou.
  const vendaRef = useRef(ultimaVenda);
  vendaRef.current = ultimaVenda;
  useEffect(() => {
    if (open) {
      const uv = vendaRef.current;
      setForm({
        categoria: uv?.categoria ?? CATEGORIAS_VENDA[0],
        produto: uv?.produto ?? "",
        quantidade: uv?.quantidade ?? 1,
        valor_total: uv?.valor_total ? String(uv.valor_total) : "",
        forma_pagamento: uv?.forma_pagamento ?? "À vista",
        tipo_parcelamento: uv?.tipo_parcelamento ?? "À vista",
        qtd_parcelas: uv?.qtd_parcelas ? String(uv.qtd_parcelas) : "",
        parcelamento_descricao: uv?.parcelamento_descricao ?? "",
        observacoes: uv?.observacoes ?? "",
        data_venda: new Date(),
      });
      const t = tipoDaCategoria(uv?.categoria ?? CATEGORIAS_VENDA[0]);
      setTipo(t);
      const src = (uv?.campos_extras ?? {}) as Record<string, unknown>;
      const next: Record<string, string> = {};
      for (const f of CAMPOS_EXTRAS_POR_TIPO[t]) {
        const v = src[f.key];
        next[f.key] = v === undefined || v === null ? '' : String(v);
      }
      setExtras(next);
    }
  }, [open, lead.id, ultimaVenda?.id]);

  useEffect(() => {
    // Ao trocar tipo, mantém valores existentes e adiciona chaves faltantes vazias
    setExtras((prev) => {
      const next = { ...prev };
      for (const f of CAMPOS_EXTRAS_POR_TIPO[tipo]) if (!(f.key in next)) next[f.key] = '';
      return next;
    });
  }, [tipo]);

  const submit = async () => {
    if (!form.valor_total || Number(form.valor_total) <= 0) {
      toast.error("Informe o valor total do contrato");
      return;
    }
    const payload = {
      lead_id: lead.id,
      cliente_nome: lead.nome,
      categoria: form.categoria,
      produto: form.produto || null,
      quantidade: Number(form.quantidade) || 1,
      valor_total: Number(form.valor_total),
      leilao_evento: null,
      fazenda_fornecedor: null,
      vendedor_id: lead.responsavel_id ?? null,
      vendedor_externo: null,
      tipo_vendedor: "interno",
      forma_pagamento: form.forma_pagamento || null,
      tipo_parcelamento: form.tipo_parcelamento || null,
      qtd_parcelas: form.qtd_parcelas ? Number(form.qtd_parcelas) : null,
      parcelamento_descricao: form.parcelamento_descricao || null,
      comissao_percentual: null,
      observacoes: form.observacoes || null,
      data_venda: form.data_venda.toISOString(),
      status: "em_aberto",
      campos_extras: extras,
    };
    try {
      const vendaId = await criar.mutateAsync(payload as unknown as Omit<Venda, "id" | "criado_em">);
      const venda: Venda = {
        id: vendaId,
        criado_em: new Date().toISOString(),
        ...(payload as unknown as Omit<Venda, "id" | "criado_em">),
      };
      setVendaCriada(venda);
      setOpen(false);
      setContratoOpen(true);
    } catch (e) {
      toast.error("Erro ao registrar venda", { description: (e as Error).message });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {trigger}
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Emitir contrato
            </DialogTitle>
            <DialogDescription>
              Cliente: <strong>{lead.nome}</strong>
              {lead.fazenda ? ` · ${lead.fazenda}` : ""}
              {ultimaVenda ? (
                <span className="block text-[11px] text-muted-foreground mt-1">
                  Dados preenchidos com base no último contrato deste lead. Edite se necessário.
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 py-2 sm:grid-cols-2">
            <Field label="Data do contrato *">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("h-9 justify-start text-left font-normal text-xs")}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                    {format(form.data_venda, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.data_venda}
                    onSelect={(d) => d && setForm({ ...form, data_venda: d })}
                    locale={ptBR}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </Field>
            <Field label="Categoria *">
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_VENDA.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Tipo de contrato *">
              <Select value={tipo} onValueChange={(v) => setTipo(v as ContratoTipo)}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTRATO_TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Produto / descrição" full>
              <Input
                value={form.produto}
                onChange={(e) => setForm({ ...form, produto: e.target.value })}
                placeholder="Ex: Matriz Nelore PO 24m"
                className="h-9 text-xs"
              />
            </Field>
            <Field label="Quantidade">
              <Input
                type="number"
                min={1}
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) })}
                className="h-9 text-xs"
              />
            </Field>
            <Field label="Valor total (R$) *">
              <Input
                type="number"
                step="0.01"
                value={form.valor_total}
                onChange={(e) => setForm({ ...form, valor_total: e.target.value })}
                className="h-9 text-xs"
              />
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
              <Input
                type="number"
                min={1}
                value={form.qtd_parcelas}
                onChange={(e) => setForm({ ...form, qtd_parcelas: e.target.value })}
                placeholder="Ex: 30"
                className="h-9 text-xs"
              />
            </Field>
            <Field label="Descrição do parcelamento" full>
              <Input
                value={form.parcelamento_descricao}
                onChange={(e) => setForm({ ...form, parcelamento_descricao: e.target.value })}
                placeholder='Ex: "30x diretas" ou "12x + 12x duplo"'
                className="h-9 text-xs"
              />
            </Field>
            <Field label="Observações do contrato" full>
              <Textarea
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                className="text-xs min-h-[60px]"
              />
            </Field>
          </div>

          {CAMPOS_EXTRAS_POR_TIPO[tipo].length > 0 && (
            <div className="border-t border-border pt-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Dados do contrato — {LABEL_TIPO[tipo]}
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CAMPOS_EXTRAS_POR_TIPO[tipo].map((f) => {
                  const val = extras[f.key] ?? '';
                  const onChange = (v: string) => setExtras((p) => ({ ...p, [f.key]: v }));
                  if (f.type === 'textarea') {
                    return (
                      <Field key={f.key} label={f.label} full>
                        <Textarea value={val} onChange={(e) => onChange(e.target.value)} className="text-xs min-h-[60px]" />
                      </Field>
                    );
                  }
                  return (
                    <Field key={f.key} label={f.label}>
                      <Input
                        type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                        value={val}
                        onChange={(e) => onChange(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </Field>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submit} disabled={criar.isPending}>
              {criar.isPending
                ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Emitindo…</>
                : <><FileText className="h-4 w-4 mr-1.5" /> Emitir contrato</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {vendaCriada && (
        <ContratoDialog
          open={contratoOpen}
          onOpenChange={(v) => {
            setContratoOpen(v);
            if (!v) setVendaCriada(null);
          }}
          venda={vendaCriada}
          lead={lead}
        />
      )}
    </>
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
