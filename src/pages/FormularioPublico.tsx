import { useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFormularioPorSlug } from "@/hooks/useFormularios";
import { supabase } from "@/integrations/supabase/client";
import logoNelore from "@/assets/logo-nelore-vc.png";

export default function FormularioPublicoPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: form, isLoading, error } = useFormularioPorSlug(slug);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [mensagemFinal, setMensagemFinal] = useState("");
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <div className="bg-card border rounded-xl p-8 max-w-md text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-warning mx-auto" />
          <h1 className="text-lg font-semibold">Formulário indisponível</h1>
          <p className="text-sm text-muted-foreground">
            Este formulário não existe ou está fora do ar no momento.
          </p>
        </div>
      </div>
    );
  }

  function setVal(key: string, valor: string) {
    setRespostas((r) => ({ ...r, [key]: valor }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setErroEnvio(null);

    // Validação cliente
    for (const c of form.campos) {
      if (c.obrigatorio && !(respostas[c.key] ?? "").trim()) {
        setErroEnvio(`Preencha: ${c.label}`);
        return;
      }
      if (c.tipo === "email" && respostas[c.key] && !/^\S+@\S+\.\S+$/.test(respostas[c.key])) {
        setErroEnvio(`Email inválido: ${c.label}`);
        return;
      }
    }

    setEnviando(true);
    try {
      const { data, error } = await supabase.functions.invoke("submeter-formulario", {
        body: { slug: form.slug, respostas },
      });
      if (error) throw error;
      const resp = data as { ok?: boolean; mensagem?: string; error?: string };
      if (!resp?.ok) throw new Error(resp?.error || "Falha ao enviar");
      setMensagemFinal(resp.mensagem ?? form.mensagem_sucesso);
      setEnviado(true);
    } catch (err) {
      setErroEnvio((err as Error).message || "Não foi possível enviar.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <div className="bg-card border rounded-xl p-8 max-w-md text-center space-y-4 border-t-4" style={{ borderTopColor: form.cor }}>
          <CheckCircle2 className="h-12 w-12 mx-auto" style={{ color: form.cor }} />
          <h1 className="text-xl font-bold">Pronto!</h1>
          <p className="text-sm text-muted-foreground">{mensagemFinal}</p>
          <Button
            variant="outline"
            onClick={() => { setEnviado(false); setRespostas({}); }}
          >
            Enviar outro
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-center mb-5">
          <img src={logoNelore} alt="" className="h-12 w-12 rounded-full object-cover" loading="lazy" decoding="async" />
        </div>
        <form
          onSubmit={enviar}
          className="bg-card border rounded-xl p-6 space-y-5 shadow-sm border-t-4"
          style={{ borderTopColor: form.cor }}
        >
          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold">{form.titulo}</h1>
            {form.descricao && <p className="text-sm text-muted-foreground">{form.descricao}</p>}
          </div>

          <div className="space-y-4">
            {form.campos.map((c) => (
              <div key={c.key} className="space-y-1.5">
                <Label>
                  {c.label} {c.obrigatorio && <span className="text-destructive">*</span>}
                </Label>
                {c.tipo === "textarea" ? (
                  <Textarea
                    rows={3}
                    value={respostas[c.key] ?? ""}
                    onChange={(e) => setVal(c.key, e.target.value)}
                    maxLength={2000}
                  />
                ) : c.tipo === "selecao" ? (
                  <Select value={respostas[c.key] ?? ""} onValueChange={(v) => setVal(c.key, v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {(c.opcoes ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={c.tipo === "numero" ? "number" : c.tipo === "email" ? "email" : c.tipo === "telefone" ? "tel" : "text"}
                    value={respostas[c.key] ?? ""}
                    onChange={(e) => setVal(c.key, e.target.value)}
                    maxLength={500}
                  />
                )}
              </div>
            ))}
          </div>

          {erroEnvio && (
            <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{erroEnvio}</span>
            </div>
          )}

          <Button type="submit" disabled={enviando} className="w-full" style={{ backgroundColor: form.cor }}>
            {enviando ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>) : "Enviar"}
          </Button>
        </form>
        <p className="text-center text-[11px] text-muted-foreground mt-4">CRM Nelore VC</p>
      </div>
    </div>
  );
}
