import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { token, nome, cpf, hash, aceite } = body ?? {};
    if (!token || !nome || !cpf || !aceite) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: contrato, error: fetchErr } = await supabase
      .from('contratos').select('id, status, conteudo_final, numero').eq('token_publico', token).maybeSingle();
    if (fetchErr || !contrato) {
      return new Response(JSON.stringify({ error: 'Contrato não encontrado' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (contrato.status === 'assinado') {
      return new Response(JSON.stringify({ error: 'Contrato já assinado' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? req.headers.get('cf-connecting-ip') ?? 'desconhecido';
    const ua = req.headers.get('user-agent') ?? '';

    const esc = (s: string) => s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const assinadoEm = new Date();
    const dataFmt = assinadoEm.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const nomeSafe = String(nome).slice(0, 200);
    const cpfSafe = String(cpf).slice(0, 20);
    const hashSafe = hash ? String(hash).slice(0, 128) : '';

    const blocoAssinatura = `
<div style="margin-top:32px;padding:16px;border:2px solid #16a34a;border-radius:8px;background:#f0fdf4;font-family:Georgia,serif;">
  <div style="font-weight:bold;color:#15803d;margin-bottom:6px;">✓ CONTRATO ASSINADO ELETRONICAMENTE</div>
  <div style="font-size:12px;line-height:1.6;color:#111;">
    <div><strong>Assinado por:</strong> ${esc(nomeSafe)} — CPF/CNPJ ${esc(cpfSafe)}</div>
    <div><strong>Data/hora:</strong> ${esc(dataFmt)} (horário de Brasília)</div>
    <div><strong>IP:</strong> ${esc(ip)}</div>
    ${hashSafe ? `<div style="font-family:monospace;font-size:10px;word-break:break-all;"><strong>Hash:</strong> ${esc(hashSafe)}</div>` : ''}
    <div style="margin-top:6px;font-size:10px;color:#555;">Assinatura eletrônica com validade jurídica nos termos da MP 2.200-2/2001, art. 10, §2º.</div>
  </div>
</div>`.trim();

    const conteudoAssinado = (contrato.conteudo_final ?? '') + blocoAssinatura;

    const { error: upErr } = await supabase.from('contratos').update({
      status: 'assinado',
      assinatura_nome: nomeSafe,
      assinatura_cpf: cpfSafe,
      assinatura_ip: ip,
      assinatura_user_agent: ua.slice(0, 300),
      assinatura_hash: hashSafe || null,
      assinado_em: assinadoEm.toISOString(),
      conteudo_final: conteudoAssinado,
    }).eq('id', contrato.id);


    if (upErr) throw upErr;

    return new Response(JSON.stringify({ ok: true, ip, assinado_em: new Date().toISOString() }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});