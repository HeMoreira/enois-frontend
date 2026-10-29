import type { AuthConfig } from "@/types/application/auth/auth-config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { ENABLED_OAUTH_PROVIDERS, availableSocialProviders } from "./auth-providers";

/**
 * O backend avisa no `/auth/config` se o login com Google está ligado no ambiente e RECUSA o
 * start do OAuth quando não está (403 `OAUTH_PROVIDER_DISABLED`). O botão que não pode funcionar
 * é pior do que botão nenhum: a pessoa clica, leva erro e não entra.
 */
describe("provedores de entrada social", () => {
  it("esconde o Google quando a API diz que ele está desligado", () => {
    expect(availableSocialProviders(false)).not.toContain("GOOGLE");
  });

  it("mantém o Google quando a API diz que ele está ligado", () => {
    expect(availableSocialProviders(true)).toContain("GOOGLE");
  });

  it("não oferece o Google antes da resposta da API", () => {
    // Quem manda é a API: enquanto ela não disser que o Google está ligado, o botão não aparece
    // (a mesma regra do captcha, que também espera a configuração).
    expect(availableSocialProviders(undefined)).not.toContain("GOOGLE");
  });

  it("mantém os demais provedores habilitados", () => {
    expect(availableSocialProviders(false)).toContain("LINKEDIN");
    expect(availableSocialProviders(true)).toEqual([...ENABLED_OAUTH_PROVIDERS]);
  });
});

/**
 * Trava do contrato: o campo que a API devolve precisa existir no tipo do front. Se alguém tirar
 * o campo do tipo, o `tsc` quebra aqui.
 */
describe("contrato da configuração de autenticação", () => {
  it("declara o flag do Google que a API devolve", () => {
    const config: AuthConfig = {
      captchaMode: "NONE",
      turnstileSiteKey: null,
      googleLoginEnabled: true,
    };
    expect(config.googleLoginEnabled).toBe(true);
  });
});

/**
 * A função acima só vale se a tela de entrada realmente a usar: senão o botão continua aparecendo
 * e o flag vira código morto.
 */
describe("a tela de entrada respeita a configuração", () => {
  const fonte = readFileSync(join(process.cwd(), "src/routes/entrar.tsx"), "utf8");

  it("monta os botões a partir dos provedores disponíveis", () => {
    expect(fonte).toContain("availableSocialProviders");
    expect(fonte).toContain("googleLoginEnabled");
  });

  it("não oferece o botão do Google em codigo fixo", () => {
    // O botão do Google é montado a partir da lista; se alguém voltar a escrever o botão fixo,
    // o provedor desligado volta a aparecer.
    expect(fonte).not.toMatch(/providerButton\(\s*"GOOGLE"/);
  });
});
