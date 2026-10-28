import type { ComponentPropsWithoutRef } from "react";

export type Props = Pick<
  ComponentPropsWithoutRef<"textarea">,
  "placeholder" | "className" | "maxLength" | "rows"
> & {
  value: string;
  onChange: (value: string, mentionedUserIds: string[]) => void;
  /** Mostra a barra de formatacao (negrito, lista, citacao...) acima do campo. */
  toolbar?: boolean;
  /** Imagens coladas no campo (Ctrl+V): o dono do campo decide subir e anexar. */
  onPasteImages?: (files: File[]) => void;
  /** Ctrl+Enter (Cmd+Enter no Mac): o dono do campo decide o que é "enviar". Sem ela, não há atalho. */
  onSubmitShortcut?: () => void;
};
