import { ReactNode, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTodosLeads, useFunis } from "@/hooks/useCrm";

interface TopbarProps {
  title: string;
  onNewLead?: () => void;
  actions?: ReactNode;
  hideSearch?: boolean;
}

export function Topbar({ title, onNewLead, actions, hideSearch }: TopbarProps) {
  const navigate = useNavigate();
  const { data: leads = [] } = useTodosLeads();
  const { data: funis = [] } = useFunis();
  const [q, setQ] = useState("");
  const [focado, setFocado] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const resultados = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    const digits = s.replace(/\D/g, "");
    return leads
      .filter((l) => {
        const nome = (l.nome ?? "").toLowerCase();
        const fazenda = (l.fazenda ?? "").toLowerCase();
        const tel = (l.telefone ?? "").replace(/\D/g, "");
        const cpf = (l.cpf ?? "").replace(/\D/g, "");
        if (nome.includes(s) || fazenda.includes(s)) return true;
        if (digits.length >= 3 && (tel.includes(digits) || cpf.includes(digits))) return true;
        return false;
      })
      .slice(0, 20);
  }, [leads, q]);

  const abrir = (leadId: string) => {
    setQ("");
    setFocado(false);
    setMobileSearchOpen(false);
    navigate(`/funis?lead=${leadId}`);
  };

  const SearchResults = () => {
    if (!focado || !q.trim()) return null;
    return (
      <div className="absolute z-50 mt-1 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto rounded-md border border-border bg-popover shadow-lg scrollbar-thin">
        {resultados.length === 0 ? (
          <div className="px-3 py-4 text-xs text-muted-foreground text-center">
            Nenhum lead encontrado
          </div>
        ) : (
          resultados.map((l) => {
            const funilNome = funis.find((f) => f.id === l.funil_id)?.nome ?? "Sem funil";
            return (
              <button
                key={l.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => abrir(l.id)}
                className="w-full text-left px-3 py-2 hover:bg-secondary border-b border-border last:border-b-0"
              >
                <div className="text-xs font-semibold text-foreground truncate">{l.nome}</div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground truncate">
                  <span className="px-1.5 py-0.5 rounded bg-secondary">{funilNome}</span>
                  {l.etapa && <span>· {l.etapa}</span>}
                  {l.telefone && <span>· {l.telefone}</span>}
                </div>
                {l.fazenda && (
                  <div className="text-[10px] text-muted-foreground truncate">{l.fazenda}</div>
                )}
              </button>
            );
          })
        )}
      </div>
    );
  };

  return (
    <header className="h-14 shrink-0 border-b border-border bg-surface flex items-center pr-3 pl-14 sm:px-5 sm:pl-5 gap-2 sm:gap-4 relative">
      {/* Mobile Search Overlay */}
      {mobileSearchOpen && !hideSearch && (
        <div className="absolute inset-0 z-40 bg-surface px-3 flex items-center gap-2 sm:hidden">
          <button
            onClick={() => { setMobileSearchOpen(false); setQ(""); }}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="relative flex-1">
            <Input
              autoFocus
              placeholder="Buscar lead, telefone..."
              className="h-9 w-full bg-background border-border text-sm pl-3 pr-8"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setFocado(true)}
              onBlur={() => setTimeout(() => setFocado(false), 150)}
            />
            {q && (
              <button
                onClick={() => { setQ(""); setFocado(true); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <SearchResults />
          </div>
        </div>
      )}

      <h1 className="text-sm sm:text-base font-semibold tracking-tight truncate">{title}</h1>
      <div className="ml-auto flex items-center gap-2 flex-1 sm:w-full sm:max-w-md justify-end min-w-0">
        {!hideSearch && (
          <>
            {/* Desktop Search Input */}
            <div className="relative flex-1 min-w-0 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar lead, telefone, fazenda..."
                className="h-9 pl-8 bg-background border-border text-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => setFocado(true)}
                onBlur={() => setTimeout(() => setFocado(false), 150)}
              />
              {q && (
                <button
                  onClick={() => { setQ(""); setFocado(false); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Limpar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <SearchResults />
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="h-9 w-9 flex sm:hidden shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
          </>
        )}
        
        {actions ? (
          actions
        ) : onNewLead ? (
          <Button size="sm" className="h-9 gap-1.5 shrink-0" onClick={onNewLead}>
            <Plus className="h-4 w-4" /> <span className="hidden xs:inline">Novo Lead</span>
          </Button>
        ) : null}
      </div>
    </header>
  );
}
