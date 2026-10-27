import type { ComponentProps } from "react";

export type InputProps = ComponentProps<"input"> & {
  showCounter?: boolean;
};
