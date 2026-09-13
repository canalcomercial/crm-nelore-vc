import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useMetaConfig, useSalvarMetaConfig } from "@/hooks/useMeta";

const PROJECT_REF = "jyhxcqlsinxodfcdrlgx";
const WEBHOOK_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/meta-lead-webhook`;

export function ConexaoTab() {
  const { data: config } = useMetaConfig();
  const salvar = useSalvarMetaConfig();
  const [appId, setAppId] = useState(config?.app_id ?? "");
  const [verifyHint, setVerifyHint] = useState(config?.verify_token_hint ?? "");
  const [ativo, setAtivo] = useState<boolean>(config?.ativo ?? true);
  const [tokenSet, setTokenSet] = useState<boolean>(config?.page_access_token_set ?? false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success("URL copiada");
  };

  const handleSalvar = () => {
    salvar.mutate({
      id: config?.id,
      app_id: appId,
      verify_token_hint: verifyHint,
      page_access_token_set: tokenSet,
      ativo,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold mb-1">URL do Webhook</h3>
          <p className="text-xs text-muted-foreground mb-2">
            Cole este endereço em Meta for Developers → Webhooks → Callback URL, campo <code>leadgen</code>.
          </p>
          <div className="flex gap-2">
            <Input value={WEBHOOK_URL} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="sm" onClick={copy} className="gap-1.5">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">App ID (Meta)</Label>
            <Input value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="1234567890" />
          </div>
          <div>
            <Label className="text-xs">Verify Token (dica)</Label>
            <Input value={verifyHint} onChange={(e) => setVerifyHint(e.target.value)} placeholder="Últimos caracteres" />
            <p className="text-[10px] text-muted-foreground mt-1">
              O valor real é a secret <code>META_VERIFY_TOKEN</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div>
            <Label className="text-xs">Page Access Token configurado?</Label>
            <p className="text-[10px] text-muted-foreground">
              Marque quando <code>META_PAGE_ACCESS_TOKEN</code> estiver salvo nas secrets.
            </p>
          </div>
          <Switch checked={tokenSet} onCheckedChange={setTokenSet} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label className="text-xs">Integração ativa</Label>
            <p className="text-[10px] text-muted-foreground">Desmarcar não desativa o webhook, apenas sinaliza no painel.</p>
          </div>
          <Switch checked={ativo} onCheckedChange={setAtivo} />
        </div>

        <Button onClick={handleSalvar} disabled={salvar.isPending} size="sm">
          Salvar configuração
        </Button>
      </div>

      <div className="bg-info/5 border border-info/20 rounded-lg p-4 text-xs space-y-2">
        <p className="font-semibold text-info">Como conectar no Meta</p>
        <ol className="list-decimal ml-4 space-y-1 text-muted-foreground">
          <li>Em <a className="text-info underline gap-1 inline-flex items-center" target="_blank" rel="noreferrer" href="https://developers.facebook.com/apps">developers.facebook.com/apps</a> abra seu app.</li>
          <li>Webhooks → Add Subscription → objeto <b>Page</b> → campo <b>leadgen</b>.</li>
          <li>Callback URL = URL acima. Verify Token = valor da secret <code>META_VERIFY_TOKEN</code>.</li>
          <li>Assine a página desejada. Gere um Page Access Token permanente e salve como <code>META_PAGE_ACCESS_TOKEN</code>.</li>
          <li>Cadastre os formulários na aba <b>Formulários</b>.</li>
        </ol>
      </div>
    </div>
  );
}