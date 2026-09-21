import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { mensagemDeErro } from "@/lib/erros";
import type { Animal } from "@/hooks/useCatalogo";

export function PropostaDialog({
  open,
  onOpenChange,
  animal,
  onSucesso,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  animal: Animal;
  onSucesso?: (proposta: { nome: string; valor_ofertado: number | null; parcelas: number | null; mensagem: string }) => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [valor, setValor] = useState("");
  const [parcelas, setParcelas] = useState<string>("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim().length < 2 || telefone.trim().length < 6) {
      toast.error("Preencha nome e telefone");
      return;
    }
    setEnviando(true);
    try {
      const valorNum = valor ? Number(valor) : null;
      const parcelasNum = parcelas ? Number(parcelas) : null;
      const { data, error } = await supabase.functions.invoke("receber-proposta", {
        body: {
          nome: nome.trim(),
          telefone: telefone.trim(),
          email: email.trim() || undefined,
          valor_ofertado: valorNum,
          parcelas: parcelasNum,
          mensagem: mensagem.trim() || undefined,
          animal_id: animal.id,
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      toast.success("Proposta enviada!");
      onSucesso?.({ nome, valor_ofertado: valorNum, parcelas: parcelasNum, mensagem });
      onOpenChange(false);
      setNome(""); setTelefone(""); setEmail(""); setValor(""); setParcelas(""); setMensagem("");
    } catch (err) {
      toast.error(mensagemDeErro(err, "Não foi possível enviar a proposta"));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fazer proposta · Lote {animal.lote ?? "-"}</DialogTitle>
          <p className="text-xs text-muted-foreground">Envie sua oferta. Um consultor entra em contato para confirmar as condições.</p>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label className="text-xs">Nome *</Label><Input required maxLength={100} value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Telefone *</Label><Input required maxLength={30} placeholder="(11) 99999-9999" value={telefone} onChange={(e) => setTelefone(e.target.value)} /></div>
            <div><Label className="text-xs">E-mail</Label><Input type="email" maxLength={200} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Valor ofertado (R$)</Label><Input type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} /></div>
            <div><Label className="text-xs">Parcelas</Label><Input type="number" min={1} max={240} value={parcelas} onChange={(e) => setParcelas(e.target.value)} /></div>
          </div>
          <div><Label className="text-xs">Mensagem</Label><Textarea rows={3} maxLength={1000} value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Detalhes adicionais da proposta" /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={enviando} className="bg-[hsl(var(--catalog-primary))] hover:bg-[hsl(var(--catalog-primary))]/90 text-white">
              {enviando ? "Enviando..." : "Enviar proposta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}