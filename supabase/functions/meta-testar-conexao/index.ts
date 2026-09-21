import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    // --- Autenticação: exige JWT válido e papel de coordenador ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) return json({ ok: false, error: 'unauthorized' }, 401)

    const jwt = authHeader.replace('Bearer ', '')
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(jwt)
    if (claimsErr || !claims?.claims) return json({ ok: false, error: 'unauthorized' }, 401)

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE)
    const { data: hasRole } = await sb.rpc('has_role', {
      _user_id: claims.claims.sub,
      _role: 'coordenador',
    })
    if (!hasRole) return json({ ok: false, error: 'forbidden' }, 403)

    const token = Deno.env.get('META_PAGE_ACCESS_TOKEN')
    if (!token) {
      return json({ ok: false, error: 'META_PAGE_ACCESS_TOKEN não configurado nas secrets' }, 400)
    }

    const resp = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(token)}`,
    )
    const body = await resp.json()
    if (!resp.ok) {
      return json({ ok: false, error: body?.error?.message ?? 'Falha ao consultar Meta' }, resp.status)
    }

    const paginas = (body?.data ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))

    const { data: cfg } = await sb.from('meta_config').select('id').limit(1).maybeSingle()
    if (cfg?.id) {
      await sb.from('meta_config').update({
        verificado_em: new Date().toISOString(),
        paginas_disponiveis: paginas,
      }).eq('id', cfg.id)
    }

    return json({ ok: true, paginas })
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500)
  }
})
