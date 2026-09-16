import { useEffect, useRef, useState } from "react";
import { Monitor, Smartphone, Tablet, RefreshCw, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LAYOUT_PADRAO, useConfiguracao, useSalvarConfiguracao, type CatalogoLayout } from "@/hooks/useCatalogo";

type Device = "desktop" | "tablet" | "mobile";
const WIDTHS: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 390 };

// ---- Conversões HSL <-> HEX (e RGB para exibição) ----
function parseHslString(s: string): { h: number; s: number; l: number } | null {
  if (!s) return null;
  const m = s.trim().match(/(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)%?\s*[, ]\s*(-?\d+(?:\.\d+)?)%?/);
  if (!m) return null;
  return { h: Number(m[1]), s: Number(m[2]), l: Number(m[3]) };
}
function hslToRgb(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((h % 360) + 360) % 360 / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}
function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}
function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}
function hslStringToHex(hsl: string, fallback: string): string {
  const p = parseHslString(hsl);
  if (!p) return fallback;
  const { r, g, b } = hslToRgb(p.h, p.s, p.l);
  return rgbToHex(r, g, b);
}
function hexToHslString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  return `${h} ${s}% ${l}%`;
}
function hslToRgbString(hsl: string): string {
  const p = parseHslString(hsl);
  if (!p) return "—";
  const { r, g, b } = hslToRgb(p.h, p.s, p.l);
  return `rgb(${r}, ${g}, ${b})`;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const hex = hslStringToHex(value, "#000000");
  const rgb = hslToRgbString(value);
  return (
    <div>
      <Label className="text-[11px]">{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <div className="relative h-9 w-12 rounded-md border overflow-hidden shrink-0">
          <input
            type="color"
            value={hex}
            onChange={(e) => onChange(hexToHslString(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0 bg-transparent"
            aria-label={`Selecionar cor ${label}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-mono truncate">{hex.toUpperCase()}</div>
          <div className="text-[10px] text-muted-foreground truncate">{rgb} · hsl({value})</div>
        </div>
      </div>
    </div>
  );
}

export function LayoutEditor() {
  const { data: config } = useConfiguracao();
  const salvar = useSalvarConfiguracao();
  const [layout, setLayout] = useState<CatalogoLayout>(LAYOUT_PADRAO);
  const [device, setDevice] = useState<Device>("desktop");
  const [ready, setReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Só semeia o editor quando muda o registro carregado. Reagir a toda mudança
  // de `config` faria um refetch em background apagar edições não salvas.
  const idCarregado = useRef<string | null>(null);
  useEffect(() => {
    if (!config || idCarregado.current === config.id) return;
    idCarregado.current = config.id;
    if (config.layout) setLayout({ ...LAYOUT_PADRAO, ...(config.layout as CatalogoLayout) });
  }, [config]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "catalogo:ready") setReady(true);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "catalogo:preview", layout },
        window.location.origin,
      );
    }, 200);
    return () => clearTimeout(t);
  }, [layout, ready]);

  const upd = <K extends keyof CatalogoLayout>(k: K, v: CatalogoLayout[K]) => setLayout((l) => ({ ...l, [k]: v }));

  return (
    <div className="grid lg:grid-cols-[380px_1fr] gap-4">
      <div className="bg-surface rounded-lg border p-4 space-y-5 max-h-[calc(100vh-180px)] overflow-y-auto">
        <div>
          <h3 className="font-semibold text-sm mb-3">Colunas do grid</h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[11px]">Desktop</Label>
              <Select value={String(layout.colunas_desktop)} onValueChange={(v) => upd("colunas_desktop", Number(v) as 2 | 3 | 4)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{[2, 3, 4].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px]">Tablet</Label>
              <Select value={String(layout.colunas_tablet)} onValueChange={(v) => upd("colunas_tablet", Number(v) as 1 | 2 | 3)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2, 3].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px]">Mobile</Label>
              <Select value={String(layout.colunas_mobile)} onValueChange={(v) => upd("colunas_mobile", Number(v) as 1 | 2)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{[1, 2].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-3">Estilo do card</h3>
          <Select value={layout.estilo_card} onValueChange={(v) => upd("estilo_card", v as CatalogoLayout["estilo_card"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="compacto">Compacto (foto menor)</SelectItem>
              <SelectItem value="padrao">Padrão (equilibrado)</SelectItem>
              <SelectItem value="ampliado">Ampliado (foto grande)</SelectItem>
            </SelectContent>
          </Select>
          <div className="space-y-2 mt-3">
            <Row label="Mostrar índices (IABCZ/MGTE/IQG)" checked={layout.mostrar_indices} onChange={(v) => upd("mostrar_indices", v)} />
            <Row label="Mostrar preço" checked={layout.mostrar_preco} onChange={(v) => upd("mostrar_preco", v)} />
            <Row label="Mostrar categoria/raça" checked={layout.mostrar_categoria} onChange={(v) => upd("mostrar_categoria", v)} />
            <Row label="Mostrar badge do lote" checked={layout.mostrar_lote_badge} onChange={(v) => upd("mostrar_lote_badge", v)} />
            <Row
              label="Ficha completa por escrito (todos os campos da planilha)"
              checked={layout.mostrar_ficha_completa === true}
              onChange={(v) => upd("mostrar_ficha_completa", v)}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
            A ficha completa é a lista escrita, no fim da página do animal, com todo campo importado
            que não aparece no layout do catálogo. Deixe desligada para manter a ficha igual ao
            catálogo impresso.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-3">Botões</h3>
          <Label className="text-[11px]">Texto do botão de interesse</Label>
          <Input value={layout.botao_interesse_texto} onChange={(e) => upd("botao_interesse_texto", e.target.value)} />
          <Label className="text-[11px] mt-2 block">Rótulo do botão de vídeo</Label>
          <Input value={layout.botao_video_texto} onChange={(e) => upd("botao_video_texto", e.target.value)} />
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-3">Textos</h3>
          <Label className="text-[11px]">Rótulo acima do título (topo)</Label>
          <Input value={layout.hero_kicker ?? ""} onChange={(e) => upd("hero_kicker", e.target.value)} placeholder="Catálogo" />
          <Label className="text-[11px] mt-2 block">Título do topo</Label>
          <Input value={layout.hero_titulo ?? ""} onChange={(e) => upd("hero_titulo", e.target.value)} placeholder="Genética Nelore de Elite" />
          <Label className="text-[11px] mt-2 block">Subtítulo do topo</Label>
          <Textarea rows={2} value={layout.hero_subtitulo ?? ""} onChange={(e) => upd("hero_subtitulo", e.target.value)} placeholder="Animais selecionados para o melhoramento do seu rebanho." />
          <p className="text-[11px] text-muted-foreground mt-1">Exibido quando nenhum evento ativo estiver selecionado.</p>
          <Label className="text-[11px] mt-2 block">Contador (singular)</Label>

          <Input value={layout.texto_contador_singular} onChange={(e) => upd("texto_contador_singular", e.target.value)} />
          <Label className="text-[11px] mt-2 block">Contador (plural)</Label>
          <Input value={layout.texto_contador_plural} onChange={(e) => upd("texto_contador_plural", e.target.value)} />
          <Label className="text-[11px] mt-2 block">Título "Sobre"</Label>
          <Input value={layout.texto_sobre_titulo} onChange={(e) => upd("texto_sobre_titulo", e.target.value)} />
          <Label className="text-[11px] mt-2 block">Texto "Sobre"</Label>
          <Textarea rows={4} value={layout.texto_sobre_corpo} onChange={(e) => upd("texto_sobre_corpo", e.target.value)} />
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-3">Cores (HSL)</h3>
          <div className="space-y-3">
            <ColorField label="Primária" value={layout.cor_primary} onChange={(v) => upd("cor_primary", v)} />
            <ColorField label="Destaque" value={layout.cor_accent ?? LAYOUT_PADRAO.cor_accent ?? "358 92% 42%"} onChange={(v) => upd("cor_accent", v)} />
            <ColorField label="Fundo" value={layout.cor_bg} onChange={(v) => upd("cor_bg", v)} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Escolha visualmente — convertemos automaticamente para HSL/RGB.
          </p>
        </div>

        <div className="flex gap-2 pt-2 border-t sticky bottom-0 bg-surface -mx-4 px-4 pb-1">
          <Button variant="outline" size="sm" onClick={() => setLayout(LAYOUT_PADRAO)}>Restaurar padrão</Button>
          <Button size="sm" className="flex-1" onClick={() => salvar.mutate({ layout })} disabled={salvar.isPending}>
            {salvar.isPending ? "Salvando..." : "Salvar layout"}
          </Button>
        </div>
      </div>

      <div className="bg-surface rounded-lg border flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-2 border-b bg-muted/30">
          <div className="inline-flex rounded-md border overflow-hidden">
            {(["desktop", "tablet", "mobile"] as Device[]).map((d) => {
              const Icon = d === "desktop" ? Monitor : d === "tablet" ? Tablet : Smartphone;
              return (
                <button key={d} onClick={() => setDevice(d)} className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${device === d ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                  <Icon className="h-3.5 w-3.5" /> {d}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setReady(false); iframeRef.current?.contentWindow?.location.reload(); }}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
              <a href="/catalogo" target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-muted/40 p-4 flex items-start justify-center">
          <div className="bg-white shadow-2xl transition-all" style={{ width: WIDTHS[device], maxWidth: "100%" }}>
            <iframe
              ref={iframeRef}
              src="/catalogo?preview=layout"
              title="Prévia do catálogo"
              className="w-full border-0"
              style={{ height: "calc(100vh - 240px)", minHeight: 600 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label className="text-xs font-normal">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}