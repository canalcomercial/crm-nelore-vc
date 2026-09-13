import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEquipe, useCriarMembro, useAtualizarRole, useToggleAtivo, useExcluirMembro, type MembroEquipe } from "@/hooks/useEquipe";
import type { AppRole } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ShieldCheck, User as UserIcon } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

const novoSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("Email inválido").max(255),
  role: z.enum(["coordenador", "vendedor"]),
  password: z.string().min(6, "Senha mínima de 6 caracteres").max(100),
});

export default function EquipePage() {
  const { user, isCoordenador } = useAuth();
  const { data: membros = [], isLoading } = useEquipe();
  const criar = useCriarMembro();
  const atualizarRole = useAtualizarRole();
  const toggleAtivo = useToggleAtivo();
  const excluir = useExcluirMembro();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", email: "", role: "vendedor" as AppRole, password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [excluirAlvo, setExcluirAlvo] = useState<MembroEquipe | null>(null);

  const onCriar = async () => {
    const parsed = novoSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    await criar.mutateAsync(parsed.data as { nome: string; email: string; role: AppRole; password: string });
    setOpen(false);
    setForm({ nome: "", email: "", role: "vendedor", password: "" });
    setShowPassword(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="h-14 shrink-0 border-b border-border bg-surface flex items-center px-5 gap-4">
        <h1 className="text-base font-semibold tracking-tight">Equipe</h1>
        {isCoordenador && (
          <Button size="sm" className="ml-auto gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Novo membro
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : (
          <div className="grid gap-3 max-w-3xl">
            {membros.map((m) => {
              const isMe = m.id === user?.id;
              const role = m.roles[0] ?? "vendedor";
              return (
                <Card key={m.id} className="p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    {role === "coordenador" ? <ShieldCheck className="h-5 w-5 text-primary" /> : <UserIcon className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{m.nome}</p>
                      {isMe && <Badge variant="secondary" className="text-[10px]">você</Badge>}
                      {!m.ativo && <Badge variant="outline" className="text-[10px]">inativo</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  </div>

                  {isCoordenador ? (
                    <div className="flex items-center gap-2">
                      <Select
                        value={role}
                        onValueChange={(v) => atualizarRole.mutate({ user_id: m.id, role: v as AppRole })}
                        disabled={isMe}
                      >
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vendedor">Vendedor</SelectItem>
                          <SelectItem value="coordenador">Coordenador</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => toggleAtivo.mutate({ id: m.id, ativo: !m.ativo })}
                        disabled={isMe}
                      >
                        {m.ativo ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setExcluirAlvo(m)}
                        disabled={isMe}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="capitalize">{role}</Badge>
                  )}
                </Card>
              );
            })}
            {membros.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum membro cadastrado.</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setShowPassword(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo membro</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Senha inicial</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pr-10"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Compartilhe esta senha com o novo membro. Ele poderá alterá-la depois pelo "Esqueci minha senha".
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Função</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="coordenador">Coordenador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={onCriar} disabled={criar.isPending}>
              {criar.isPending ? "Criando..." : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluirAlvo} onOpenChange={(o) => !o && setExcluirAlvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir membro?</AlertDialogTitle>
            <AlertDialogDescription>
              {excluirAlvo?.nome} perderá o acesso ao CRM. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (excluirAlvo) await excluir.mutateAsync(excluirAlvo.id);
                setExcluirAlvo(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
