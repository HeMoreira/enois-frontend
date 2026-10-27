import type { LinkedinContactInviteView } from "@/types/application/linkedin/linkedin-contact-invite-view";
import type { LinkedinContactsSummary } from "@/types/application/linkedin/linkedin-contacts-summary";
import type { LinkedInIntegrationStatus } from "@/types/application/linkedin/linkedin-integration-status";

import { api } from "../api-client";

/**
 * Publicação das publicações do Énóis no LinkedIn.
 *
 * O token do LinkedIn fica no servidor (cifrado); o front só vê o estado e liga/desliga a
 * preferência. Quem publica é o handler do outbox, depois do commit da publicação.
 */
export const linkedInIntegrationApi = {
  status: () => api.get<LinkedInIntegrationStatus>("/me/integrations/linkedin"),
  setPostSync: (postSync: boolean) =>
    api.put<LinkedInIntegrationStatus>("/me/integrations/linkedin", { postSync }),
};

/**
 * Contatos do LinkedIn (Connections.csv do arquivo de dados) e convite automático no Énóis.
 * O LinkedIn só entrega conexões por API para apps aprovados; o arquivo é o caminho sancionado.
 */
export const linkedinContactsApi = {
  summary: () => api.get<LinkedinContactsSummary>("/me/import/linkedin/contatos/resumo"),

  importContacts: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<LinkedinContactsSummary>("/me/import/linkedin/contatos", formData, {
      idempotent: false,
    });
  },

  setAutoInvite: (enabled: boolean) =>
    api.put<LinkedinContactsSummary>("/me/import/linkedin/contatos/auto-convite", { enabled }),

  list: (limit = 200) =>
    api.get<LinkedinContactInviteView[]>(`/me/import/linkedin/contatos?limit=${limit}`),
};
