import { Radio } from "lucide-react";

export function YouTubeLiveEmbed({
  videoId,
  titulo,
  badge = "AO VIVO",
  className = "",
}: {
  videoId: string;
  titulo?: string;
  badge?: string;
  className?: string;
}) {
  if (!videoId) return null;
  const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`;
  return (
    <div className={`relative w-full h-full ${className}`}>
      <div className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
        <Radio className="h-3 w-3 animate-pulse" /> {badge}
      </div>
      {titulo && (
        <div className="absolute bottom-3 left-3 right-3 z-10 text-white text-sm font-medium bg-black/50 backdrop-blur-sm rounded-md px-3 py-2">
          {titulo}
        </div>
      )}
      <iframe
        src={src}
        title={titulo ?? "Transmissão ao vivo"}
        className="w-full h-full"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}