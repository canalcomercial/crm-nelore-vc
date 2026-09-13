import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAGE_TOKEN = Deno.env.get("META_PAGE_ACCESS_TOKEN");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function buscarFunilPadrao(): Promise<{ id: string; etapa: string } | null> {
  const { data } = await supabase
    .from("funis").select("id, etapas").eq("ativo", true).order("ordem").limit(1).single();
  if (!data) return null;
  const etapas = data.etapas as string[];
  return { id: data.id, etapa: etapas?.[0] ?? "Novo" };
}

async function buscarDetalhesLeadMeta(leadgen_id: string) {
  if (!PAGE_TOKEN) return null;
  const url = `https://graph.facebook.com/v21.0/${leadgen_id}?access_token=${PAGE_TOKEN}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    console.error("Falha ao buscar lead na Graph API:", resp.status, await resp.text());
    return null;
  }
  return await resp.json();
}

function extrairCampoPadrao(field_data: { name: string; values: string[] }[], nomes: string[]) {
  for (const nome of nomes) {
    const f = field_data.find((x) => x.name?.toLowerCase().includes(nome));
    if (f && f.values?.[0]) return f.values[0];
  }
  return null;
}

export async function processarLeadgen(value: {
  leadgen_id: string;
  form_id?: string;
}): Promise<{ status: string; lead_id: string | null; erro: string | null }> {
  const leadgen_id = value.leadgen_id;
  const form_id = value.form_id ?? null;
  if (!leadgen_id) return { status: "erro", lead_id: null, erro: "leadgen_id ausente" };

  let formCfg: any = null;
  if (form_id) {
    const { data } = await supabase
      .from("meta_formularios").select("*").eq("form_id", form_id).maybeSingle();
    formCfg = data;
  }

  const detalhes = await buscarDetalhesLeadMeta(leadgen_id);
  const field_data: { name: string; values: string[] }[] = detalhes?.field_data ?? [];

  const mapa: Record<string, string> = (formCfg?.mapa_campos ?? {}) as any;
  const camposMapeados: Record<string, string | null> = {};
  const campos_extras: Record<string, string> = {};

  for (const f of field_data) {
    const val = (f.values ?? []).join(", ");
    const destino = mapa[f.name];
    if (!destino) continue;
    if (destino.startsWith("extra:")) campos_extras[destino.slice(6)] = val;
    else camposMapeados[destino] = val;
  }

  const nome = camposMapeados.nome ?? extrairCampoPadrao(field_data, ["full_name", "nome", "name"]) ?? "Lead Meta";
  const telefone = camposMapeados.telefone ?? extrairCampoPadrao(field_data, ["phone", "telefone"]);
  const email = camposMapeados.email ?? extrairCampoPadrao(field_data, ["email"]);
  const cidade = camposMapeados.cidade ?? extrairCampoPadrao(field_data, ["city", "cidade"]);
  const estado = camposMapeados.estado ?? extrairCampoPadrao(field_data, ["state", "estado"]);

  const camposUsados = new Set(Object.keys(mapa));
  const camposPadrao = new Set([
    "full_name", "nome", "name", "phone", "telefone", "email",
    "city", "cidade", "state", "estado",
  ]);
  const respostas_formulario = field_data
    .filter((f) => !camposUsados.has(f.name) && !camposPadrao.has(f.name?.toLowerCase()))
    .map((f) => ({
      pergunta: f.name?.replace(/_/g, " ") ?? "Pergunta",
      resposta: (f.values ?? []).join(", "),
    }));

  let funil_id: string | null = formCfg?.funil_id ?? null;
  let etapa: string | null = formCfg?.etapa ?? null;
  const responsavel_id: string | null = formCfg?.responsavel_id ?? null;

  if (!funil_id) {
    const fp = await buscarFunilPadrao();
    funil_id = fp?.id ?? null;
    etapa = etapa ?? fp?.etapa ?? null;
  }

  const lead_payload: any = {
    nome, telefone, cidade, estado,
    origem: "Meta Ads",
    tipo_cliente: "Lead",
    observacoes: email ? `Email: ${email}` : null,
    funil_id, etapa, responsavel_id,
    meta_lead_id: leadgen_id,
    meta_form_id: form_id,
    meta_form_nome: formCfg?.form_nome ?? detalhes?.form_name ?? null,
    respostas_formulario,
    campos_extras,
  };

  const { data: leadRow, error } = await supabase
    .from("leads")
    .upsert(lead_payload, { onConflict: "meta_lead_id", ignoreDuplicates: false })
    .select("id").single();

  if (error) {
    console.error("Erro ao salvar lead:", error);
    return { status: "erro", lead_id: null, erro: error.message };
  }
  return {
    status: formCfg ? "processado" : "ignorado",
    lead_id: leadRow?.id ?? null,
    erro: null,
  };
}

export async function logarEvento(v: any, result: { status: string; lead_id: string | null; erro: string | null }) {
  await supabase.from("meta_eventos_log").insert({
    leadgen_id: v.leadgen_id,
    form_id: v.form_id ?? null,
    payload: v,
    status: result.status,
    lead_id: result.lead_id,
    erro: result.erro,
  });
}