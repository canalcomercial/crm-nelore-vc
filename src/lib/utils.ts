import type { CSSProperties } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * `React.CSSProperties` acrescido de CSS custom properties (`--minha-var`).
 * O tipo do React não aceita chaves arbitrárias, e é assim que aplicamos tema
 * por variável CSS inline sem recorrer a `any`.
 */
export type CSSPropertiesComVars = CSSProperties & Record<`--${string}`, string>;
