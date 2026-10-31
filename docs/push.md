# Web push

Notificações push no navegador, sem app nativo.

## Fluxo

1. O usuário liga o push no **menu da conta** ([`PushToggle`](../src/components/account-menu.tsx) no menu; o toggle pede permissão do navegador
   e registra o service worker).
2. O front envia a assinatura push ao backend, que guarda a inscrição por dispositivo.
3. Quando uma notificação in-app nasce, o backend envia o push (Web Push com VAPID) para cada
   inscrição ativa do usuário.
4. O [service worker](../public/sw.js) recebe o push e mostra a notificação; o clique abre a URL
   da notificação (o mesmo mapeamento de href das notificações in-app).

## Estados

- Permissão negada no navegador → o toggle mostra como reativar nas configurações do site.
- O toggle vive no menu da conta. As categorias (social, mensagens, grupos, vagas, sistema) e o
  resumo semanal ficam em `/notificacoes/preferencias`, que também oferece ligar o push neste
  aparelho quando ele está desligado.
- Inscrição expirada (410 do navegador) → o backend descarta e o push para de sair até religar.
- Sem chave VAPID configurada no ambiente → o toggle não aparece (o recurso fica desligado).

## Testes

A inscrição e o envio são testados no backend; no front, o fluxo visível é o toggle em /seguranca
e a notificação do sistema operacional (testável em qualquer navegador com service worker).
