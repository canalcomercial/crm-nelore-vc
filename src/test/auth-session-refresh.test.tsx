import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/hooks/useAuth";
import { useAuth } from "@/hooks/auth-context";

const authMock = vi.hoisted(() => ({
  listener: null as null | ((event: string, session: unknown) => void),
  pauseRoles: false,
  resolveRoles: null as null | ((value: { data: { role: string }[]; error?: Error }) => void),
  session: { user: { id: "coordinator-1" } },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
        authMock.listener = listener;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: async () => ({ data: { session: authMock.session } }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => table === "profiles"
          ? { maybeSingle: async () => ({ data: { id: "coordinator-1", nome: "Coord" } }) }
          : authMock.pauseRoles
            ? new Promise((resolve) => { authMock.resolveRoles = resolve; })
            : Promise.resolve({ data: [{ role: "coordenador" }] }),
      }),
    }),
  },
}));

function AuthState() {
  const { loading, isCoordenador } = useAuth();
  return <div data-testid="auth-state">{loading ? "loading" : isCoordenador ? "ready-coordinator" : "ready-seller"}</div>;
}

describe("AuthProvider", () => {
  it("mantém a tela e o papel do coordenador durante renovação com falha transitória", async () => {
    Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true });
    const client = new QueryClient();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    await act(async () => root.render(
      <QueryClientProvider client={client}>
        <AuthProvider><AuthState /></AuthProvider>
      </QueryClientProvider>,
    ));
    await vi.waitFor(() => expect(container.textContent).toBe("ready-coordinator"));

    authMock.pauseRoles = true;
    await act(async () => {
      authMock.listener?.("TOKEN_REFRESHED", authMock.session);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    await vi.waitFor(() => expect(authMock.resolveRoles).not.toBeNull());
    expect(container.textContent).toBe("ready-coordinator");

    await act(async () => authMock.resolveRoles?.({ data: [], error: new Error("rede indisponível") }));
    expect(container.textContent).toBe("ready-coordinator");
    act(() => root.unmount());
    container.remove();
  });
});
