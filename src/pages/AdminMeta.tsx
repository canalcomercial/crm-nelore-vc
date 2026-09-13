import { Topbar } from "@/components/layout/Topbar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ConexaoTab } from "@/components/meta/ConexaoTab";
import { FormulariosTab } from "@/components/meta/FormulariosTab";
import { LogTab } from "@/components/meta/LogTab";

export default function AdminMetaPage() {
  return (
    <>
      <Topbar title="Meta Lead Ads" hideSearch />
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="conexao" className="max-w-6xl mx-auto">
          <TabsList>
            <TabsTrigger value="conexao">Conexão</TabsTrigger>
            <TabsTrigger value="formularios">Formulários</TabsTrigger>
            <TabsTrigger value="log">Log de eventos</TabsTrigger>
          </TabsList>
          <TabsContent value="conexao" className="mt-4"><ConexaoTab /></TabsContent>
          <TabsContent value="formularios" className="mt-4"><FormulariosTab /></TabsContent>
          <TabsContent value="log" className="mt-4"><LogTab /></TabsContent>
        </Tabs>
      </div>
    </>
  );
}