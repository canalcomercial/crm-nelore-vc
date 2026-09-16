// Lista formulários de Lead Ads das páginas conectadas ao token da Meta.
// Requer coordenador autenticado e META_PAGE_ACCESS_TOKEN configurado.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAGE_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
  if (claimsErr || !claims?.claims) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claims.claims.sub;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: hasRole } = await admin.rpc("has_role", {
    _user_id: userId, _role: "coordenador",
  });
  if (!hasRole) {
    return new Response(JSON.stringify({ error: "forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!PAGE_TOKEN) {
    return new Response(JSON.stringify({ error: "META_PAGE_ACCESS_TOKEN não configurado" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 1) Buscar páginas
    const pagesResp = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${PAGE_TOKEN}`,
    );
    if (!pagesResp.ok) {
      const errBody = await pagesResp.text();
      return new Response(JSON.stringify({ error: "meta_error", details: errBody }), {
        status: pagesResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const pages = await pagesResp.json();

    // 2) Para cada página, listar leadgen_forms
    const resultado: Array<{ page_id: string; page_nome: string; forms: any[] }> = [];
    for (const page of pages.data ?? []) {
      const formsResp = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}/leadgen_forms?fields=id,name,status,created_time&access_token=${page.access_token ?? PAGE_TOKEN}`,
      );
      const forms = formsResp.ok ? await formsResp.json() : { data: [] };
      resultado.push({
        page_id: page.id,
        page_nome: page.name,
        forms: forms.data ?? [],
      });
    }

    return new Response(JSON.stringify({ paginas: resultado }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});