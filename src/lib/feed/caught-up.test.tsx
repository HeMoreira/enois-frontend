// @vitest-environment jsdom
import { act } from "react";

import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { caughtUpIndex, isDateOrderedTab, newestCreatedAt, useMarkFeedSeen } from "./caught-up";

const mocks = vi.hoisted(() => ({ markSeen: vi.fn() }));
vi.mock("@/lib/api", () => ({ feedApi: { markSeen: mocks.markSeen } }));

const post = (createdAt: string) => ({ createdAt });

describe("divisor 'Você está em dia'", () => {
  const posts = [
    post("2026-10-30T12:00:00Z"),
    post("2026-10-30T10:00:00Z"),
    post("2026-10-29T08:00:00Z"),
  ];

  it("entra antes do primeiro post até o marcador", () => {
    expect(caughtUpIndex(posts, "2026-10-30T10:00:00Z")).toBe(1);
    expect(caughtUpIndex(posts, "2026-10-30T09:00:00Z")).toBe(2);
  });

  it("não entra sem marcador, no topo ou sem post antigo carregado", () => {
    expect(caughtUpIndex(posts, null)).toBe(-1);
    expect(caughtUpIndex(posts, "2026-10-31T00:00:00Z")).toBe(-1);
    expect(caughtUpIndex(posts, "2026-10-01T00:00:00Z")).toBe(-1);
  });

  it("o mais novo não precisa ser o primeiro (feed ranqueado)", () => {
    expect(newestCreatedAt([post("2026-10-29T00:00:00Z"), post("2026-10-30T00:00:00Z")])).toBe(
      "2026-10-30T00:00:00Z",
    );
    expect(newestCreatedAt([])).toBeNull();
  });
});

describe("marcar o feed como visto", () => {
  let callback: IntersectionObserverCallback;
  let root: Root;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.markSeen.mockResolvedValue(undefined);
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          callback = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    root = createRoot(document.createElement("div"));
  });

  afterEach(() => {
    act(() => root.unmount());
    vi.unstubAllGlobals();
  });

  function Feed({ posts, enabled = true }: { posts: { createdAt: string }[]; enabled?: boolean }) {
    const ref = useMarkFeedSeen(posts, enabled);
    return <div ref={ref} />;
  }

  const fire = (isIntersecting: boolean, bottom: number) =>
    act(() =>
      callback(
        [{ isIntersecting, boundingClientRect: { bottom } } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );

  it("só marca quando o primeiro post sai pelo topo, uma vez por visita", () => {
    act(() =>
      root.render(<Feed posts={[post("2026-10-29T00:00:00Z"), post("2026-10-30T00:00:00Z")]} />),
    );

    fire(true, 100);
    fire(false, 900); // saiu por baixo (rolou para cima): não conta
    expect(mocks.markSeen).not.toHaveBeenCalled();

    fire(false, -10);
    fire(false, -20);
    expect(mocks.markSeen).toHaveBeenCalledTimes(1);
    expect(mocks.markSeen).toHaveBeenCalledWith("2026-10-30T00:00:00Z");
  });

  it("aba ranqueada nunca marca", () => {
    act(() => root.render(<Feed posts={[post("2026-10-30T00:00:00Z")]} enabled={false} />));

    fire(false, -10);
    expect(mocks.markSeen).not.toHaveBeenCalled();
  });
});

describe("abas que mexem no marcador", () => {
  it("só as ordenadas por data", () => {
    for (const tab of ["ALL", "UNSEEN", "PROJECTS", "TUTORIALS"] as const) {
      expect(isDateOrderedTab(tab)).toBe(true);
    }
    for (const tab of ["FOR_YOU", "TRENDING", "INTERACTED", "CORPORATE"] as const) {
      expect(isDateOrderedTab(tab)).toBe(false);
    }
  });
});
