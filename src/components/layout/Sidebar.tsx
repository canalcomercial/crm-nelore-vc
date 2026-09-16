import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Columns3, DollarSign, BarChart3, Send, CheckSquare, Users, LogOut, Database, Upload, Store, Settings, Menu } from "lucide-react";
import { useFollowUpsVencidos } from "@/hooks/useCrm";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import logoNelore from "@/assets/logo-nelore-vc.png";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const items = [
  { to: "/", icon: Columns3, label: "Funis" },
  { to: "/vendas", icon: DollarSign, label: "Vendas" },
  { to: "/relatorios", icon: BarChart3, label: "Relatórios" },
  { to: "/disparos", icon: Send, label: "Disparos" },
  { to: "/tarefas", icon: CheckSquare, label: "Tarefas", badge: true },
  { to: "/banco", icon: Database, label: "Banco de Contatos" },
  { to: "/importar", icon: Upload, label: "Importar Leads" },
  { to: "/equipe", icon: Users, label: "Equipe" },
  { to: "/admin/catalogo", icon: Store, label: "Catálogo Nelore VC" },
  { to: "/admin", icon: Settings, label: "Admin (Marketing + Contratos)" },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { data: vencidas = [] } = useFollowUpsVencidos();
  const { signOut, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fecha o menu mobile ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const NavItems = () => (
    <>
      <div className="hidden md:flex h-9 w-9 rounded-full overflow-hidden bg-white items-center justify-center mb-3 ring-1 ring-sidebar-border mx-auto shrink-0">
        <img src={logoNelore} alt="CRM Nelore VC" className="h-full w-full object-cover" decoding="async" />
      </div>
      <div className="md:hidden flex h-16 w-16 rounded-full overflow-hidden bg-white items-center justify-center mb-6 ring-1 ring-sidebar-border mx-auto shrink-0">
        <img src={logoNelore} alt="CRM Nelore VC" className="h-full w-full object-cover" decoding="async" />
      </div>
      
      {items.map((it) => {
        const active =
          it.to === "/"
            ? pathname === "/"
            : it.to === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(it.to);
        return (
          <NavLink
            key={it.to}
            to={it.to}
            title={it.label}
            className={cn(
              "relative flex items-center transition-colors shrink-0",
              // Desktop classes
              "md:h-9 md:w-9 md:rounded-lg md:justify-center",
              // Mobile classes
              "h-12 w-full px-4 rounded-lg gap-3",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            )}
          >
            <it.icon className="h-5 w-5 md:h-[18px] md:w-[18px] shrink-0" strokeWidth={2} />
            <span className="md:hidden font-medium">{it.label}</span>
            {it.badge && vencidas.length > 0 && (
              <span className={cn(
                "absolute bg-destructive text-destructive-foreground font-semibold flex items-center justify-center rounded-full",
                "md:-top-0.5 md:-right-0.5 md:h-4 md:min-w-4 md:px-1 md:text-[10px]",
                "top-3 right-4 h-5 min-w-5 px-1.5 text-xs md:hidden"
              )}>
                {vencidas.length}
              </span>
            )}
          </NavLink>
        );
      })}
      <button
        onClick={signOut}
        title={profile ? `Sair (${profile.nome})` : "Sair"}
        className={cn(
          "relative flex items-center transition-colors shrink-0 text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          "md:mt-auto md:h-9 md:w-9 md:rounded-lg md:justify-center",
          "mt-auto h-12 w-full px-4 rounded-lg gap-3"
        )}
      >
        <LogOut className="h-5 w-5 md:h-[18px] md:w-[18px] shrink-0" strokeWidth={2} />
        <span className="md:hidden font-medium">Sair</span>
      </button>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="md:hidden fixed top-2.5 left-3 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="h-9 w-9 rounded-md border border-border bg-surface text-foreground flex items-center justify-center hover:bg-secondary transition-colors shadow-sm"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/80 transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-50 w-3/4 max-w-[280px] bg-sidebar border-r flex flex-col gap-1 overflow-y-auto transition-transform duration-200 ease-in-out py-3",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <NavItems />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:static md:h-full md:w-[52px] md:shrink-0 md:flex-col md:justify-start md:items-center md:overflow-visible md:border-r md:border-t-0 md:py-3 md:gap-1 md:px-0 bg-sidebar"
        )}
      >
        <NavItems />
      </aside>
    </>
  );
}
