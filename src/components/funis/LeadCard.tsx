import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { MessageCircle, AlertTriangle, BadgeCheck, BadgeX, BadgeAlert } from "lucide-react";
import type { Lead } from "@/types/crm";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

interface Props {
  lead: Lead;
  onClick: () => void;
  followUpAtraso?: number;
}

export function LeadCard({ lead, onClick, followUpAtraso }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const dias = differenceInDays(new Date(), new Date(lead.entrou_etapa_em));

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cn(
        "group bg-surface border border-border rounded-lg p-3 cursor-pointer transition-all",
        "hover:border-primary/50 hover:shadow-sm",
        isDragging && "opacity-40 shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">#{lead.numero}</span>
        {followUpAtraso !== undefined && followUpAtraso > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-destructive">
            <AlertTriangle className="h-3 w-3" /> {followUpAtraso}d
          </span>
        )}
      </div>
      <h4 className="text-sm font-semibold text-foreground leading-tight mb-0.5">{lead.nome}</h4>
      {lead.fazenda && (
        <p className="text-xs text-muted-foreground truncate">{lead.fazenda}</p>
      )}
      {(() => {
        const status = lead.status_cadastro ?? "sem_cadastro";
        const cfg =
          status === "aprovado"
            ? { cor: "bg-success/15 text-success border-success/30", label: "Cadastro aprovado", Icon: BadgeCheck }
            : status === "reprovado"
            ? { cor: "bg-destructive/15 text-destructive border-destructive/30", label: "Cadastro reprovado", Icon: BadgeX }
            : { cor: "bg-warning/15 text-warning border-warning/30", label: "Sem cadastro", Icon: BadgeAlert };
        const Icon = cfg.Icon;
        return (
          <span className={cn("inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium border", cfg.cor)}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </span>
        );
      })()}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/60">
        <span className="text-[11px] text-muted-foreground">{dias}d na etapa</span>
        {lead.telefone && (
          <a
            href={`https://wa.me/${lead.telefone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="h-6 w-6 rounded flex items-center justify-center text-success hover:bg-primary-soft transition-colors"
            title="WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
