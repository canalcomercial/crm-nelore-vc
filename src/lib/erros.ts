/**
 * Extrai uma mensagem legível de qualquer valor lançado num `catch`.
 *
 * Em `catch (e)` o TypeScript tipa `e` como `unknown` — o que é correto, já que
 * JavaScript permite lançar qualquer coisa. Erros do Supabase (PostgrestError,
 * AuthError, StorageError) não herdam de Error, mas têm `message`.
 */
export function mensagemDeErro(erro: unknown, padrao = "Ocorreu um erro inesperado"): string {
  if (typeof erro === "string" && erro.trim() !== "") return erro;

  if (erro instanceof Error && erro.message) return erro.message;

  if (erro && typeof erro === "object" && "message" in erro) {
    const { message } = erro as { message: unknown };
    if (typeof message === "string" && message.trim() !== "") return message;
  }

  return padrao;
}
