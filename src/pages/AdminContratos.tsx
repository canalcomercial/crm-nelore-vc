import { Topbar } from '@/components/layout/Topbar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ContratanteForm } from '@/components/contratos/ContratanteForm';
import { TemplateEditor } from '@/components/contratos/TemplateEditor';
import { ListaContratos } from '@/components/contratos/ListaContratos';

export default function AdminContratos() {
  return (
    <>
      <Topbar title="Contratos" />
      <div className="flex-1 overflow-auto p-5">
        <Tabs defaultValue="template" className="w-full">
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
    </>
  );
}