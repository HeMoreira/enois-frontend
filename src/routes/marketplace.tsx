import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * O marketplace virou uma ABA dentro da Carteira (`/carteira?tab=marketplace`).
 *
 * A rota antiga continua existindo só para o endereço não quebrar: quem tinha o link (ou o
 * favorito) cai na aba certa, e a moeda e as compras ficam num lugar só.
 */
export const Route = createFileRoute("/marketplace")({
  beforeLoad: () => {
    throw redirect({ to: "/carteira", search: { tab: "marketplace" } });
  },
});
