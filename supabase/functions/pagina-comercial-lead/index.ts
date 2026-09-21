// Edge function pública: recebe leads da Página Comercial Nelore VC
// e cria/atualiza um lead no CRM em tempo real.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BodySchema = z.object({
  nome: z.string().trim().min(1).max(100),
  telefone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  mensagem: z.string().trim().max(600).optional().or(z.literal("")),
  animal_id: z.string().uuid().optional().nullable(),
  animal_nome: z.string().max(200).optional().nullable(),
  animal_lote: z.string().max(50).optional().nullable(),
  evento_id: z.string().uuid().optional().nullable(),
  origem_secao: z.string().max(60).optional().nullable(),
});

function normalizarTelefone(t: string) {
  return t.replace(/\D/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "validation", details: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  const body = parsed.data;
  const telefoneNorm = normalizarTelefone(body.telefone);

  // Buscar config para funil/etapa/responsável padrão
  const { data: config } = await supabase
    .from("pagina_comercial_config")
    .select("funil_id, etapa_inicial, responsavel_padrao_id")
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();

  const interesseTxt = [
    body.animal_lote ? `Lote ${body.animal_lote}` : null,
    body.animal_nome,
    body.origem_secao,
  ].filter(Boolean).join(" — ");

  // Procura lead existente pelo telefone normalizado
  const { data: existente } = await supabase
    .from("leads")
    .select("id, campos_extras")
    .filter("telefone", "ilike", `%${telefoneNorm.slice(-9)}%`)
    .is("deletado_em", null)
    .limit(1)
    .maybeSingle();

  const camposExtras = {
    ...(existente?.campos_extras as Record<string, unknown> ?? {}),
    pagina_comercial: {
      animal_id: body.animal_id ?? null,
      animal_nome: body.animal_nome ?? null,
      animal_lote: body.animal_lote ?? null,
      evento_id: body.evento_id ?? null,
      origem_secao: body.origem_secao ?? null,
      mensagem: body.mensagem ?? null,
      email: body.email ?? null,
      recebido_em: new Date().toISOString(),
    },
  };

  let leadId = existente?.id ?? null;

  if (leadId) {
    await supabase.from("leads").update({
      nome: body.nome,
      telefone: telefoneNorm,
      origem: "pagina_comercial",
      interesse: interesseTxt || null,
      observacoes: body.mensagem || null,
      campos_extras: camposExtras,
      ultimo_contato: new Date().toISOString(),
    }).eq("id", leadId);
  } else {
    const { data: novo, error } = await supabase.from("leads").insert({
      nome: body.nome,
      telefone: telefoneNorm,
      origem: "pagina_comercial",
      interesse: interesseTxt || null,
      observacoes: body.mensagem || null,
      campos_extras: camposExtras,
      funil_id: config?.funil_id ?? null,
      etapa: config?.etapa_inicial ?? null,
      responsavel_id: config?.responsavel_padrao_id ?? null,
    }).select("id").single();
    if (error) {
      console.error("erro criando lead:", error);
      return new Response(JSON.stringify({ error: "db_error", details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    leadId = novo.id;
  }

  // Registra interação
  const linhas = [
    interesseTxt ? `Interesse: ${interesseTxt}` : "Contato via página comercial",
    body.email ? `Email: ${body.email}` : null,
    body.mensagem ? `Mensagem: ${body.mensagem}` : null,
  ].filter(Boolean).join("\n");
  await supabase.from("interacoes").insert({
    lead_id: leadId,
    tipo: "pagina_comercial",
    conteudo: linhas,
  });

  return new Response(JSON.stringify({ ok: true, lead_id: leadId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});