// URL público de produção usada pelos botões "Ver página", QR code e cópia de link.
// Definido em VITE_PUBLIC_SITE_URL para apontar sempre ao domínio publicado,
// independente de onde o admin está sendo acessado. Sem a variável, cai na
// origem atual do navegador (funciona em dev e em qualquer deploy).
const configurada = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();

export const PUBLIC_SITE_URL = (
  configurada || (typeof window !== "undefined" ? window.location.origin : "")
).replace(/\/+$/, "");

export const PAGINA_COMERCIAL_URL = `${PUBLIC_SITE_URL}/nelore-vc`;

/**
 * Base das Edge Functions, derivada do projeto Supabase configurado em
 * VITE_SUPABASE_URL. Antes o ref do projeto era chumbado no código, o que fazia
 * o assistente da Meta exibir a URL de webhook de outro projeto.
 */
export const FUNCTIONS_URL = `${(import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/+$/, "")}/functions/v1`;

/** URL que deve ser cadastrada no painel de webhooks da Meta. */
export const META_WEBHOOK_URL = `${FUNCTIONS_URL}/meta-lead-webhook`;
