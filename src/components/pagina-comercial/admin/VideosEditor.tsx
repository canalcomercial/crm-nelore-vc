import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  BLOCOS_VIDEO,
  youtubeIdDaUrl,
  type BlocoVideoId,
  type PaginaConteudo,
  type SecaoVideo,
  type VideoItem,
} from "@/hooks/usePaginaComercial";

/**
 * Editor dos blocos de vídeo da página comercial.
 *
 * São dois blocos independentes ("Vídeos 1" e "Vídeos 2"). Cada um vira uma
 * seção que a aba "Seções e botões" pode mover para qualquer ponto da página
 * ou esconder — é assim que o vídeo sai do topo e vai para onde você quiser.
 */
export function VideosEditor({
  conteudo,
  onChange,
}: {
  conteudo: PaginaConteudo;
  onChange: (patch: Partial<PaginaConteudo>) => void;
}) {
  const videos = conteudo.videos ?? {};

  const setBloco = (id: BlocoVideoId, bloco: SecaoVideo) =>
    onChange({ videos: { ...videos, [id]: bloco } });

  return (
    <div className="space-y-8">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Cada bloco vira uma seção da página. Para mudar de lugar (tirar do topo, colocar depois dos
        lotes, entre o Sobre e o evento…), arraste a seção na aba <strong>Seções e botões</strong>.
        O vídeo do topo continua sendo configurado no Hero.
      </p>

      {BLOCOS_VIDEO.map((b) => (
        <BlocoEditor
          key={b.id}
          label={b.label}
          bloco={videos[b.id] ?? { itens: [] }}
          onChange={(v) => setBloco(b.id, v)}
        />
      ))}
    </div>
  );
}

function novoVideo(): VideoItem {
  return {
    id: `v-${Math.random().toString(36).slice(2, 9)}`,
    tipo: "youtube",
    titulo: "",
    video_id: "",
  };
}

function BlocoEditor({
  label,
  bloco,
  onChange,
}: {
  label: string;
  bloco: SecaoVideo;
  onChange: (v: SecaoVideo) => void;
}) {
  const itens = bloco.itens ?? [];

  const setItem = (i: number, patch: Partial<VideoItem>) => {
    const arr = [...itens];
    arr[i] = { ...arr[i], ...patch };
    onChange({ ...bloco, itens: arr });
  };

  const mover = (i: number, delta: number) => {
    const j = i + delta;
    if (j < 0 || j >= itens.length) return;
    const arr = [...itens];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange({ ...bloco, itens: arr });
  };

  return (
    <section className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{label}</h3>
        <Button size="sm" variant="outline" onClick={() => onChange({ ...bloco, itens: [...itens, novoVideo()] })}>
          <Plus className="h-4 w-4 mr-1.5" /> Adicionar vídeo
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Título da seção</Label>
          <Input
            value={bloco.titulo ?? ""}
            onChange={(e) => onChange({ ...bloco, titulo: e.target.value })}
            placeholder="Ex.: Conheça o plantel"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Descrição (opcional)</Label>
          <Input
            value={bloco.descricao ?? ""}
            onChange={(e) => onChange({ ...bloco, descricao: e.target.value })}
            placeholder="Uma linha de apoio"
          />
        </div>
      </div>

      {itens.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum vídeo neste bloco — a seção não aparece na página.
        </p>
      )}

      <div className="space-y-4">
        {itens.map((v, i) => (
          <div key={v.id} className="rounded-md border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Vídeo {i + 1}</span>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => mover(i, -1)} disabled={i === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => mover(i, 1)} disabled={i === itens.length - 1}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={() => onChange({ ...bloco, itens: itens.filter((_, j) => j !== i) })}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-[140px_1fr] gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Origem</Label>
                <Select value={v.tipo} onValueChange={(t) => setItem(i, { tipo: t as VideoItem["tipo"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="arquivo">Arquivo (mp4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {v.tipo === "youtube" ? (
                <div className="space-y-1.5">
                  <Label className="text-xs">Link ou ID do YouTube</Label>
                  <Input
                    value={v.video_id ?? ""}
                    onChange={(e) => setItem(i, { video_id: youtubeIdDaUrl(e.target.value) ?? e.target.value })}
                    placeholder="https://youtu.be/xxxxxxxxxxx"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs">URL do arquivo</Label>
                  <Input
                    value={v.url ?? ""}
                    onChange={(e) => setItem(i, { url: e.target.value })}
                    placeholder="https://.../video.mp4 (use a aba Mídia para subir)"
                  />
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Título do vídeo</Label>
                <Input value={v.titulo ?? ""} onChange={(e) => setItem(i, { titulo: e.target.value })} placeholder="Opcional" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Legenda</Label>
                <Textarea rows={1} value={v.descricao ?? ""} onChange={(e) => setItem(i, { descricao: e.target.value })} placeholder="Opcional" />
              </div>
            </div>

            {v.tipo === "youtube" && (
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={!!v.ao_vivo} onCheckedChange={(c) => setItem(i, { ao_vivo: c })} />
                Marcar como transmissão ao vivo
              </label>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
