import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleFontsPicker } from "./GoogleFontsPicker";
import type { PaginaTema } from "@/hooks/usePaginaComercial";

export function TemaEditor({ value, onChange }: { value: PaginaTema; onChange: (v: PaginaTema) => void }) {
  const set = <K extends keyof PaginaTema>(k: K, v: PaginaTema[K]) => onChange({ ...value, [k]: v });

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cores</h3>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Primária" value={value.cor_primaria} onChange={(v) => set("cor_primaria", v)} />
          <ColorField label="Fundo" value={value.cor_fundo} onChange={(v) => set("cor_fundo", v)} />
          <ColorField label="Texto" value={value.cor_texto} onChange={(v) => set("cor_texto", v)} />
          <ColorField label="Destaque (accent)" value={value.cor_accent ?? value.cor_primaria} onChange={(v) => set("cor_accent", v)} />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tipografia</h3>
        <GoogleFontsPicker label="Fonte dos títulos" value={value.font_heading} onChange={(v) => set("font_heading", v)} sampleText="Genética Nelore que transforma rebanhos" />
        <GoogleFontsPicker label="Fonte do corpo" value={value.font_body} onChange={(v) => set("font_body", v)} sampleText="Criatório Nelore PO em Londrina/PR" />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Estilo</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Raio de borda</Label>
            <Input value={value.radius} onChange={(e) => set("radius", e.target.value)} placeholder="12px" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Escala tipográfica</Label>
            <select className="w-full h-9 px-2 text-sm border rounded-md bg-background" value={value.escala ?? "padrao"} onChange={(e) => set("escala", e.target.value as PaginaTema["escala"])}>
              <option value="compacta">Compacta</option>
              <option value="padrao">Padrão</option>
              <option value="ampla">Ampla</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sombras</Label>
            <select className="w-full h-9 px-2 text-sm border rounded-md bg-background" value={value.sombras ?? "suave"} onChange={(e) => set("sombras", e.target.value as PaginaTema["sombras"])}>
              <option value="nenhuma">Nenhuma</option>
              <option value="suave">Suave</option>
              <option value="marcante">Marcante</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2 items-center">
        <Input type="color" className="h-10 w-14 p-1 shrink-0" value={value} onChange={(e) => onChange(e.target.value)} />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-xs" />
      </div>
    </div>
  );
}