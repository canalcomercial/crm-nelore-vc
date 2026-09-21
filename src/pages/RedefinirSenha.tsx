import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function RedefinirSenhaPage() {
  const navigate = useNavigate();
  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setPronto(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setPronto(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const salvar = async () => {
    if (senha.length < 6) { toast.error("Senha mínima de 6 caracteres"); return; }
    if (senha !== confirma) { toast.error("As senhas não conferem"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Senha atualizada");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6 space-y-4">
        <h1 className="text-lg font-semibold text-center">Definir nova senha</h1>
        {!pronto ? (
          <p className="text-xs text-muted-foreground text-center">
            Aguarde, validando o link de recuperação...
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <Input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar senha</Label>
              <Input type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} />
            </div>
            <Button className="w-full" onClick={salvar} disabled={busy}>
              {busy ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
