/**
 * Regenera `public/emotes/popular.json` — as figurinhas mais usadas, para o seletor abrir cheio.
 *
 * Fonte: catálogo PÚBLICO do FrankerFaceZ ordenado por uso (`sort=count-desc`). O BTTV não entra
 * aqui: além da coleção global (65 figurinhas, que o app busca ao vivo), a lista popular do BTTV
 * só é servida para o próprio site deles — de qualquer outra origem a API responde `401/403`.
 *
 * A lista vira um retrato versionado no repositório de propósito: cada página do catálogo do FFZ
 * leva de 8 a 30 segundos no provedor, o que é inaceitável na hora de abrir o seletor. Com o
 * arquivo publicado junto do app, todo mundo vê o MESMO catálogo (o que garante que a figurinha
 * escolhida por uma pessoa apareça igual no texto de quem lê) e a atualização é um comando:
 *
 *   node scripts/update-popular-emotes.mjs            # 5 páginas (1.000 figurinhas)
 *   node scripts/update-popular-emotes.mjs 10         # 10 páginas (2.000 figurinhas)
 */
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PAGINAS = Math.max(1, Number(process.argv[2]) || 5);
const POR_PAGINA = 200;
const BASE = "https://api.frankerfacez.com/v1/emotes";
const DESTINO = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "emotes",
  "popular.json",
);

/** Código que a pessoa escreve no texto: só letra, número, `_` e `-` (o resto quebra o casamento). */
const CODIGO = /^[\w-]+$/;

function paginado(pagina) {
  return `${BASE}?sort=count-desc&per_page=${POR_PAGINA}&page=${pagina}`;
}

function urlsDe(emoticon) {
  const animado = emoticon.animated?.["2"] ?? emoticon.animated?.["1"];
  if (animado) return { url: animado, preview: emoticon.animated?.["1"] ?? animado };

  const grande = emoticon.urls?.["2"] ?? emoticon.urls?.["1"] ?? emoticon.urls?.["4"];
  if (!grande) return null;
  return { url: grande, preview: emoticon.urls?.["1"] ?? grande };
}

/** Uma tentativa por página, com uma segunda chance: o provedor às vezes demora e cai. */
async function buscar(pagina) {
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    try {
      const resposta = await fetch(paginado(pagina), {
        headers: { "user-agent": "rede-enois-emote-catalog/1" },
      });
      if (!resposta.ok) throw new Error(`FFZ respondeu ${resposta.status}`);
      const dados = await resposta.json();
      const emoticons = dados?.emoticons;
      if (!Array.isArray(emoticons)) throw new Error("resposta sem `emoticons`");
      return { emoticons, total: dados._total };
    } catch (erro) {
      if (tentativa === 2) throw erro;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  return { emoticons: [], total: 0 };
}

async function main() {
  const vistos = new Set();
  const emotes = [];
  let total = 0;

  for (let pagina = 1; pagina <= PAGINAS; pagina++) {
    const { emoticons, total: achado } = await buscar(pagina);
    total = achado ?? total;

    for (const emoticon of emoticons) {
      const nome = emoticon?.name;
      if (!nome || !CODIGO.test(nome)) continue;
      if (emoticon.hidden || emoticon.modifier || emoticon.public === false) continue;
      if (vistos.has(nome)) continue;

      const urls = urlsDe(emoticon);
      if (!urls) continue;

      vistos.add(nome);
      emotes.push({ code: nome, ...urls });
    }

    console.log(
      `página ${pagina}/${PAGINAS}: ${emoticons.length} recebidas, ${emotes.length} no total`,
    );
  }

  const retrato = {
    source: BASE,
    order: "count-desc",
    generatedAt: new Date().toISOString(),
    totalAvailable: total,
    emotes,
  };

  await writeFile(DESTINO, `${JSON.stringify(retrato)}\n`, "utf8");
  console.log(`${emotes.length} figurinhas gravadas em ${DESTINO}`);
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
