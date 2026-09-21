// Webhook público Meta Lead Ads.
//
// Segurança: a Meta assina cada entrega com HMAC-SHA256 do corpo bruto usando o
// App Secret, no header `X-Hub-Signature-256`. Sem conferir essa assinatura,
// qualquer pessoa que descobrisse esta URL poderia injetar leads falsos no CRM.
// Por isso a verificação é obrigatória e falha fechada: sem META_APP_SECRET
// configurado, nenhum POST é aceito.
import { processarLeadgen, logarEvento } from "../_shared/meta-processar.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN");
const APP_SECRET = Deno.env.get("META_APP_SECRET");

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Comparação em tempo constante, para não vazar a assinatura por timing. */
function comparaSeguro(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function assinaturaValida(corpoBruto: string, header: string | null): Promise<boolean> {
  if (!APP_SECRET || !header) return false;
  const [algo, recebida] = header.split("=");
  if (algo !== "sha256" || !recebida) return false;

  const enc = new TextEncoder();
  const chave = await crypto.subtle.importKey(
    "raw",
    enc.encode(APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assinado = await crypto.subtle.sign("HMAC", chave, enc.encode(corpoBruto));
  const calculada = Array.from(new Uint8Array(assinado))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return comparaSeguro(calculada, recebida.trim().toLowerCase());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Handshake de verificação da Meta.
  if (req.method === "GET") {
    if (!VERIFY_TOKEN) {
      console.error("META_VERIFY_TOKEN não configurado: handshake recusado.");
      return new Response("forbidden", { status: 403 });
    }
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token && comparaSeguro(token, VERIFY_TOKEN)) {
      return new Response(challenge ?? "", { status: 200 });
    }
    return new Response("forbidden", { status: 403 });
  }

  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });

  if (!APP_SECRET) {
    console.error("META_APP_SECRET não configurado: entrega recusada sem verificação.");
    return json({ error: "webhook não configurado" }, 503);
  }

  // O corpo precisa ser lido bruto: o HMAC é sobre os bytes exatos enviados.
  const corpoBruto = await req.text();
  if (!(await assinaturaValida(corpoBruto, req.headers.get("x-hub-signature-256")))) {
    console.warn("Assinatura inválida no webhook da Meta; entrega descartada.");
    return json({ error: "assinatura inválida" }, 401);
  }

  try {
    const body = JSON.parse(corpoBruto);

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field !== "leadgen") continue;
        const v = change.value ?? {};
        const result = await processarLeadgen(v);
        await logarEvento(v, result);
      }
    }

    return json({ ok: true });
  } catch (err) {
    console.error("Erro no webhook Meta:", err);
    return json({ error: String(err) }, 500);
  }
});
