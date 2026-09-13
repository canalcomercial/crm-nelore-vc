// Edge function pública: recebe propostas do catálogo público
// e cria/atualiza lead + registra interação + salva registro em `propostas`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const BodySchema = z.object({
  nome: z.string().trim().min(1).max(100),
  telefone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  valor_ofertado: z.number().nonnegative().max(1_000_000_000).optional().nullable(),
  parcelas: z.number().int().min(1).max(240).optional().nullable(),
  mensagem: z.string().trim().max(1000).optional().or(z.literal("")),
  animal_id: z.string().uuid(),
});

const norm = (t: string) => t.replace(/\D/g, "");
const fmtBRL = (v?: number | null) =>
  v == null ? "-" : v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

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
    return new Response(JSON.stringify({ error: "invalid_json" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const parsed = BodySchema.safeParse(payload);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "validation", details: parsed.error.flatten().fieldErrors }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const body = parsed.data;
  const telefone = norm(body.telefone);

  const { data: animal, error: animalError } = await supabase
    .from("animais")
    .select("id, nome, lote, categoria, raca, preco_total")
    .eq("id", body.animal_id)
    .maybeSingle();
  if (animalError) {
    console.error("erro buscando animal:", animalError);
    return new Response(JSON.stringify({ error: "animal_lookup_error", details: animalError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!animal) {
    return new Response(JSON.stringify({ error: "animal_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const { data: config } = await supabase
    .from("pagina_comercial_config")
    .select("funil_id, etapa_inicial, responsavel_padrao_id")
    .eq("ativo", true)
    .limit(1)
    .maybeSingle();

  const linhagemTxt = [animal.raca, animal.categoria].filter(Boolean).join(" · ");
  const interesse = [
    `Proposta — Lote ${animal.lote ?? "-"} · ${animal.nome}`,
    linhagemTxt ? `(${linhagemTxt})` : null,
  ].filter(Boolean).join(" ");
  const resumo = [
    body.valor_ofertado ? `Valor ofertado: ${fmtBRL(body.valor_ofertado)}` : null,
    body.parcelas ? `Parcelas: ${body.parcelas}x` : null,
    body.mensagem ? `Mensagem: ${body.mensagem}` : null,
  ].filter(Boolean).join("\n");

  const { data: existente } = await supabase
    .from("leads")
    .select("id, campos_extras, funil_id, etapa")
    .filter("telefone", "ilike", `%${telefone.slice(-9)}%`)
    .is("deletado_em", null)
    .limit(1)
    .maybeSingle();

  const campos_extras = {
    ...(existente?.campos_extras as Record<string, unknown> ?? {}),
    ...(body.email ? { email: body.email } : {}),
    ultima_proposta: {
      animal_id: animal.id,
      animal_nome: animal.nome,
      animal_lote: animal.lote,
      animal_categoria: animal.categoria ?? null,
      animal_raca: animal.raca ?? null,
      animal_preco: (animal as { preco_total?: number | null }).preco_total ?? null,
      valor_ofertado: body.valor_ofertado ?? null,
      parcelas: body.parcelas ?? null,
      mensagem: body.mensagem ?? null,
      email: body.email ?? null,
      recebido_em: new Date().toISOString(),
    },
  };

  let leadId = existente?.id ?? null;
  if (leadId) {
    const patch: Record<string, unknown> = {
      nome: body.nome, telefone, origem: "catalogo_proposta",
      interesse, observacoes: resumo || null, campos_extras,
      ultimo_contato: new Date().toISOString(),
    };
    // Só define funil/etapa se o lead ainda não estiver em um funil
    if (!existente?.funil_id && config?.funil_id) patch.funil_id = config.funil_id;
    if (!existente?.etapa && config?.etapa_inicial) patch.etapa = config.etapa_inicial;
    await supabase.from("leads").update(patch).eq("id", leadId);
  } else {
    const { data: novo, error } = await supabase.from("leads").insert({
      nome: body.nome, telefone, origem: "catalogo_proposta",
      interesse, observacoes: resumo || null, campos_extras,
      funil_id: config?.funil_id ?? null,
      etapa: config?.etapa_inicial ?? null,
      responsavel_id: config?.responsavel_padrao_id ?? null,
    }).select("id").single();
    if (error) {
      console.error("erro criando lead:", error);
      return new Response(JSON.stringify({ error: "db_error", details: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    leadId = novo.id;
  }

  await supabase.from("propostas").insert({
    animal_id: animal.id,
    nome: body.nome,
    telefone,
    email: body.email || null,
    valor_ofertado: body.valor_ofertado ?? null,
    parcelas: body.parcelas ?? null,
    mensagem: body.mensagem || null,
    lead_id: leadId,
  });

  await supabase.from("interacoes").insert({
    lead_id: leadId,
    tipo: "proposta",
    conteudo: `${interesse}\n${resumo}`.trim(),
  });

  return new Response(JSON.stringify({ ok: true, lead_id: leadId }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});