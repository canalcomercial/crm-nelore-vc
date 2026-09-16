import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ChevronRight, ChevronLeft, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMetaConfig, useSalvarMetaConfig } from "@/hooks/useMeta";

const PROJECT_REF = "jyhxcqlsinxodfcdrlgx";
const WEBHOOK_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/meta-lead-webhook`;

type Step = 1 | 2 | 3 | 4;

export function ConexaoWizard() {
  const { data: config } = useMetaConfig();
  const salvar = useSalvarMetaConfig();

  const [step, setStep] = useState<Step>(1);
  const [appId, setAppId] = useState(config?.app_id ?? "");
  const [verifyHint, setVerifyHint] = useState(config?.verify_token_hint ?? "");
  const [copied, setCopied] = useState(false);
  const [testando, setTestando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; paginas?: Array<{ id: string; name: string }>; error?: string } | null>(null);

  const tokenSet = config?.page_access_token_set ?? false;
  const verificadoEm = (config as { verificado_em?: string } | undefined)?.verificado_em;

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("URL copiada");
  };

  const salvarPasso1 = () => {
    salvar.mutate({ id: config?.id, app_id: appId, ativo: config?.ativo ?? true });
    setStep(2);
  };
  const gerarVerify = () => {
    const rnd = crypto.getRandomValues(new Uint8Array(24));
    const val = Array.from(rnd).map((b) => b.toString(16).padStart(2, "0")).join("");
    setVerifyHint(val.slice(-8));
    navigator.clipboard.writeText(val);
    toast.success("Token copiado para o clipboard — cole na secret META_VERIFY_TOKEN");
  };
  const salvarPasso2 = () => {
    salvar.mutate({ id: config?.id, verify_token_hint: verifyHint });
    setStep(3);
  };
  const marcarTokenSalvo = () => {
    salvar.mutate({ id: config?.id, page_access_token_set: true });
    setStep(4);
  };
  const testarConexao = async () => {
    setTestando(true);
    setResultado(null);
    try {
      const { data, error } = await supabase.functions.invoke("meta-testar-conexao");
      if (error) throw error;
      setResultado(data as { ok: boolean; paginas?: Array<{ id: string; name: string }>; error?: string });
    } catch (e) {
      setResultado({ ok: false, error: (e as Error).message });
    } finally {
      setTestando(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <Stepper step={step} onStep={setStep} verificadoEm={verificadoEm} />

      {step === 1 && (
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold">1. Configure o webhook no Meta for Developers</h3>
            <p className="text-xs text-muted-foreground mt-1">
              No app do Meta, vá em <b>Webhooks → Page → leadgen</b> e cole a URL abaixo em <i>Callback URL</i>.
            </p>
          </div>
          <div className="flex gap-2">
            <Input value={WEBHOOK_URL} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="sm" onClick={copyWebhook} className="gap-1.5">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
          <div>
            <Label className="text-xs">App ID (Meta)</Label>
            <Input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="1234567890" />
          </div>
          <div className="flex justify-end">
            <Button onClick={salvarPasso1} className="gap-1.5">Avançar <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold">2. Verify token</h3>
            <p className="text-xs text-muted-foreground mt-1">
              O Meta usa esse token para validar o webhook. Gere um valor aleatório, salve como secret <code>META_VERIFY_TOKEN</code> e cole o mesmo valor no campo <i>Verify Token</i> do Meta.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={gerarVerify}>Gerar e copiar</Button>
            <Input value={verifyHint} onChange={(e) => setVerifyHint(e.target.value)} placeholder="Últimos caracteres (dica)" className="font-mono text-xs" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Guardamos apenas uma dica (últimos caracteres). O valor completo fica na secret <code>META_VERIFY_TOKEN</code> — peça ao Lovable para salvar via "add secret" se ainda não está configurado.
          </p>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)} className="gap-1.5"><ChevronLeft className="h-4 w-4" /> Voltar</Button>
            <Button onClick={salvarPasso2} className="gap-1.5">Avançar <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold">3. Page Access Token</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Gere um Page Access Token permanente no Meta (Business Settings → System Users) e salve como a secret <code>META_PAGE_ACCESS_TOKEN</code>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tokenSet ? (
              <Badge className="bg-success/15 text-success"><CheckCircle2 className="h-3 w-3 mr-1" /> Marcado como salvo</Badge>
            ) : (
              <Badge variant="outline">Pendente</Badge>
            )}
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)} className="gap-1.5"><ChevronLeft className="h-4 w-4" /> Voltar</Button>
            <Button onClick={marcarTokenSalvo} className="gap-1.5">Marcar como salvo e avançar <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold">4. Testar conexão</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Valida o Page Access Token contra <code>graph.facebook.com/me/accounts</code>. Se der certo, retorna as páginas disponíveis.
            </p>
          </div>
          <Button onClick={testarConexao} disabled={testando} className="gap-1.5">
            {testando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Testar agora
          </Button>
          {resultado && (
            <div className={`text-xs rounded-md border p-3 ${resultado.ok ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5"}`}>
              {resultado.ok ? (
                <>
                  <div className="flex items-center gap-2 text-success font-medium mb-2">
                    <CheckCircle2 className="h-4 w-4" /> Conexão bem-sucedida
                  </div>
                  <div className="space-y-1">
                    {resultado.paginas?.map((p) => (
                      <div key={p.id} className="flex justify-between">
                        <span>{p.name}</span>
                        <span className="font-mono text-muted-foreground">{p.id}</span>
                      </div>
                    ))}
                    {(!resultado.paginas || resultado.paginas.length === 0) && (
                      <div className="text-muted-foreground">Nenhuma página vinculada.</div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-2 text-destructive">
                  <XCircle className="h-4 w-4 mt-0.5" />
                  <div>
                    <div className="font-medium">Falha na verificação</div>
                    <div>{resultado.error}</div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(3)} className="gap-1.5"><ChevronLeft className="h-4 w-4" /> Voltar</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function Stepper({ step, onStep, verificadoEm }: { step: Step; onStep: (s: Step) => void; verificadoEm?: string }) {
  const items = [
    { n: 1 as Step, label: "Webhook" },
    { n: 2 as Step, label: "Verify Token" },
    { n: 3 as Step, label: "Page Token" },
    { n: 4 as Step, label: "Testar" },
  ];
  return (
    <div className="flex items-center gap-2">
      {items.map((it, i) => (
        <div key={it.n} className="flex items-center gap-2 flex-1">
          <button
            onClick={() => onStep(it.n)}
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border ${step >= it.n ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground"}`}
          >
            {it.n}
          </button>
          <span className={`text-xs ${step === it.n ? "font-semibold" : "text-muted-foreground"}`}>{it.label}</span>
          {i < items.length - 1 && <div className="flex-1 h-px bg-border" />}
        </div>
      ))}
      {verificadoEm && (
        <Badge variant="outline" className="text-[10px] ml-2 shrink-0">
          Verificado em {new Date(verificadoEm).toLocaleString("pt-BR")}
        </Badge>
      )}
    </div>
  );
}