import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Input } from "./input";

describe("Input", () => {
  it("mantem o contador padrão e permite oculta-lo sem perder o limite nativo", () => {
    expect(renderToStaticMarkup(<Input maxLength={6} defaultValue="123456" />)).toContain("6 / 6");
    const html = renderToStaticMarkup(
      <Input maxLength={6} showCounter={false} defaultValue="123456" />,
    );
    expect(html).toContain('maxLength="6"');
    expect(html).not.toContain("6 / 6");
    expect(html).not.toContain("showCounter");
  });
});
