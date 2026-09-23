import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/layout/AppShell";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import FunisPage from "./pages/Funis";
import AuthPage from "./pages/Auth";

const VendasPage = lazy(() => import("./pages/Vendas"));
const RelatoriosPage = lazy(() => import("./pages/Relatorios"));
const DisparosPage = lazy(() => import("./pages/Disparos"));
const TarefasPage = lazy(() => import("./pages/Tarefas"));
const EquipePage = lazy(() => import("./pages/Equipe"));
const BancoContatosPage = lazy(() => import("./pages/BancoContatos"));
const ImportarLeadsPage = lazy(() => import("./pages/ImportarLeads"));
const FormularioPublicoPage = lazy(() => import("./pages/FormularioPublico"));
const RedefinirSenhaPage = lazy(() => import("./pages/RedefinirSenha"));
const CatalogoPage = lazy(() => import("./pages/Catalogo"));
const AnimalDetalhePage = lazy(() => import("./pages/AnimalDetalhe"));
const AdminCatalogoPage = lazy(() => import("./pages/AdminCatalogo"));
const PaginaComercialPage = lazy(() => import("./pages/PaginaComercial"));
const AdminPage = lazy(() => import("./pages/Admin"));
const ContratoPublicoPage = lazy(() => import("./pages/ContratoPublico"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
    Carregando...
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
              <Route path="/f/:slug" element={<FormularioPublicoPage />} />
              <Route path="/catalogo" element={<CatalogoPage />} />
              <Route path="/catalogo/:id" element={<AnimalDetalhePage />} />
              <Route path="/nelore-vc" element={<PaginaComercialPage />} />
              <Route path="/contrato/:token" element={<ContratoPublicoPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<FunisPage />} />
                <Route path="/vendas" element={<VendasPage />} />
                <Route path="/relatorios" element={<RelatoriosPage />} />
                <Route path="/disparos" element={<DisparosPage />} />
                <Route path="/tarefas" element={<TarefasPage />} />
                <Route path="/banco" element={<BancoContatosPage />} />
                <Route path="/importar" element={<ImportarLeadsPage />} />
                <Route element={<ProtectedRoute requireCoordenador />}>
                  <Route path="/equipe" element={<EquipePage />} />
                  <Route path="/admin/catalogo" element={<AdminCatalogoPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/marketing" element={<Navigate to="/admin?tab=pagina" replace />} />
                  <Route path="/admin/contratos" element={<Navigate to="/admin?tab=contratos" replace />} />
                  <Route path="/admin/meta" element={<Navigate to="/admin?tab=meta" replace />} />
                  <Route path="/admin/pagina-comercial" element={<Navigate to="/admin?tab=pagina" replace />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
