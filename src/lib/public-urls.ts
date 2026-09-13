// URL público de produção usada pelos botões "Ver página", QR code e cópia de link.
// Definido em VITE_PUBLIC_SITE_URL para apontar sempre ao domínio publicado,
// independente de onde o admin está sendo acessado. Sem a variável, cai na
// origem atual do navegador (funciona em dev e em qualquer deploy).
const configurada = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();

export const PUBLIC_SITE_URL = (
  configurada || (typeof window !== "undefined" ? window.location.origin : "")
).replace(/\/+$/, "");

export const PAGINA_COMERCIAL_URL = `${PUBLIC_SITE_URL}/nelore-vc`;
