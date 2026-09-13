import { useDroppable } from "@dnd-kit/core";
import type { Lead } from "@/types/crm";
import { LeadCard } from "./LeadCard";
import { cn } from "@/lib/utils";

interface Props {
  etapa: string;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

export function KanbanColumn({ etapa, leads, onLeadClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  const isPerdido = etapa.toLowerCase().includes("perdido");

  return (
    <div className="flex flex-col w-[85vw] max-w-[300px] md:w-[280px] shrink-0 h-full snap-start md:snap-align-none">
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-2">
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            isPerdido ? "bg-destructive" : "bg-primary"
          )} />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">{etapa}</h3>
        </div>
        <span className="text-[11px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
          {leads.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 rounded-lg border border-dashed border-transparent p-1.5 space-y-2 overflow-y-auto scrollbar-thin transition-colors",
          isOver && "border-primary bg-primary-soft/40"
        )}
      >
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
        ))}
        {leads.length === 0 && (
          <div className="text-[11px] text-muted-foreground/60 text-center py-6">
            Nenhum lead
          </div>
        )}
      </div>
    </div>
  );
}
