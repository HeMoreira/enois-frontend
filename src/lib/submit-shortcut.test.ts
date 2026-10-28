import { describe, expect, it } from "vitest";

import { isSubmitShortcut } from "./submit-shortcut";

const key = (overrides: Partial<Parameters<typeof isSubmitShortcut>[0]> = {}) => ({
  key: "Enter",
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  isComposing: false,
  ...overrides,
});

describe("isSubmitShortcut", () => {
  it("envia com Ctrl+Enter e com Cmd+Enter", () => {
    expect(isSubmitShortcut(key({ ctrlKey: true }))).toBe(true);
    expect(isSubmitShortcut(key({ metaKey: true }))).toBe(true);
  });

  it("não envia com Enter puro (quebra linha)", () => {
    expect(isSubmitShortcut(key())).toBe(false);
    expect(isSubmitShortcut(key({ key: "a", ctrlKey: true }))).toBe(false);
  });

  it("não envia durante a composição de acento", () => {
    expect(isSubmitShortcut(key({ ctrlKey: true, isComposing: true }))).toBe(false);
  });
});
