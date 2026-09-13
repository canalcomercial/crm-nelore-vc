import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import logoNelore from "@/assets/logo-nelore-vc.png";

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  password: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

export default function AuthPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [recOpen, setRecOpen] = useState(false);
  const [recEmail, setRecEmail] = useState("");
  const [recBusy, setRecBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
    setSubmitting(true);
    const { error } = await signIn(parsed.data.email, parsed.data.password);
    setSubmitting(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "Email ou senha incorretos" : error.message);
      return;
    }
    navigate("/", { replace: true });
  };

  const enviarRecuperacao = async () => {
    const r = z.string().email().safeParse(recEmail.trim());
    if (!r.success) { toast.error("Email inválido"); return; }
    setRecBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(r.data, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setRecBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Se este email estiver cadastrado, você receberá um link para redefinir a senha.");
    setRecOpen(false);
    setRecEmail("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm p-6 space-y-5">
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-full overflow-hidden bg-white ring-1 ring-border">
            <img src={logoNelore} alt="Nelore VC" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          </div>
          <div className="text-center">
            <h1 className="text-lg font-semibold">CRM Nelore VC</h1>
            <p className="text-sm text-muted-foreground">Entre com seu email e senha</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </Button>
          <button
            type="button"
            onClick={() => { setRecEmail(email); setRecOpen(true); }}
            className="block w-full text-center text-xs text-primary hover:underline mt-1"
          >
            Esqueci minha senha
          </button>
        </form>
        <p className="text-xs text-muted-foreground text-center">
          Apenas o coordenador pode criar novas contas.
        </p>
      </Card>

      <Dialog open={recOpen} onOpenChange={setRecOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Email cadastrado</Label>
            <Input type="email" value={recEmail} onChange={(e) => setRecEmail(e.target.value)} placeholder="seu@email.com" />
            <p className="text-[11px] text-muted-foreground">
              Enviaremos um link para você definir uma nova senha.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecOpen(false)}>Cancelar</Button>
            <Button onClick={enviarRecuperacao} disabled={recBusy}>
              {recBusy ? "Enviando..." : "Enviar link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
