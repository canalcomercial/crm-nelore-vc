import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ImageIcon, Video, Radio, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MediaLibrary } from "./MediaLibrary";
import type { HeroMidia } from "@/hooks/usePaginaComercial";
import { useState } from "react";

const TIPOS: { key: HeroMidia["tipo"]; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "imagem", label: "Imagem", icon: ImageIcon },
  { key: "video_arquivo", label: "Vídeo (arquivo)", icon: Video },
  { key: "youtube_live", label: "YouTube ao vivo", icon: Radio },
];

export function HeroMidiaEditor({
  value, onChange,
}: {
  value: HeroMidia | undefined;
  onChange: (v: HeroMidia) => void;
}) {
  const v: HeroMidia = value ?? { tipo: "imagem" };
  const [libOpen, setLibOpen] = useState(false);

  return (
    <div className="space-y-3 border rounded-lg p-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Mídia da Hero</Label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {TIPOS.map((t) => {
          const active = v.tipo === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange({ ...v, tipo: t.key })}
              className={`border rounded-md p-2 text-xs flex flex-col items-center gap-1 transition-colors ${
                active ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {v.tipo === "imagem" && (
        <div className="space-y-2">
          <Label className="text-xs">URL da imagem</Label>
          <div className="flex gap-2">
            <Input value={v.url ?? ""} onChange={(e) => onChange({ ...v, url: e.target.value })} placeholder="https://..." />
            <Dialog open={libOpen} onOpenChange={setLibOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm">Biblioteca</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Escolher imagem</DialogTitle></DialogHeader>
                <MediaLibrary filter="imagem" onPick={(it) => { onChange({ ...v, url: it.url }); setLibOpen(false); }} />
              </DialogContent>
            </Dialog>
          </div>
          {v.url && <img src={v.url} alt="" className="w-full h-40 object-cover rounded-md border" />}
        </div>
      )}

      {v.tipo === "video_arquivo" && (
        <div className="space-y-2">
          <Label className="text-xs">URL do vídeo (.mp4/.webm)</Label>
          <div className="flex gap-2">
            <Input value={v.url ?? ""} onChange={(e) => onChange({ ...v, url: e.target.value })} placeholder="https://..." />
            <Dialog open={libOpen} onOpenChange={setLibOpen}>
              <DialogTrigger asChild><Button variant="outline" size="sm">Biblioteca</Button></DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>Escolher vídeo</DialogTitle></DialogHeader>
                <MediaLibrary filter="video" onPick={(it) => { onChange({ ...v, url: it.url }); setLibOpen(false); }} />
              </DialogContent>
            </Dialog>
          </div>
          <Label className="text-xs">Poster (imagem de capa, opcional)</Label>
          <Input value={v.poster ?? ""} onChange={(e) => onChange({ ...v, poster: e.target.value })} placeholder="https://..." />
          {v.url && <video src={v.url} poster={v.poster} controls className="w-full h-48 rounded-md border bg-black" />}
        </div>
      )}

      {v.tipo === "youtube_live" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-md bg-red-500/10 border border-red-500/30">
            <Switch checked={v.ativo ?? false} onCheckedChange={(x) => onChange({ ...v, ativo: x })} />
            <div className="flex-1">
              <div className="text-sm font-medium">Transmissão ao vivo ativa</div>
              <div className="text-xs text-muted-foreground">Quando ativa, substitui a imagem da Hero pelo player do YouTube.</div>
            </div>
          </div>
          <div>
            <Label className="text-xs">ID do vídeo do YouTube</Label>
            <Input value={v.video_id ?? ""} onChange={(e) => onChange({ ...v, video_id: extractYoutubeId(e.target.value) })} placeholder="dQw4w9WgXcQ ou URL completa" />
            <p className="text-[11px] text-muted-foreground mt-1">Cole o ID (11 chars) ou a URL completa; extraímos automaticamente.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Texto do badge</Label>
              <Input value={v.badge_texto ?? "AO VIVO"} onChange={(e) => onChange({ ...v, badge_texto: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Título/legenda</Label>
              <Input value={v.titulo_live ?? ""} onChange={(e) => onChange({ ...v, titulo_live: e.target.value })} placeholder="Leilão Nelore VC 2026" />
            </div>
          </div>
        </div>
      )}

      {v.url && (
        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onChange({ ...v, url: undefined, poster: undefined })}>
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Limpar mídia
        </Button>
      )}
    </div>
  );
}

function extractYoutubeId(input: string): string {
  const s = input.trim();
  if (!s) return "";
  if (s.length === 11 && !s.includes("/")) return s;
  const m = s.match(/(?:v=|\/live\/|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m?.[1] ?? s;
}