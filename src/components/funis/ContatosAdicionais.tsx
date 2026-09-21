import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

type LeadContato = {
  id: string;
  lead_id: string;
  nome: string;
  telefone: string | null;
  observacao: string | null;
  criado_em: string;
};

function useContatosLead(leadId: string) {
  return useQuery({
    queryKey: ["lead_contatos", leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_contatos" as never)
        .select("*")
        .eq("lead_id", leadId)
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as LeadContato[];
    },
  });
}

function useCriarContato(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { nome: string; telefone: string; observacao: string }) => {
      const { error } = await supabase
        .from("lead_contatos" as never)
        .insert({
          lead_id: leadId,
          nome: payload.nome,
          telefone: payload.telefone || null,
          observacao: payload.observacao || null,
        } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead_contatos", leadId] });
      toast.success("Contato adicionado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

function useExcluirContato(leadId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_contatos" as never).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead_contatos", leadId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function ContatosAdicionais({ leadId }: { leadId: string }) {
  const { data: contatos = [], isLoading } = useContatosLead(leadId);
  const criar = useCriarContato(leadId);
  const excluir = useExcluirContato(leadId);

  const [adicionando, setAdicionando] = useState(false);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacao, setObservacao] = useState("");

  const reset = () => {
    setNome(""); setTelefone(""); setObservacao(""); setAdicionando(false);
  };

  const salvar = async () => {
    if (!nome.trim()) { toast.error("Informe o nome"); return; }
    await criar.mutateAsync({ nome: nome.trim(), telefone: telefone.trim(), observacao: observacao.trim() });
    reset();
  };

  return (
    <div className="space-y-2">
      {isLoading ? (
        <p className="text-[11px] text-muted-foreground">Carregando...</p>
      ) : contatos.length === 0 && !adicionando ? (
        <p className="text-[11px] text-muted-foreground italic">Nenhum contato adicional.</p>
      ) : (
        <div className="space-y-1.5">
          {contatos.map((c) => {
            const digits = (c.telefone ?? "").replace(/\D/g, "");
            return (
              <div key={c.id} className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.nome}</p>
                  <p className="text-[10.5px] text-muted-foreground truncate">
                    {c.telefone || "—"}
                    {c.observacao ? <span className="ml-1.5 italic">· {c.observacao}</span> : null}
                  </p>
                </div>
                {digits && (
                  <a
                    href={`https://wa.me/${digits}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-7 w-7 inline-flex items-center justify-center rounded-md text-[#25D366] hover:bg-[#25D366]/10"
                    title="Abrir WhatsApp"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => excluir.mutate(c.id)}
                  className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Excluir"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {adicionando ? (
        <div className="space-y-1.5 rounded-md border border-border bg-muted/30 p-2.5">
          <Input
            autoFocus
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="h-7 text-xs"
          />
          <Input
            placeholder="Telefone / WhatsApp"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            inputMode="tel"
            className="h-7 text-xs"
          />
          <Input
            placeholder="Observação (ex: sócio, esposa, gerente)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="h-7 text-xs"
          />
          <div className="flex items-center justify-end gap-1.5 pt-0.5">
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={reset}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancelar
            </Button>
            <Button size="sm" className="h-7 text-xs" onClick={salvar} disabled={criar.isPending}>
              {criar.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdicionando(true)}
          className="text-[11px] text-primary font-medium hover:underline inline-flex items-center gap-1"
        >
          <Plus className="h-3 w-3" /> Adicionar contato
        </button>
      )}
    </div>
  );
}