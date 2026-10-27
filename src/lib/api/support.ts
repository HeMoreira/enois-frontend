import type { SupportAdminView } from "@/types/application/support/support-admin-view";
import type { SupportCategory } from "@/types/application/support/support-category";
import type { SupportConfig } from "@/types/application/support/support-config";
import type { SupportMessage } from "@/types/application/support/support-message";
import type { SupportRequestInput } from "@/types/application/support/support-request-input";
import type { SupportRequestView } from "@/types/application/support/support-request-view";
import type { SupportStatus } from "@/types/application/support/support-status";

import { api, buildQuery } from "../api-client";

export const supportApi = {
  /** Abre um pedido de ajuda para ser atendido por uma pessoa do time. */
  open: (data: SupportRequestInput) => api.post<SupportRequestView>("/support/requests", data),

  /** Histórico do próprio solicitante (é onde o encerramento aparece). */
  mine: (limit = 20) => api.get<SupportRequestView[]>(`/support/requests/mine?limit=${limit}`),

  /** Canal público de contato: e-mail do time de suporte (null quando não configurado). */
  config: () => api.get<SupportConfig>("/support/config"),

  /** Fila do painel central (admin): filtros por categoria e status. */
  adminList: (
    params: { category?: SupportCategory; status?: SupportStatus; limit?: number } = {},
  ) => api.get<SupportAdminView[]>(`/admin/support${buildQuery(params)}`),

  /** Triagem: move o ticket entre aberto/em andamento/resolvido. */
  adminUpdate: (id: string, data: { status?: SupportStatus; category?: SupportCategory }) =>
    api.patch<SupportAdminView>(`/admin/support/${id}`, data),

  /** Resposta oficial: grava no ticket, envia ao e-mail de contato e notifica no app. */
  adminReply: (id: string, message: string) =>
    api.post<SupportAdminView>(`/admin/support/${id}/reply`, { message }),

  /** Conversa do ticket: respostas do painel + comentários do GitHub, em ordem. */
  adminMessages: (id: string) =>
    api.get<SupportMessage[]>(`/admin/support/${encodeURIComponent(id)}/messages`),
};
