export type AuthConfig = {
  captchaMode: "TURNSTILE" | "CHALLENGE" | "NONE";
  turnstileSiteKey: string | null;
  /**
   * O Google pode estar DESLIGADO no ambiente (`rede.oauth.google.enabled` no backend). A API
   * recusa o start do OAuth com 403 `OAUTH_PROVIDER_DISABLED` — então o app não pode oferecer o
   * botão: a pessoa clicaria e só levaria a um erro.
   */
  googleLoginEnabled: boolean;
};
