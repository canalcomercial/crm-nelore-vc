import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle, Loader2 } from "lucide-react";
import { enviarLeadPaginaComercial } from "@/hooks/usePaginaComercial";
import { toast } from "sonner";

export type LeadModalContext = {
  animal_id?: string | null;
  animal_nome?: string | null;
  animal_lote?: string | null;
  evento_id?: string | null;
  origem_secao?: string | null;
  mensagem_sugerida?: string;
};

export function LeadModal({
  open,
  onOpenChange,
  context,
  whatsappFallback,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  context: LeadModalContext;
  whatsappFallback?: string;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagem, setMensagem] = useState(context.mensagem_sugerida ?? "");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const titulo = context.animal_lote
    ? `Interesse no Lote ${context.animal_lote}${context.animal_nome ? ` — ${context.animal_nome}` : ""}`
    : context.origem_secao === "evento"
    ? "Quero participar do evento"
    : "Falar com consultor";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || telefone.replace(/\D/g, "").length < 10) {
      toast.error("Preencha nome e um WhatsApp válido");
      return;
    }
    setLoading(true);
    try {
      await enviarLeadPaginaComercial({
        nome: nome.trim(),
        telefone,
        mensagem: mensagem.trim() || undefined,
        animal_id: context.animal_id ?? null,
        animal_nome: context.animal_nome ?? null,
        animal_lote: context.animal_lote ?? null,
        evento_id: context.evento_id ?? null,
        origem_secao: context.origem_secao ?? null,
      });
      setSucesso(true);
      toast.success("Recebemos seu contato! Um consultor falará com você em breve.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function fecharEReset(v: boolean) {
    onOpenChange(v);
    if (!v) {
      setTimeout(() => {
        setNome(""); setTelefone(""); setMensagem(context.mensagem_sugerida ?? ""); setSucesso(false);
      }, 200);
    }
  }

  function abrirWhatsApp() {
    if (!whatsappFallback) return;
    const num = whatsappFallback.replace(/\D/g, "");
    const msg = encodeURIComponent(context.mensagem_sugerida || "Olá! Vim pela página comercial da Nelore VC.");
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  }

  return (
    <Dialog open={open} onOpenChange={fecharEReset}>
      <DialogContent className="max-w-md max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:w-screen max-md:max-w-none max-md:rounded-none max-md:border-0 max-md:p-4 max-md:overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{titulo}</DialogTitle>
          <DialogDescription>
            Preencha 2 campos e nosso consultor entra em contato agora.
          </DialogDescription>
        </DialogHeader>

        {sucesso ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-[color:var(--pc-primary)] text-white flex items-center justify-center text-2xl">✓</div>
            <p className="text-lg font-semibold">Recebemos seu contato!</p>
            <p className="text-sm text-muted-foreground">Um consultor da Nelore VC vai falar com você pelo WhatsApp em instantes.</p>
            <Button variant="outline" onClick={() => fecharEReset(false)} className="w-full">Fechar</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="lm-nome">Seu nome</Label>
              <Input id="lm-nome" autoFocus value={nome} onChange={(e) => setNome(e.target.value)} maxLength={100} placeholder="Como podemos te chamar?" />
            </div>
            <div>
              <Label htmlFor="lm-tel">WhatsApp com DDD</Label>
              <Input id="lm-tel" inputMode="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={20} placeholder="(43) 99999-9999" />
            </div>
            <div>
              <Label htmlFor="lm-msg">Mensagem <span className="text-xs text-muted-foreground">(opcional)</span></Label>
              <Textarea id="lm-msg" value={mensagem} onChange={(e) => setMensagem(e.target.value)} maxLength={500} rows={3} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading} className="flex-1 bg-[color:var(--pc-primary)] hover:bg-[color:var(--pc-primary)]/90 text-white">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Falar com consultor"}
              </Button>
              {whatsappFallback && (
                <Button type="button" variant="outline" onClick={abrirWhatsApp} title="Abrir WhatsApp">
                  <MessageCircle className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground text-center">
              Seus dados vão direto para o consultor responsável. Sem spam.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}