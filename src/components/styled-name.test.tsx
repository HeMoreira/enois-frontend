import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StyledName } from "./styled-name";

describe("StyledName", () => {
  it("renders only the name when the profile has no customization", () => {
    expect(renderToStaticMarkup(<StyledName name="Mel" />)).toBe("Mel");
    expect(renderToStaticMarkup(<StyledName name="Mel" style={null} />)).toBe("Mel");
  });

  it("applies the theme class, gradient and chosen color", () => {
    const html = renderToStaticMarkup(
      <StyledName
        name="Mel"
        style={{ theme: "NEON", font: "DISPLAY", color: "#ff4fa3" }}
        className="font-bold"
      />,
    );

    expect(html).toContain("profile-name-theme-neon");
    expect(html).toContain("font-bold");
    expect(html).toContain("background-clip:text");
    expect(html).toContain("#8b5cf6");
    expect(html).toContain("#ff4fa3");
  });

  it("uses the theme font when the stored font is missing", () => {
    const html = renderToStaticMarkup(<StyledName name="Mel" style={{ theme: "PIXEL" }} />);

    expect(html).toContain("Press Start 2P");
  });

  it("paints a single color when the theme has no gradient", () => {
    const html = renderToStaticMarkup(
      <StyledName name="Mel" style={{ theme: "DEFAULT", color: "#22c55e" }} />,
    );

    expect(html).toContain("color:#22c55e");
    expect(html).not.toContain("background-clip");
  });
});
