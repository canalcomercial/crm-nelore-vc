import { useEffect, useRef, useState } from "react";
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginaConteudo, PaginaTema } from "@/hooks/usePaginaComercial";
import { PAGINA_COMERCIAL_URL } from "@/lib/public-urls";

type Device = "desktop" | "tablet" | "mobile";
const WIDTHS: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 390 };

export function PreviewFrame({ conteudo, tema }: { conteudo: PaginaConteudo; tema: PaginaTema }) {
  const [device, setDevice] = useState<Device>("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  // Envia atualizações via postMessage sempre que draft muda (debounce leve)
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "pagina-comercial:preview", conteudo, tema },
        window.location.origin,
      );
    }, 200);
    return () => clearTimeout(t);
  }, [conteudo, tema, ready]);

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "pagina-comercial:ready") setReady(true);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <div className="flex flex-col h-full">
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
            <a href={PAGINA_COMERCIAL_URL} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-muted/40 p-4 flex items-start justify-center">
        <div className="bg-white shadow-2xl transition-all" style={{ width: WIDTHS[device], maxWidth: "100%" }}>
          <iframe
            ref={iframeRef}
            src="/nelore-vc?preview=draft"
            title="Prévia da página comercial"
            className="w-full border-0"
            style={{ height: "calc(100vh - 200px)", minHeight: 600 }}
          />
        </div>
      </div>
    </div>
  );
}