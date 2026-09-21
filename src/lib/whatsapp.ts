/**
 * Utilitários para abrir conversas no WhatsApp a partir de qualquer ponto do CRM.
 *
 * Centraliza a formatação do número e das mensagens padrão de interesse/proposta,
 * garantindo consistência entre catálogo, página comercial e ficha do animal.
 */

export function whatsappUrl(numero: string, mensagem?: string) {
  const n = numero.replace(/\D/g, "");
  if (!n) return null;
  const base = `https://wa.me/${n}`;
  const msg = mensagem?.trim();
  return msg ? `${base}?text=${encodeURIComponent(msg)}` : base;
}

export function abrirWhatsApp(numero: string, mensagem?: string) {
  const url = whatsappUrl(numero, mensagem);
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export function msgInteresseAnimal(animal: { nome: string; lote?: string | null }) {
  return `Tenho interesse no ${animal.nome}${animal.lote ? ` — Lote ${animal.lote}` : ""}.`;
}

export function msgPropostaAnimal(animal: { nome: string; lote?: string | null }) {
  return `Olá! Tenho interesse no ${animal.nome}${animal.lote ? ` — Lote ${animal.lote}` : ""} e gostaria de fazer uma proposta.`;
}

export const MSG_PADRAO_PAGINA_COMERCIAL = "Olá! Vim pela página comercial da Nelore VC.";
