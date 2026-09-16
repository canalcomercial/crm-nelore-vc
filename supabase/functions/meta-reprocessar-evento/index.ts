// Reprocessa um evento do meta_eventos_log rodando o mesmo pipeline do webhook.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processarLeadgen } from "../_shared/meta-processar.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("method not allowed", { status: 405, headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const authClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await authClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claims.claims.sub;
  const adminRole = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: hasRole } = await adminRole.rpc("has_role", {
    _user_id: userId, _role: "coordenador",
  });
  if (!hasRole) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { evento_id } = await req.json();
    if (!evento_id) throw new Error("evento_id obrigatório");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: evento, error: fetchErr } = await admin
      .from("meta_eventos_log")
      .select("*")
      .eq("id", evento_id)
      .single();
    if (fetchErr || !evento) throw new Error("evento não encontrado");

    const result = await processarLeadgen(evento.payload as any);
    await admin.from("meta_eventos_log").insert({
      leadgen_id: evento.leadgen_id,
      form_id: evento.form_id,
      payload: evento.payload,
      status: result.status,
      lead_id: result.lead_id,
      erro: result.erro,
    });

    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});