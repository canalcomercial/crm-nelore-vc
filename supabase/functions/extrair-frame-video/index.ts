// Edge function CRM: obtém frames reais do vídeo para o catálogo.
// Fluxo principal: lê o storyboard/timeline do vídeo e devolve folhas de frames para o app recortar
// e escolher o frame mais nítido no canvas do CRM. Fallback: usa frames diretos somente quando o
// storyboard não está disponível. A função nunca devolve 404 para falha de captura, evitando erro
// fatal no cliente durante processamento em lote.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// deno-lint-ignore-file no-explicit-any
function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return sanitizeVideoId(u.pathname.slice(1));
    if (u.searchParams.get("v")) return sanitizeVideoId(u.searchParams.get("v"));
    if (u.pathname.startsWith("/embed/")) return sanitizeVideoId(u.pathname.split("/")[2]);
    if (u.pathname.startsWith("/shorts/")) return sanitizeVideoId(u.pathname.split("/")[2]);
    if (u.pathname.startsWith("/live/")) return sanitizeVideoId(u.pathname.split("/")[2]);
  } catch { /* ignore */ }
  return null;
}

function sanitizeVideoId(value?: string | null): string | null {
  const id = value?.match(/[A-Za-z0-9_-]{11}/)?.[0] ?? null;
  return id;
}

// Decodifica JPEG minimamente extraindo dimensões via marcadores SOF (0xFFC0..0xFFCF exceto DHT/DAC/DRI).
// Como não temos acesso a canvas em Deno edge, avaliamos "nitidez" por variância de bytes brutos
// do JPEG comprimido: um frame mais detalhado gera arquivo maior e com maior variância no fluxo de dados
// (entropia). Isso é uma aproximação eficiente para escolher entre frames candidatos do MESMO vídeo.
function scoreJpeg(bytes: Uint8Array): number {
  const n = bytes.length;
  if (n < 1024) return 0;
  // Amostra a parte do meio (evita cabeçalho/rodapé JPEG que é comum entre frames)
  const start = Math.floor(n * 0.15);
  const end = Math.floor(n * 0.85);
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  const step = Math.max(1, Math.floor((end - start) / 4000)); // ~4k amostras
  for (let i = start; i < end; i += step) {
    sum += bytes[i];
    sumSq += bytes[i] * bytes[i];
    count++;
  }
  const mean = sum / count;
  const variance = sumSq / count - mean * mean;
  // Tamanho do arquivo também correlaciona com detalhe visual (menos compressível = mais textura/nitidez)
  return variance * Math.log2(n);
}

async function fetchBytes(url: string, minBytes = 4000): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CRM-Nelore-VC/1.0)",
        "Accept": "image/avif,image/webp,image/apng,image/jpeg,image/*,*/*;q=0.8",
        "Referer": "https://www.youtube.com/",
      },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("image")) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    // YouTube devolve placeholder cinza (~2-3KB) quando o frame não existe.
    if (buf.length < minBytes) return null;
    return buf;
  } catch {
    return null;
  }
}

async function fetchFrame(videoId: string, key: string): Promise<Uint8Array | null> {
  const urls = [
    `https://i.ytimg.com/vi/${videoId}/${key}.jpg`,
    `https://img.youtube.com/vi/${videoId}/${key}.jpg`,
  ];
  for (const url of urls) {
    const bytes = await fetchBytes(url, 3500);
    if (bytes) return bytes;
  }
  return null;
}

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function dataUrl(bytes: Uint8Array, mime = "image/jpeg"): string {
  return `data:${mime};base64,${toBase64(bytes)}`;
}

function extractJsonAfterMarker(html: string, marker: string): unknown | null {
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return null;
  const start = html.indexOf("{", markerIndex);
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

type StoryboardSheet = { page: number; data_url: string; bytes: number };

type StoryboardPayload = {
  tile_width: number;
  tile_height: number;
  columns: number;
  rows: number;
  count: number;
  interval_ms: number;
  level: number;
  sheets: StoryboardSheet[];
};

type PlayerResponse = {
  storyboards?: {
    playerStoryboardSpecRenderer?: {
      spec?: unknown;
    };
  };
};

function samplePages(totalPages: number, maxPages = 6): number[] {
  if (totalPages <= maxPages) return Array.from({ length: totalPages }, (_, i) => i);
  const preferredRatios = [0.12, 0.25, 0.4, 0.55, 0.7, 0.85];
  return [...new Set(preferredRatios.map((r) => Math.min(totalPages - 1, Math.max(0, Math.round((totalPages - 1) * r)))))]
    .slice(0, maxPages);
}

async function fetchStoryboard(videoId: string): Promise<StoryboardPayload | null> {
  try {
    const watch = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=pt-BR&gl=BR&bpctr=9999999999&has_verified=1`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
    });
    if (!watch.ok) return null;
    const html = await watch.text();
    const player = extractJsonAfterMarker(html, "ytInitialPlayerResponse") as PlayerResponse | null;
    const spec = player?.storyboards?.playerStoryboardSpecRenderer?.spec;
    if (!spec || typeof spec !== "string") return null;

    const [base, ...rawLevels] = spec.split("|");
    const levels = rawLevels.map((raw, index) => {
      const [w, h, count, columns, rows, interval, name, signature] = raw.split("#");
      return {
        index,
        width: Number(w),
        height: Number(h),
        count: Number(count),
        columns: Number(columns),
        rows: Number(rows),
        intervalMs: Number(interval),
        name,
        signature,
      };
    }).filter((l) => l.width > 0 && l.height > 0 && l.count > 0 && l.columns > 0 && l.rows > 0 && l.name && l.signature);

    const level = levels.sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];
    if (!level) return null;

    const framesPerSheet = level.columns * level.rows;
    const totalPages = Math.max(1, Math.ceil(level.count / framesPerSheet));
    const pages = samplePages(totalPages);
    const sheets: StoryboardSheet[] = [];

    for (const page of pages) {
      const sheetName = level.name.replace(/\$M/g, String(page));
      const url = base
        .replace(/\$L/g, String(level.index))
        .replace(/\$N/g, sheetName) + `&sigh=${encodeURIComponent(level.signature)}`;
      const bytes = await fetchBytes(url, 5000);
      if (bytes) sheets.push({ page, data_url: dataUrl(bytes), bytes: bytes.length });
    }

    if (sheets.length === 0) return null;
    return {
      tile_width: level.width,
      tile_height: level.height,
      columns: level.columns,
      rows: level.rows,
      count: level.count,
      interval_ms: level.intervalMs,
      level: level.index,
      sheets,
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== "POST") {
      return json({ foto_url: null, error: "Método não permitido" }, 405);
    }

    const { link_video } = await req.json();
    if (!link_video || typeof link_video !== "string") {
      return json({ foto_url: null, error: "link_video obrigatório" }, 400);
    }

    const id = extractYouTubeId(link_video);
    if (!id) {
      return json({ foto_url: null, error: "URL do YouTube inválida" }, 400);
    }

    // Preferência: storyboard/timeline do vídeo. O cliente recorta os tiles e escolhe o melhor frame
    // por nitidez no canvas, evitando depender de thumbnails pré-selecionadas.
    const storyboard = await fetchStoryboard(id);
    if (storyboard) {
      return json({ foto_url: null, source: "storyboard", storyboard });
    }

    // Fallback: frames diretos em pontos fixos do vídeo, quando o storyboard não está disponível.
    const keys = ["hq1", "hq2", "hq3", "mq1", "mq2", "mq3", "1", "2", "3"];
    const frames = await Promise.all(keys.map((k) => fetchFrame(id, k)));
    const candidatos = frames
      .map((bytes, idx) => ({ bytes, key: keys[idx] }))
      .filter((c): c is { bytes: Uint8Array; key: string } => c.bytes !== null);

    if (candidatos.length === 0) {
      return json({ foto_url: null, error: "Não foi possível obter frames do vídeo" });
    }

    // Aplica seletor de nitidez do CRM: prefere frames de maior resolução (hq > mq),
    // depois usa variância/entropia como desempate.
    const resolutionBonus = (k: string) => (k.startsWith("hq") ? 2 : k.startsWith("mq") ? 1 : 0);
    const ranked = candidatos
      .map((c) => ({ ...c, score: scoreJpeg(c.bytes) * (1 + resolutionBonus(c.key)) }))
      .sort((a, b) => b.score - a.score);

    const melhor = ranked[0];
    const fotoUrl = dataUrl(melhor.bytes);

    return json({
      foto_url: fotoUrl,
      source: "direct_frame",
      frame_selecionado: melhor.key,
      scores: ranked.map((r) => ({ frame: r.key, score: Math.round(r.score) })),
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return json({ foto_url: null, error: message });
  }
});