// Curated list of popular Google Fonts for the commercial page editor.
// Each entry: family name + supported weights + category.
export type GoogleFont = {
  family: string;
  category: "serif" | "sans-serif" | "display" | "handwriting" | "monospace";
  weights: number[];
};

export const GOOGLE_FONTS: GoogleFont[] = [
  { family: "Inter", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Roboto", category: "sans-serif", weights: [300, 400, 500, 700, 900] },
  { family: "Open Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Lato", category: "sans-serif", weights: [300, 400, 700, 900] },
  { family: "Montserrat", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Poppins", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Nunito", category: "sans-serif", weights: [300, 400, 600, 700, 800, 900] },
  { family: "Raleway", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Work Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "DM Sans", category: "sans-serif", weights: [400, 500, 700] },
  { family: "Manrope", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Plus Jakarta Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Space Grotesk", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Outfit", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Sora", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Karla", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Rubik", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Barlow", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Oswald", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Bebas Neue", category: "display", weights: [400] },
  { family: "Archivo", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "IBM Plex Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Josefin Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Quicksand", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Cabin", category: "sans-serif", weights: [400, 500, 600, 700] },
  { family: "Mulish", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Hind", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Noto Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Fira Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "PT Sans", category: "sans-serif", weights: [400, 700] },
  { family: "Bricolage Grotesque", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Onest", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },

  { family: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  { family: "Fraunces", category: "serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Merriweather", category: "serif", weights: [300, 400, 700, 900] },
  { family: "Lora", category: "serif", weights: [400, 500, 600, 700] },
  { family: "PT Serif", category: "serif", weights: [400, 700] },
  { family: "Cormorant Garamond", category: "serif", weights: [300, 400, 500, 600, 700] },
  { family: "Libre Baskerville", category: "serif", weights: [400, 700] },
  { family: "EB Garamond", category: "serif", weights: [400, 500, 600, 700, 800] },
  { family: "Bitter", category: "serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Crimson Text", category: "serif", weights: [400, 600, 700] },
  { family: "Source Serif Pro", category: "serif", weights: [300, 400, 600, 700, 900] },
  { family: "DM Serif Display", category: "serif", weights: [400] },
  { family: "DM Serif Text", category: "serif", weights: [400] },
  { family: "Instrument Serif", category: "serif", weights: [400] },
  { family: "Noto Serif", category: "serif", weights: [400, 700] },
  { family: "Zilla Slab", category: "serif", weights: [300, 400, 500, 600, 700] },
  { family: "Roboto Slab", category: "serif", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Spectral", category: "serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Cardo", category: "serif", weights: [400, 700] },

  { family: "Abril Fatface", category: "display", weights: [400] },
  { family: "Anton", category: "display", weights: [400] },
  { family: "Righteous", category: "display", weights: [400] },
  { family: "Alfa Slab One", category: "display", weights: [400] },
  { family: "Bungee", category: "display", weights: [400] },
  { family: "Fjalla One", category: "display", weights: [400] },
  { family: "Archivo Black", category: "display", weights: [400] },
  { family: "Black Ops One", category: "display", weights: [400] },
  { family: "Unbounded", category: "display", weights: [300, 400, 500, 600, 700, 800, 900] },
  { family: "Syne", category: "display", weights: [400, 500, 600, 700, 800] },

  { family: "Dancing Script", category: "handwriting", weights: [400, 500, 600, 700] },
  { family: "Pacifico", category: "handwriting", weights: [400] },
  { family: "Caveat", category: "handwriting", weights: [400, 500, 600, 700] },
  { family: "Great Vibes", category: "handwriting", weights: [400] },
  { family: "Sacramento", category: "handwriting", weights: [400] },
  { family: "Kalam", category: "handwriting", weights: [300, 400, 700] },
  { family: "Satisfy", category: "handwriting", weights: [400] },
  { family: "Shadows Into Light", category: "handwriting", weights: [400] },

  { family: "JetBrains Mono", category: "monospace", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Fira Code", category: "monospace", weights: [300, 400, 500, 600, 700] },
  { family: "IBM Plex Mono", category: "monospace", weights: [300, 400, 500, 600, 700] },
  { family: "Space Mono", category: "monospace", weights: [400, 700] },
  { family: "Roboto Mono", category: "monospace", weights: [300, 400, 500, 600, 700] },
];

export function buildGoogleFontsHref(fonts: { family: string; weights: number[] }[]): string {
  const families = fonts
    .filter((f) => f.family)
    .map((f) => {
      const w = (f.weights ?? [400]).filter((x) => Number.isFinite(x)).sort((a, b) => a - b).join(";");
      return `family=${encodeURIComponent(f.family)}:wght@${w || "400"}`;
    })
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

/**
 * Injects a <link rel="stylesheet"> for the requested Google Fonts.
 * Reuses a single tag with data-attr for cheap swapping.
 */
export function applyGoogleFonts(id: string, fonts: { family: string; weights: number[] }[]) {
  if (typeof document === "undefined") return;
  const tagId = `gf-${id}`;
  const href = buildGoogleFontsHref(fonts);
  let link = document.getElementById(tagId) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.id = tagId;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  if (link.href !== href) link.href = href;
}