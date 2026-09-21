import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado" }, 401);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Não autenticado" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: isCoord } = await admin.rpc("has_role", {
      _user_id: user.id, _role: "coordenador",
    });
    if (!isCoord) return json({ error: "Apenas coordenadores podem criar membros" }, 403);

    const { nome, email, role, password } = await req.json();
    if (!nome || !email || !role || !password) return json({ error: "Dados incompletos" }, 400);
    if (!["coordenador", "vendedor"].includes(role)) return json({ error: "Função inválida" }, 400);
    if (String(password).length < 6) return json({ error: "Senha deve ter pelo menos 6 caracteres" }, 400);

    let userId: string | undefined;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nome, role },
    });

    if (createErr) {
      const msg = createErr.message?.toLowerCase() ?? "";
      const exists = msg.includes("already") || msg.includes("registered") || msg.includes("exist");
      if (exists) return json({ error: "Este email já está cadastrado no sistema" }, 409);
      return json({ error: createErr.message }, 400);
    } else {
      userId = created.user?.id;
    }

    return json({ ok: true, user_id: userId });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
