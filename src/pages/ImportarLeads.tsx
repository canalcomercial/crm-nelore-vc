import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, RefreshCw, XCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFunis, useTodosLeads, useUsuarios } from "@/hooks/useCrm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { FormulariosTab } from "@/components/formularios/FormulariosTab";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

export default function ImportarLeadsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <header>
        <h1 className="text-2xl font-bold">Importar / Exportar Leads</h1>
        <p className="text-sm text-muted-foreground">
          Traga leads de fora — por planilha Excel ou formulário público — ou exporte sua base atual.
        </p>
      </header>
      <Tabs defaultValue="planilha">
        <TabsList>
          <TabsTrigger value="planilha"><FileSpreadsheet className="h-4 w-4 mr-2" /> Planilha</TabsTrigger>
          <TabsTrigger value="formularios"><Upload className="h-4 w-4 mr-2" /> Formulários</TabsTrigger>
          <TabsTrigger value="exportar"><FileDown className="h-4 w-4 mr-2" /> Exportar</TabsTrigger>
        </TabsList>
        <TabsContent value="planilha" className="mt-5"><PlanilhaTab /></TabsContent>
        <TabsContent value="formularios" className="mt-5"><FormulariosTab /></TabsContent>
        <TabsContent value="exportar" className="mt-5"><ExportarTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ExportarTab() {
  const { data: leads = [] } = useTodosLeads();
  const { data: funis = [] } = useFunis();
  const { data: usuarios = [] } = useUsuarios();
  const [escopo, setEscopo] = useState<"todos" | "ativos" | "arquivados" | "perdidos">("todos");
  const [funilId, setFunilId] = useState<string>("__all__");

  const filtrados = useMemo(() => leads.filter((l) => {
    if (escopo === "ativos" && (l.arquivado || l.etapa === "Perdido")) return false;
    if (escopo === "arquivados" && !l.arquivado) return false;
    if (escopo === "perdidos" && l.etapa !== "Perdido") return false;
    if (funilId !== "__all__" && l.funil_id !== funilId) return false;
    return true;
  }), [leads, escopo, funilId]);

  function exportar() {
    if (!filtrados.length) {
      toast.error("Nenhum contato para exportar");
      return;
    }
    const funilMap = new Map(funis.map((f) => [f.id, f.nome]));
    const userMap = new Map(usuarios.map((u) => [u.id, u.nome]));
    const cadLabel: Record<string, string> = { sem_cadastro: "Sem cadastro", aprovado: "Aprovado", reprovado: "Reprovado" };
    const extraKeys = new Set<string>();
    filtrados.forEach((l) => Object.keys(l.campos_extras ?? {}).forEach((k) => extraKeys.add(k)));
    const rows = filtrados.map((l) => {
      const base: Record<string, unknown> = {
        Numero: l.numero, Nome: l.nome, Fazenda: l.fazenda ?? "", Telefone: l.telefone ?? "",
        CPF: l.cpf ?? "", Cidade: l.cidade ?? "", Estado: l.estado ?? "", Tipo: l.tipo_cliente ?? "",
        Origem: l.origem ?? "", Interesse: l.interesse ?? "",
        Funil: funilMap.get(l.funil_id ?? "") ?? "", Etapa: l.etapa ?? "",
        Vendedor: userMap.get(l.responsavel_id ?? "") ?? "",
        Cadastro: cadLabel[l.status_cadastro] ?? l.status_cadastro,
        Status: l.arquivado ? "Arquivado" : l.etapa === "Perdido" ? "Perdido" : "Ativo",
        MotivoPerda: l.motivo_perda ?? "", Observacoes: l.observacoes ?? "",
        CriadoEm: l.criado_em ? format(new Date(l.criado_em), "dd/MM/yyyy") : "",
      };
      extraKeys.forEach((k) => { base[`extra_${k}`] = (l.campos_extras as Record<string, unknown>)?.[k] ?? ""; });
      return base;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contatos");
    XLSX.writeFile(wb, `contatos-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success(`${rows.length} contatos exportados`);
  }

  return (
    <Card className="p-5 space-y-4">
      <div>
        <h2 className="font-semibold flex items-center gap-2"><FileDown className="h-4 w-4" /> Exportar contatos para Excel</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gera uma planilha .xlsx com todos os contatos filtrados e seus atributos (incluindo campos personalizados).
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Escopo</Label>
          <Select value={escopo} onValueChange={(v: "todos" | "ativos" | "arquivados" | "perdidos") => setEscopo(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os contatos</SelectItem>
              <SelectItem value="ativos">Apenas ativos</SelectItem>
              <SelectItem value="arquivados">Apenas arquivados</SelectItem>
              <SelectItem value="perdidos">Apenas perdidos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Funil</Label>
          <Select value={funilId} onValueChange={setFunilId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os funis</SelectItem>
              {funis.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button onClick={exportar} className="w-full">
            <Download className="h-4 w-4 mr-2" /> Exportar {filtrados.length} contatos
          </Button>
        </div>
      </div>
    </Card>
  );
}

type LinhaPlanilha = {
  nome?: string; email?: string; telefone?: string; fazenda?: string; cidade?: string; estado?: string;
  tipo_cliente?: string; origem?: string; interesse?: string; observacoes?: string;
  funil?: string; etapa?: string;
};

type LinhaValidada = {
  linha: number;
  dados: LinhaPlanilha;
  problemas: string[];
  avisos: string[];
  duplicadaDeId?: string | null;
  duplicadaDeNome?: string | null;
};

const COLUNAS_ESPERADAS = [
  "nome","email","telefone","fazenda","cidade","estado","tipo_cliente",
  "origem","interesse","observacoes","funil","etapa",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UFS_BR = new Set([
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]);
function soDigitos(s: string) { return s.replace(/\D+/g, ""); }

function PlanilhaTab() {
  const { data: funis = [] } = useFunis();
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [validadas, setValidadas] = useState<LinhaValidada[]>([]);
  const [arquivo, setArquivo] = useState<string>("");
  const [destino, setDestino] = useState<"banco" | "funil">("banco");
  const [funilId, setFunilId] = useState<string>("");
  const [etapa, setEtapa] = useState<string>("");
  const [importando, setImportando] = useState(false);
  const [filtro, setFiltro] = useState<"todas" | "erro" | "duplicadas" | "avisos">("todas");
  const [resultado, setResultado] = useState<{
    criados: number; atualizados: number; ignorados: number; erros: string[];
  } | null>(null);

  const funilSelecionado = useMemo(() => funis.find((f) => f.id === funilId), [funis, funilId]);

  const stats = useMemo(() => {
    const total = validadas.length;
    const comErro = validadas.filter((v) => v.problemas.length > 0).length;
    const duplicadas = validadas.filter((v) => v.duplicadaDeId).length;
    const comAviso = validadas.filter((v) => v.problemas.length === 0 && v.avisos.length > 0).length;
    return { total, comErro, duplicadas, validas: total - comErro, comAviso };
  }, [validadas]);

  const linhasFiltradas = useMemo(() => {
    if (filtro === "erro") return validadas.filter((v) => v.problemas.length > 0);
    if (filtro === "duplicadas") return validadas.filter((v) => v.duplicadaDeId);
    if (filtro === "avisos") return validadas.filter((v) => v.problemas.length === 0 && v.avisos.length > 0);
    return validadas;
  }, [validadas, filtro]);

  async function lerArquivo(file: File) {
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes("lead")) || wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

      const norm: LinhaPlanilha[] = json.map((row) => {
        const r: Record<string, string> = {};
        for (const k of Object.keys(row)) {
          r[k.toString().trim().toLowerCase().replace(/\s+/g, "_")] = String(row[k] ?? "").trim();
        }
        return {
          nome: r.nome, telefone: r.telefone, fazenda: r.fazenda,
          cidade: r.cidade, estado: r.estado, tipo_cliente: r.tipo_cliente,
          origem: r.origem, interesse: r.interesse, observacoes: r.observacoes,
          funil: r.funil, etapa: r.etapa, email: r.email,
        };
      });

      const emailsVistos = new Map<string, number>();
      const lista: LinhaValidada[] = norm.map((dados, i) => {
        const linha = i + 2;
        const problemas: string[] = [];
        const avisos: string[] = [];

        if (!dados.nome) problemas.push("Nome em branco");
        if (dados.email) {
          if (!EMAIL_REGEX.test(dados.email)) {
            problemas.push(`Email inválido: "${dados.email}"`);
          } else {
            const lo = dados.email.toLowerCase();
            const ja = emailsVistos.get(lo);
            if (ja) avisos.push(`Email repetido na própria planilha (linha ${ja})`);
            else emailsVistos.set(lo, linha);
          }
        }
        if (dados.telefone) {
          const dig = soDigitos(dados.telefone);
          if (dig.length < 10 || dig.length > 11) {
            problemas.push(`Telefone inválido: "${dados.telefone}" (use 10 ou 11 dígitos com DDD)`);
          }
        }
        if (dados.estado) {
          const uf = dados.estado.toUpperCase().trim();
          if (!UFS_BR.has(uf)) problemas.push(`UF inválida: "${dados.estado}"`);
        }
        if (dados.cidade && !dados.estado) avisos.push("Cidade informada sem UF");
        if (dados.estado && !dados.cidade) avisos.push("UF informada sem cidade");
        return { linha, dados, problemas, avisos };
      }).filter((v) => v.dados.nome || v.dados.email || v.dados.telefone);

      // Buscar leads existentes para detectar duplicatas no banco
      const emailsValidos = lista
        .map((v) => v.dados.email?.toLowerCase())
        .filter((e): e is string => !!e && EMAIL_REGEX.test(e));

      if (emailsValidos.length) {
        const { data: existentes } = await supabase
          .from("leads")
          .select("id, nome, campos_extras")
          .limit(2000);
        const porEmail = new Map<string, { id: string; nome: string }>();
        for (const lead of (existentes ?? []) as { id: string; nome: string; campos_extras: Record<string, unknown> | null }[]) {
          const e = (lead.campos_extras as { email?: string } | null)?.email;
          if (e && typeof e === "string") {
            porEmail.set(e.toLowerCase(), { id: lead.id, nome: lead.nome });
          }
        }
        for (const v of lista) {
          if (v.dados.email && porEmail.has(v.dados.email.toLowerCase())) {
            const ref = porEmail.get(v.dados.email.toLowerCase())!;
            v.duplicadaDeId = ref.id;
            v.duplicadaDeNome = ref.nome;
            v.avisos.push(`Já existe um lead com este email (${ref.nome}) — será atualizado`);
          }
        }
      }

      setValidadas(lista);
      setArquivo(file.name);
      setResultado(null);
      setFiltro("todas");
      toast.success(`${lista.length} linhas lidas de ${file.name}`);
    } catch (err) {
      console.error(err);
      toast.error("Não consegui ler a planilha. Use o template como base.");
    }
  }

  async function importar() {
    if (!validadas.length) return;
    if (destino === "funil" && (!funilId || !etapa)) {
      toast.error("Escolha o funil e a etapa.");
      return;
    }
    setImportando(true);
    const erros: string[] = [];
    let criados = 0, atualizados = 0, ignorados = 0;

    const funilPorNome = new Map(funis.map((f) => [f.nome.toLowerCase(), f]));

    for (const v of validadas) {
      if (v.problemas.length) {
        ignorados++;
        for (const p of v.problemas) erros.push(`Linha ${v.linha}: ${p}`);
        continue;
      }
      const l = v.dados;

      let fId: string | null = null;
      let et: string | null = null;
      let arquivado = true;
      let arquivado_em: string | null = new Date().toISOString();

      if (destino === "funil") {
        fId = funilId; et = etapa; arquivado = false; arquivado_em = null;
      } else if (l.funil) {
        const f = funilPorNome.get(l.funil.toLowerCase());
        if (f) {
          fId = f.id;
          et = l.etapa && f.etapas.includes(l.etapa) ? l.etapa : f.etapas[0] ?? null;
          arquivado = false; arquivado_em = null;
        } else {
          erros.push(`Linha ${v.linha}: funil "${l.funil}" não encontrado — enviado ao Banco.`);
        }
      }

      try {
        if (v.duplicadaDeId) {
          const { data: atual } = await supabase
            .from("leads")
            .select("campos_extras, observacoes")
            .eq("id", v.duplicadaDeId)
            .single();

          const camposExtrasAtuais = (atual?.campos_extras ?? {}) as Record<string, unknown>;
          const campos_extras: Record<string, unknown> = {
            ...camposExtrasAtuais,
            ...(l.email ? { email: l.email } : {}),
          };

          const update: Record<string, unknown> = {
            campos_extras,
            arquivado,
            arquivado_em,
            entrou_etapa_em: new Date().toISOString(),
          };
          if (fId) update.funil_id = fId;
          if (et) update.etapa = et;
          if (l.nome) update.nome = l.nome;
          if (l.telefone) update.telefone = soDigitos(l.telefone);
          if (l.fazenda) update.fazenda = l.fazenda;
          if (l.cidade) update.cidade = l.cidade;
          if (l.estado) update.estado = l.estado.toUpperCase().trim();
          if (l.tipo_cliente) update.tipo_cliente = l.tipo_cliente;
          if (l.interesse) update.interesse = l.interesse;
          if (l.origem) update.origem = l.origem;
          if (l.observacoes) {
            update.observacoes = atual?.observacoes
              ? `${atual.observacoes}\n\n[Reimport ${new Date().toLocaleDateString("pt-BR")}] ${l.observacoes}`
              : l.observacoes;
          }

          const { error: updErr } = await supabase.from("leads").update(update as never).eq("id", v.duplicadaDeId);
          if (updErr) throw updErr;

          await supabase.from("interacoes").insert({
            lead_id: v.duplicadaDeId,
            tipo: "reconversao",
            conteudo: `Nova conversão via importação${l.origem ? ` (${l.origem})` : ""}${
              fId ? ` — movido para ${et ?? "etapa inicial"}` : ""
            }`,
          });
          atualizados++;
        } else {
          const campos_extras: Record<string, string> = {};
          if (l.email) campos_extras.email = l.email;

          const { error: insErr } = await supabase.from("leads").insert({
            nome: l.nome!,
            telefone: l.telefone ? soDigitos(l.telefone) : null,
            fazenda: l.fazenda || null,
            cidade: l.cidade || null,
            estado: l.estado ? l.estado.toUpperCase().trim() : null,
            tipo_cliente: l.tipo_cliente || null,
            origem: l.origem || "importacao",
            interesse: l.interesse || null,
            observacoes: l.observacoes || null,
            funil_id: fId,
            etapa: et,
            campos_extras,
            arquivado,
            arquivado_em,
          });
          if (insErr) throw insErr;
          criados++;
        }
      } catch (err) {
        erros.push(`Linha ${v.linha}: ${(err as Error).message}`);
        ignorados++;
      }
    }

    setImportando(false);
    setResultado({ criados, atualizados, ignorados, erros });
    qc.invalidateQueries({ queryKey: ["leads"] });
    qc.invalidateQueries({ queryKey: ["leads-arquivados"] });
    qc.invalidateQueries({ queryKey: ["todos-leads"] });
    if (criados + atualizados > 0) toast.success(`${criados} criados, ${atualizados} atualizados`);
    if (ignorados) toast.warning(`${ignorados} ignorados — veja os detalhes abaixo`);
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" /> 1. Baixe o template
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Use exatamente as colunas do template. Apenas <strong>nome</strong> é obrigatório. Se houver <strong>email</strong>, ele é validado e usado para detectar leads duplicados.
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {COLUNAS_ESPERADAS.map((c) => (
                <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
              ))}
            </div>
          </div>
          <Button asChild variant="outline">
            <a href="/template-importacao-leads.xlsx" download="template-importacao-leads.xlsx">
              <Download className="h-4 w-4 mr-2" /> Baixar template
            </a>
          </Button>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Upload className="h-4 w-4" /> 2. Envie sua planilha preenchida
        </h2>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) lerArquivo(f);
            e.target.value = "";
          }}
        />
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={() => inputRef.current?.click()} variant="outline">
            <Upload className="h-4 w-4 mr-2" /> Escolher arquivo
          </Button>
          {arquivo && (
            <span className="text-sm text-muted-foreground">
              <strong>{arquivo}</strong> — {validadas.length} linhas
            </span>
          )}
        </div>
      </Card>

      {validadas.length > 0 && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">3. Para onde enviar</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Destino</Label>
              <Select value={destino} onValueChange={(v: "banco" | "funil") => setDestino(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="banco">Banco de Contatos</SelectItem>
                  <SelectItem value="funil">Funil específico</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Se a planilha tiver as colunas <code>funil</code>/<code>etapa</code> preenchidas, elas têm prioridade quando o destino é "Banco".
              </p>
            </div>

            {destino === "funil" && (
              <>
                <div className="space-y-1.5">
                  <Label>Funil</Label>
                  <Select value={funilId} onValueChange={(v) => { setFunilId(v); setEtapa(""); }}>
                    <SelectTrigger><SelectValue placeholder="Escolha..." /></SelectTrigger>
                    <SelectContent>
                      {funis.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Etapa</Label>
                  <Select value={etapa} onValueChange={setEtapa} disabled={!funilSelecionado}>
                    <SelectTrigger><SelectValue placeholder="Escolha..." /></SelectTrigger>
                    <SelectContent>
                      {funilSelecionado?.etapas.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* Painel de validação */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatCard label="Total" value={stats.total} />
            <StatCard label="Válidas" value={stats.validas} tone="success" />
            <StatCard label="Com erro" value={stats.comErro} tone={stats.comErro ? "danger" : undefined} />
            <StatCard label="Vão atualizar" value={stats.duplicadas} tone={stats.duplicadas ? "info" : undefined} />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Filtrar:</span>
            <Button size="sm" variant={filtro === "todas" ? "default" : "outline"} onClick={() => setFiltro("todas")}>Todas</Button>
            <Button size="sm" variant={filtro === "erro" ? "default" : "outline"} onClick={() => setFiltro("erro")} disabled={!stats.comErro}>
              <XCircle className="h-3 w-3 mr-1" /> Com erro ({stats.comErro})
            </Button>
            <Button size="sm" variant={filtro === "duplicadas" ? "default" : "outline"} onClick={() => setFiltro("duplicadas")} disabled={!stats.duplicadas}>
              <RefreshCw className="h-3 w-3 mr-1" /> Duplicadas ({stats.duplicadas})
            </Button>
            <Button size="sm" variant={filtro === "avisos" ? "default" : "outline"} onClick={() => setFiltro("avisos")} disabled={!stats.comAviso}>
              <AlertCircle className="h-3 w-3 mr-1" /> Avisos ({stats.comAviso})
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-72 overflow-auto">
              <TooltipProvider>
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      {["", "Linha", "Nome", "Email", "Telefone", "Cidade/UF", "Funil"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {linhasFiltradas.slice(0, 100).map((v) => {
                      const erro = v.problemas.length > 0;
                      const dup = !!v.duplicadaDeId;
                      return (
                        <tr key={v.linha} className={`border-t ${erro ? "bg-destructive/5" : dup ? "bg-blue-500/5" : ""}`}>
                          <td className="px-3 py-1.5">
                            {erro ? (
                              <Tooltip>
                                <TooltipTrigger><XCircle className="h-4 w-4 text-destructive" /></TooltipTrigger>
                                <TooltipContent><div className="text-xs">{v.problemas.join(" · ")}</div></TooltipContent>
                              </Tooltip>
                            ) : dup ? (
                              <Tooltip>
                                <TooltipTrigger><RefreshCw className="h-4 w-4 text-blue-500" /></TooltipTrigger>
                                <TooltipContent><div className="text-xs">Atualiza lead "{v.duplicadaDeNome}"</div></TooltipContent>
                              </Tooltip>
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-muted-foreground">{v.linha}</td>
                          <td className="px-3 py-1.5">
                            {v.dados.nome || <span className="text-destructive">—</span>}
                            {v.problemas.length > 0 && (
                              <div className="text-[10px] text-destructive mt-0.5">{v.problemas.join(" · ")}</div>
                            )}
                            {v.avisos.length > 0 && v.problemas.length === 0 && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">{v.avisos.join(" · ")}</div>
                            )}
                          </td>
                          <td className="px-3 py-1.5">{v.dados.email}</td>
                          <td className="px-3 py-1.5">{v.dados.telefone}</td>
                          <td className="px-3 py-1.5">{[v.dados.cidade, v.dados.estado].filter(Boolean).join(" / ")}</td>
                          <td className="px-3 py-1.5">{v.dados.funil}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </TooltipProvider>
            </div>
            {linhasFiltradas.length > 100 && (
              <div className="px-3 py-2 text-[11px] text-muted-foreground bg-muted/30 border-t">
                Mostrando 100 de {linhasFiltradas.length} linhas filtradas. Todas serão processadas na importação.
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={importar} disabled={importando || stats.validas === 0}>
              {importando ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importando...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Importar {stats.validas} leads {stats.duplicadas > 0 && <span className="ml-1 opacity-80">({stats.duplicadas} atualizam)</span>}</>
              )}
            </Button>
          </div>
        </Card>
      )}

      {resultado && (
        <Card className="p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-success" /> Resultado
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Criados" value={resultado.criados} tone="success" />
            <StatCard label="Atualizados" value={resultado.atualizados} tone="info" />
            <StatCard label="Ignorados" value={resultado.ignorados} tone={resultado.ignorados ? "danger" : undefined} />
          </div>
          {resultado.erros.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm flex items-center gap-2 text-warning">
                <AlertCircle className="h-4 w-4" /> {resultado.erros.length} avisos:
              </p>
              <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-0.5 max-h-40 overflow-auto">
                {resultado.erros.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "success" | "danger" | "info" }) {
  const color =
    tone === "success" ? "text-success" :
    tone === "danger" ? "text-destructive" :
    tone === "info" ? "text-blue-500" :
    "text-foreground";
  return (
    <div className="border rounded-lg px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}
