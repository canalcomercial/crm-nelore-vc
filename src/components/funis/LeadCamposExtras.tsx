import { useEffect, useState } from "react";
import { Trash2, Sparkles } from "lucide-react";
import type { Lead } from "@/types/crm";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateLeadCamposExtras } from "@/hooks/useCrm";

interface Props {
  lead: Lead;
}

const LEGADO_KEYS = new Set([
  "orcamento", "prazo_compra", "raca_preferida",
  "qtd_cabecas", "finalidade", "forma_pagamento",
]);

export function LeadCamposExtras({ lead }: Props) {
  const updateExtras = useUpdateLeadCamposExtras();

  const [extras, setExtras] = useState<Record<string, string | number | null>>(
    lead.campos_extras ?? {}
  );

  const [necessidades, setNecessidades] = useState<string>(
    String(lead.campos_extras?.necessidades ?? "")
  );

  useEffect(() => {
    setExtras(lead.campos_extras ?? {});
    setNecessidades(String(lead.campos_extras?.necessidades ?? ""));
  }, [lead.id, lead.campos_extras]);

  const salvarNecessidades = () => {
    const next = { ...extras, necessidades };
    setExtras(next);
    updateExtras.mutate({ id: lead.id, campos_extras: next });
  };

  const removerExtraLegado = (key: string) => {
    const next = { ...extras };
    delete next[key];
    setExtras(next);
    updateExtras.mutate({ id: lead.id, campos_extras: next });
  };

  const camposLegados = Object.keys(extras).filter((k) => LEGADO_KEYS.has(k) && extras[k]);

  return (
    <div className="space-y-5">
      {/* Informações comerciais — caixa única */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Informações comerciais
          </h3>
        </div>

        <Textarea
          value={necessidades}
          onChange={(e) => setNecessidades(e.target.value)}
          onBlur={salvarNecessidades}
          placeholder="O que o cliente precisa e quer comprar? Ex: 50 matrizes Nelore PO, prazo 60 dias, parcelamento 12x..."
          className="min-h-[100px] text-xs resize-none"
        />

        {camposLegados.length > 0 && (
          <div className="mt-3 pt-2 border-t border-dashed border-border">
            <p className="text-[10px] text-muted-foreground mb-1.5">Campos antigos:</p>
            <div className="space-y-1">
              {camposLegados.map((k) => (
                <div key={k} className="flex items-center justify-between text-[11px] bg-muted/40 rounded px-2 py-1">
                  <span><span className="capitalize text-muted-foreground">{k.replace(/_/g, " ")}:</span> {String(extras[k])}</span>
                  <button
                    onClick={() => removerExtraLegado(k)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
