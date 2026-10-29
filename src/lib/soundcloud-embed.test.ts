import { describe, expect, it } from "vitest";

import { isApprovedSoundCloudEmbed } from "./soundcloud-embed";

describe("isApprovedSoundCloudEmbed", () => {
  it("allows only the official HTTPS SoundCloud player host", () => {
    expect(
      isApprovedSoundCloudEmbed(
        '<iframe src="https://w.soundcloud.com/player/?url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F1"></iframe>',
      ),
    ).toBe(true);
    expect(isApprovedSoundCloudEmbed('<iframe src="https://evil.example/player"></iframe>')).toBe(
      false,
    );
    expect(
      isApprovedSoundCloudEmbed('<iframe src="https://w.soundcloud.com.evil/player"></iframe>'),
    ).toBe(false);
  });
});
