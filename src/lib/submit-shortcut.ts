/**
 * Ctrl+Enter (Cmd+Enter no Mac) envia o campo. Enter puro continua quebrando linha, e durante a
 * composição de acento (IME/tecla morta) o Enter pertence ao teclado, não ao formulário.
 */
export function isSubmitShortcut(
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "isComposing">,
): boolean {
  return (
    event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.altKey && !event.isComposing
  );
}
