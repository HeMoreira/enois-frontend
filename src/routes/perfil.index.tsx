import { useEffect } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { LoadingState } from "@rede-enois/design-system/ui";

import { useCurrentUser } from "@/lib/current-user";
import { hasSession } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";

/**
 * `/perfil` sem nome de usuário dava 404 — e é a URL que a pessoa digita para ver o próprio perfil.
 * Aqui ela vai para `/perfil/<username>` assim que o `me` chega; sem sessão, para o login.
 */
export const Route = createFileRoute("/perfil/")({
  component: OwnProfileRedirect,
});

function OwnProfileRedirect() {
  const navigate = useNavigate();
  const { data: currentUser } = useCurrentUser();

  useEffect(() => {
    if (!hasSession()) {
      void navigate({ to: "/entrar", search: { tab: "login" }, replace: true });
      return;
    }

    if (currentUser?.username) {
      void navigate({
        to: "/perfil/$username",
        params: { username: currentUser.username },
        replace: true,
      });
    }
  }, [currentUser?.username, navigate]);

  return (
    <AppContainer>
      <LoadingState />
    </AppContainer>
  );
}
