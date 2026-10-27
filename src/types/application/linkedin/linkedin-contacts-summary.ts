/** Resumo dos contatos do LinkedIn importados e do convite automático. */
export type LinkedinContactsSummary = {
  autoInvite: boolean;
  contacts: number;
  invited: number;
  pending: number;
  alreadyConnected: number;
  noMatch: number;
  ambiguous: number;
  skipped: number;
  queued: number;
};
