import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Check } from "lucide-react";
import { GOOGLE_FONTS, type GoogleFont, applyGoogleFonts } from "@/lib/google-fonts";
import type { FontConfig } from "@/hooks/usePaginaComercial";

export function GoogleFontsPicker({
  label, value, onChange, sampleText,
}: {
  label: string;
  value: FontConfig | undefined;
  onChange: (v: FontConfig) => void;
  sampleText?: string;
}) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<GoogleFont["category"] | "all">("all");

  // Pré-carrega as fontes visíveis para preview
  const filtered = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return GOOGLE_FONTS.filter((f) =>
      (category === "all" || f.category === category) &&
      (!nq || f.family.toLowerCase().includes(nq))
    ).slice(0, 40);
  }, [q, category]);

  useEffect(() => {
    applyGoogleFonts("picker-preview", filtered.map((f) => ({ family: f.family, weights: [400] })));
  }, [filtered]);

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="border rounded-md">
        <div className="p-2 border-b flex gap-2 items-center">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar fonte..." className="h-8 border-0 shadow-none focus-visible:ring-0 px-1" />
          <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="text-xs bg-background border rounded px-2 py-1">
            <option value="all">Todas</option>
            <option value="sans-serif">Sans</option>
            <option value="serif">Serif</option>
            <option value="display">Display</option>
            <option value="handwriting">Manuscrita</option>
            <option value="monospace">Mono</option>
          </select>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filtered.map((f) => {
            const active = value?.family === f.family;
            return (
              <button
                key={f.family}
                type="button"
                onClick={() => onChange({ family: f.family, weights: value?.family === f.family ? value.weights : [400, 700] })}
                className={`w-full text-left px-3 py-2 flex items-center gap-3 border-b last:border-b-0 hover:bg-muted/50 ${active ? "bg-primary/10" : ""}`}
                style={{ fontFamily: `'${f.family}', ${f.category === "serif" ? "serif" : f.category === "monospace" ? "monospace" : "sans-serif"}` }}
              >
                <span className="flex-1 truncate">
                  <span className="text-lg">{sampleText ?? f.family}</span>
                  <span className="text-[10px] text-muted-foreground ml-2 uppercase tracking-wider">{f.category}</span>
                </span>
                {active && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
          {filtered.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma fonte.</div>}
        </div>
      </div>

      {value && (
        <div className="text-xs text-muted-foreground">
          Selecionada: <span className="font-medium text-foreground">{value.family}</span> ({value.weights.join(", ")})
          <WeightPicker
            font={GOOGLE_FONTS.find((x) => x.family === value.family)}
            selected={value.weights}
            onToggle={(w) => {
              const set = new Set(value.weights);
              if (set.has(w)) set.delete(w); else set.add(w);
              const arr = Array.from(set).sort((a, b) => a - b);
              onChange({ ...value, weights: arr.length ? arr : [400] });
            }}
          />
        </div>
      )}
    </div>
  );
}

function WeightPicker({ font, selected, onToggle }: { font?: GoogleFont; selected: number[]; onToggle: (w: number) => void }) {
  if (!font) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {font.weights.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => onToggle(w)}
          className={`text-[10px] px-2 py-0.5 rounded border ${selected.includes(w) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}
        >
          {w}
        </button>
      ))}
    </div>
  );
}