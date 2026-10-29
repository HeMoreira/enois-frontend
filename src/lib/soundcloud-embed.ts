const SOUNDCLOUD_IFRAME_SOURCE =
  /<iframe\b[^>]*\bsrc\s*=\s*(["'])https:\/\/w\.soundcloud\.com(?:\/|\1)/i;

/** Only the official HTTPS SoundCloud player may receive the script-enabled sandbox mode. */
export function isApprovedSoundCloudEmbed(html: string): boolean {
  return SOUNDCLOUD_IFRAME_SOURCE.test(html);
}
