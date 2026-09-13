import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { z } from "https://esm.sh/zod@3.23.8";

const BodySchema = z.object({
  slug: z.string().min(1).max(100),
  respostas: z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
});

type Campo = {
  key: string;
  label: string;
  tipo: "texto" | "email" | "telefone" | "numero" | "selecao" | "textarea";
  obrigatorio: boolean;
  opcoes?: string[];
  mapeamento?: "nome" | "telefone" | "email" | "cidade" | "estado" | "fazenda" | "tipo_cliente" | "interesse" | "observacoes" | string | null;
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos", detalhes: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { slug, respostas } = parsed.data;

    const { data: form, error: formErr } = await supabase
      .from("formularios")
      .select("*")
      .eq("slug", slug)
      .eq("ativo", true)
      .maybeSingle();

    if (formErr) throw formErr;
    if (!form) {
      return new Response(JSON.stringify({ error: "Formulário não encontrado ou inativo" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const campos: Campo[] = Array.isArray(form.campos) ? form.campos : [];

    // Validar obrigatórios
    for (const c of campos) {
      if (c.obrigatorio) {
        const v = respostas[c.key];
        if (v === undefined || v === null || String(v).trim() === "") {
          return new Response(
            JSON.stringify({ error: `Campo obrigatório não preenchido: ${c.label}` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    // Mapear respostas para colunas do lead
    const lead: Record<string, unknown> = {
      nome: "Sem nome",
      origem: `formulario:${slug}`,
      funil_id: form.funil_id,
      etapa: form.etapa,
      responsavel_id: form.responsavel_id,
      arquivado: !form.funil_id, // sem funil → vai para o banco
      arquivado_em: form.funil_id ? null : new Date().toISOString(),
    };
    const campos_extras: Record<string, string | number | null> = {};
    const respostas_formulario: { pergunta: string; resposta: string }[] = [];

    for (const c of campos) {
      const v = respostas[c.key];
      if (v === undefined || v === null || String(v).trim() === "") continue;
      const valorStr = String(v).trim().slice(0, 2000);

      if (c.mapeamento === "nome") lead.nome = valorStr.slice(0, 200);
      else if (c.mapeamento === "telefone") lead.telefone = valorStr.slice(0, 30);
      else if (c.mapeamento === "cidade") lead.cidade = valorStr.slice(0, 120);
      else if (c.mapeamento === "estado") lead.estado = valorStr.slice(0, 30);
      else if (c.mapeamento === "fazenda") lead.fazenda = valorStr.slice(0, 200);
      else if (c.mapeamento === "tipo_cliente") lead.tipo_cliente = valorStr.slice(0, 60);
      else if (c.mapeamento === "interesse") lead.interesse = valorStr.slice(0, 500);
      else if (c.mapeamento === "observacoes") lead.observacoes = valorStr.slice(0, 2000);
      else if (c.mapeamento === "email") campos_extras.email = valorStr.slice(0, 200);
      else if (typeof c.mapeamento === "string" && c.mapeamento.startsWith("attr:")) {
        const chave = c.mapeamento.slice(5);
        if (chave) campos_extras[chave] = valorStr.slice(0, 500);
      }
      else {
        respostas_formulario.push({ pergunta: c.label, resposta: valorStr });
      }
    }

    lead.campos_extras = campos_extras;
    lead.respostas_formulario = respostas_formulario;

    const { error: insertErr } = await supabase.from("leads").insert(lead);
    if (insertErr) throw insertErr;

    await supabase
      .from("formularios")
      .update({ total_respostas: (form.total_respostas ?? 0) + 1 })
      .eq("id", form.id);

    return new Response(JSON.stringify({ ok: true, mensagem: form.mensagem_sucesso }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("submeter-formulario error", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
