import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth-context";

export function ProtectedRoute({
  children,
  requireCoordenador = false,
}: {
  children: React.ReactNode;
  requireCoordenador?: boolean;
}) {
  const { user, loading, isCoordenador } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (requireCoordenador && !isCoordenador) return <Navigate to="/" replace />;
  return <>{children}</>;
}
