// Utilitário para gerar capas automáticas a partir de vídeos dos animais.
// - YouTube: chama a edge function `extrair-frame-video`, que obtém o storyboard/timeline do vídeo;
//   o CRM recorta vários frames no canvas e escolhe o mais nítido como capa.
// - Vídeos MP4 diretos: amostra vários frames no browser, calcula score de nitidez local
//   (variância de gradiente) e devolve o frame mais nítido como data URL.
import { supabase } from "@/integrations/supabase/client";

export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return sanitizeYouTubeId(u.pathname.slice(1));
    if (u.searchParams.get("v")) return sanitizeYouTubeId(u.searchParams.get("v"));
    if (u.pathname.startsWith("/embed/")) return sanitizeYouTubeId(u.pathname.split("/")[2]);
    if (u.pathname.startsWith("/shorts/")) return sanitizeYouTubeId(u.pathname.split("/")[2]);
    if (u.pathname.startsWith("/live/")) return sanitizeYouTubeId(u.pathname.split("/")[2]);
  } catch { /* ignore */ }
  return null;
}

function sanitizeYouTubeId(value?: string | null): string | null {
  return value?.match(/[A-Za-z0-9_-]{11}/)?.[0] ?? null;
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

type ExtractFrameResponse = {
  foto_url?: string | null;
  storyboard?: StoryboardPayload;
  error?: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = window.setTimeout(() => reject(new Error("image timeout")), 8000);
    img.onload = () => { window.clearTimeout(timer); resolve(img); };
    img.onerror = () => { window.clearTimeout(timer); reject(new Error("image load error")); };
    img.src = src;
  });
}

// Chama a edge function que extrai um frame REAL do vídeo (não a thumbnail do YT).
async function extractYouTubeFrame(linkVideo: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("extrair-frame-video", {
    body: { link_video: linkVideo },
  });
  if (error) {
    console.error("extrair-frame-video error", error);
    return null;
  }
  const payload = data as ExtractFrameResponse;
  if (payload?.storyboard) return extractBestFrameFromStoryboard(payload.storyboard);
  return payload?.foto_url ?? null;
}

// Calcula um score simples de nitidez usando gradiente por diferença de pixels vizinhos.
function sharpnessScore(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const data = ctx.getImageData(0, 0, w, h).data;
  let total = 0;
  const step = 4 * 4; // amostra 1 em cada 4 pixels para acelerar
  for (let y = 1; y < h - 1; y += 4) {
    for (let x = 1; x < w - 1; x += 4) {
      const i = (y * w + x) * 4;
      const l = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const iR = ((y) * w + (x + 1)) * 4;
      const iD = ((y + 1) * w + x) * 4;
      const lR = (data[iR] + data[iR + 1] + data[iR + 2]) / 3;
      const lD = (data[iD] + data[iD + 1] + data[iD + 2]) / 3;
      total += Math.abs(l - lR) + Math.abs(l - lD);
    }
  }
  return total / ((w * h) / step);
}

function exposureScore(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const data = ctx.getImageData(0, 0, w, h).data;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 64) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    count++;
  }
  const mean = sum / Math.max(1, count);
  // Evita frames muito escuros, estourados ou telas de transição.
  return Math.max(0, 1 - Math.abs(mean - 128) / 128);
}

async function extractBestFrameFromStoryboard(storyboard: StoryboardPayload): Promise<string | null> {
  const tileW = storyboard.tile_width;
  const tileH = storyboard.tile_height;
  if (!tileW || !tileH || !storyboard.sheets?.length) return null;

  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = tileW;
  sampleCanvas.height = tileH;
  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!sampleCtx) return null;

  const outputW = 640;
  const outputH = Math.round((tileH / tileW) * outputW) || 360;
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputW;
  outputCanvas.height = outputH;
  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) return null;

  let bestScore = -1;
  let bestDataUrl: string | null = null;

  for (const sheet of storyboard.sheets) {
    try {
      const img = await loadImage(sheet.data_url);
      const framesPerSheet = storyboard.columns * storyboard.rows;
      const startIndex = sheet.page * framesPerSheet;
      const framesInSheet = Math.min(framesPerSheet, storyboard.count - startIndex);

      for (let index = 0; index < framesInSheet; index++) {
        const col = index % storyboard.columns;
        const row = Math.floor(index / storyboard.columns);
        sampleCtx.clearRect(0, 0, tileW, tileH);
        sampleCtx.drawImage(img, col * tileW, row * tileH, tileW, tileH, 0, 0, tileW, tileH);

        const sharpness = sharpnessScore(sampleCtx, tileW, tileH);
        const exposure = exposureScore(sampleCtx, tileW, tileH);
        const timelineIndex = startIndex + index;
        const middleBias = 1 - Math.abs((timelineIndex + 0.5) / storyboard.count - 0.5) * 0.18;
        const score = sharpness * (0.75 + exposure * 0.25) * middleBias;

        if (score > bestScore) {
          bestScore = score;
          outputCtx.clearRect(0, 0, outputW, outputH);
          outputCtx.imageSmoothingEnabled = true;
          outputCtx.imageSmoothingQuality = "high";
          outputCtx.drawImage(sampleCanvas, 0, 0, outputW, outputH);
          bestDataUrl = outputCanvas.toDataURL("image/jpeg", 0.88);
        }
      }
    } catch (e) {
      console.warn("Falha ao processar storyboard", e);
    }
  }

  return bestDataUrl;
}

// Extrai o melhor frame de um vídeo MP4/WebM direto (fora do YouTube).
// Retorna um data URL JPEG.
export async function extractBestFrameFromVideo(videoUrl: string, samples = 8): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoUrl;

    let done = false;
    const finish = (v: string | null) => { if (done) return; done = true; resolve(v); };

    video.addEventListener("error", () => finish(null));
    video.addEventListener("loadedmetadata", async () => {
      const dur = video.duration;
      if (!isFinite(dur) || dur <= 0) return finish(null);

      const w = 640;
      const h = Math.round((video.videoHeight / video.videoWidth) * w) || 360;
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return finish(null);

      // Amostra frames entre 10% e 90% do vídeo (evita créditos/cortes iniciais/finais)
      const times: number[] = [];
      for (let i = 0; i < samples; i++) {
        times.push(dur * (0.1 + (0.8 * i) / Math.max(1, samples - 1)));
      }

      let bestScore = -1;
      let bestDataUrl: string | null = null;

      for (const t of times) {
        try {
          await new Promise<void>((res, rej) => {
            const onSeeked = () => { video.removeEventListener("seeked", onSeeked); res(); };
            video.addEventListener("seeked", onSeeked, { once: true });
            video.currentTime = Math.min(t, dur - 0.1);
            setTimeout(() => rej(new Error("seek timeout")), 5000);
          });
          ctx.drawImage(video, 0, 0, w, h);
          const score = sharpnessScore(ctx, w, h);
          if (score > bestScore) {
            bestScore = score;
            bestDataUrl = canvas.toDataURL("image/jpeg", 0.85);
          }
        } catch { /* pula frame */ }
      }
      finish(bestDataUrl);
    });
  });
}

export async function generateCoverForVideo(linkVideo: string): Promise<string | null> {
  const ytId = extractYouTubeId(linkVideo);
  if (ytId) return extractYouTubeFrame(linkVideo);
  // MP4/webm direto
  if (/\.(mp4|webm|mov)(\?|$)/i.test(linkVideo)) {
    return extractBestFrameFromVideo(linkVideo);
  }
  return null;
}