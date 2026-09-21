/** Paleta Nelore VC da ficha do catálogo (a mesma de fêmeas e touros). */
export const VC = {
  preto: "#12171B",
  pretoSuave: "#2A3238",
  vermelho: "#D0100B",
  vermelhoSuave: "#FBE9E8",
  linha: "#D7DBDE",
  caixa: "#F1F2F3",
  cardBg: "#EFF0F1",
  linhaZebra: "#F7F7F8",
  cinzaTexto: "#5B656C",
} as const;

export const FONTE_COR = { pmgz: "#1B6FB5", ancp: "#6FA8DC" } as const;

/** TOP% até 1 é destaque (padrão dos catálogos: marcação amarela/realce). */
export function topDestaque(top?: string): boolean {
  if (!top) return false;
  const n = Number(String(top).replace("%", "").replace(",", "."));
  return Number.isFinite(n) && n <= 1;
}
