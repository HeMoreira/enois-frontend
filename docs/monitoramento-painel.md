# Painel de monitoramento

O painel de moderação (`/moderador`) tem uma aba de **monitoramento** para acompanhar a saúde da
aplicação em tempo real.

## O que mostra

- **KPIs da janela dos últimos 60 minutos** (`/admin/monitoring/overview`): requisições por segundo
  e por minuto, em andamento e pico, latência (p50/p95/p99/máx.), erros 5xx e 4xx, taxa de erro,
  uptime, heap usado/máximo e threads.
- **Séries por minuto** (últimos 60 min): tráfego (requisições + erros), latência e recursos (CPU e
  heap), desenhados em SVG.
- **Recursos do pod**: heap, non-heap, CPU do processo e do sistema, load average, threads (atual e
  pico), GC, classes carregadas, memória do container e pool de conexões do banco.
- **Top rotas** do período e contagens por status e método HTTP.
- **Eventos, falhas e logs** (`/admin/monitoring/events`): lista com filtro por nível (ERROR/WARN/
  INFO/DEBUG), por tipo e busca textual; intervalo de data e hora ("De"/"Até", com atalho
  "Última hora"); "mostrar mais" em mensagens longas; cópia individual e cópia de tudo; paginação
  "carregar mais" por cursor. Sem filtro, mostra os eventos recentes que o backend mantém em
  memória; com filtro, busca no banco.

## De onde vêm os dados

- Backend expõe os agregados para admin e moderadores autenticados (mesma guarda do painel).
- O log estruturado do backend alimenta os contadores — o painel lê campos tipados
  (`requestId`, `route`, `status`, `durationMs`), não texto livre.
- Atualização por polling curto (o botão de pausar congela a tela); eventos descartados por
  excesso aparecem como aviso no painel.

## Quando escalar

- Taxa de erro acima do normal com pico de recusas → provável varredura/ataque (ver `SECURITY.md`
  do backend antes de agir).
- Eventos descartados em crescimento contínuo → volume acima do teto do backend.

Qualquer ação de contenção segue o runbook de segurança do backend — o painel observa, não contém.
