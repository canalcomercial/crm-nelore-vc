import { lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { Topbar } from "@/components/layout/Topbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConexaoWizard } from "@/components/meta/ConexaoWizard";
import { FormulariosTab } from "@/components/meta/FormulariosTab";
import { LogTab } from "@/components/meta/LogTab";
import { DashboardTab } from "@/components/meta/DashboardTab";
import { ContratanteForm } from "@/components/contratos/ContratanteForm";
import { TemplateEditor } from "@/components/contratos/TemplateEditor";
import { ListaContratos } from "@/components/contratos/ListaContratos";

const AdminPaginaComercial = lazy(() => import("./AdminPaginaComercial"));

export default function AdminPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "pagina";
  const sub = params.get("sub") ?? "dashboard";
  const subContrato = params.get("sub") ?? "template";

  const setTab = (v: string) =>
    setParams((p) => { p.set("tab", v); p.delete("sub"); return p; }, { replace: true });
  const setSub = (v: string) =>
    setParams((p) => { p.set("tab", "meta"); p.set("sub", v); return p; }, { replace: true });
  const setSubContrato = (v: string) =>
    setParams((p) => { p.set("tab", "contratos"); p.set("sub", v); return p; }, { replace: true });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Topbar title="Admin" hideSearch />
      <div className="border-b bg-surface px-5">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-11 bg-transparent p-0 gap-1">
            <TabsTrigger value="pagina" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4">Página comercial</TabsTrigger>
            <TabsTrigger value="meta" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4">Meta Lead Ads</TabsTrigger>
            <TabsTrigger value="contratos" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md px-4">Contratos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {tab === "pagina" && (
          <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Carregando…</div>}>
            <AdminPaginaComercial />
          </Suspense>
        )}

        {tab === "meta" && (
          <div className="p-5 overflow-auto h-full">
            <Tabs value={sub === "template" || sub === "contratante" || sub === "emitidos" ? "dashboard" : sub} onValueChange={setSub} className="max-w-6xl mx-auto">
              <TabsList>
                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                <TabsTrigger value="conexao">Conexão</TabsTrigger>
                <TabsTrigger value="formularios">Formulários</TabsTrigger>
                <TabsTrigger value="log">Log de eventos</TabsTrigger>
              </TabsList>
              <TabsContent value="dashboard" className="mt-4"><DashboardTab /></TabsContent>
              <TabsContent value="conexao" className="mt-4"><ConexaoWizard /></TabsContent>
              <TabsContent value="formularios" className="mt-4"><FormulariosTab /></TabsContent>
              <TabsContent value="log" className="mt-4"><LogTab /></TabsContent>
            </Tabs>
          </div>
        )}

        {tab === "contratos" && (
          <div className="p-5 overflow-auto h-full">
            <Tabs value={subContrato === "dashboard" || subContrato === "conexao" || subContrato === "formularios" || subContrato === "log" ? "template" : subContrato} onValueChange={setSubContrato} className="max-w-6xl mx-auto">
              <TabsList>
                <TabsTrigger value="template">Template</TabsTrigger>
                <TabsTrigger value="contratante">Dados da contratante</TabsTrigger>
                <TabsTrigger value="emitidos">Contratos emitidos</TabsTrigger>
              </TabsList>
              <TabsContent value="template" className="mt-4"><TemplateEditor /></TabsContent>
              <TabsContent value="contratante" className="mt-4"><ContratanteForm /></TabsContent>
              <TabsContent value="emitidos" className="mt-4"><ListaContratos /></TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}