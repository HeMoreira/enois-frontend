// @vitest-environment jsdom
import { act } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { StreakCardProps } from "@rede-enois/design-system/domain";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StreakBadge } from "./streak-badge";

const mocks = vi.hoisted(() => ({ me: vi.fn(), view: null as StreakCardProps | null }));

vi.mock("@/lib/api", () => ({ streakApi: { me: mocks.me } }));
vi.mock("@rede-enois/design-system/domain", () => ({
  StreakCard: (props: StreakCardProps) => {
    mocks.view = props;
    return <span data-streak />;
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const flush = () =>
  act(async () => {
    for (let i = 0; i < 3; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe("sequência no cabeçalho", () => {
  let root: Root;
  let host: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.view = null;
    host = document.createElement("div");
    root = createRoot(host);
  });

  afterEach(() => act(() => root.unmount()));

  const mount = async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    act(() =>
      root.render(
        <QueryClientProvider client={client}>
          <StreakBadge />
        </QueryClientProvider>,
      ),
    );
    await flush();
  };

  it("mostra a versão compacta com o objeto da API e o dia de hoje", async () => {
    const streak = {
      currentDays: 4,
      longestDays: 9,
      todayDone: true,
      freezesAvailable: 1,
      lastFrozenDay: null,
    };
    mocks.me.mockResolvedValue(streak);
    await mount();

    expect(mocks.view?.variant).toBe("compact");
    expect(mocks.view?.streak).toEqual(streak);
    expect(mocks.view?.today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("com erro, o cabeçalho fica como estava", async () => {
    mocks.me.mockRejectedValue(new Error("offline"));
    await mount();

    expect(host.querySelector("[data-streak]")).toBeNull();
  });
});
