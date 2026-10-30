import { queryOptions } from "@tanstack/react-query";

import { companiesApi, jobsApi } from "@/lib/api";

export const companyQueries = {
  directoryKey: ["companies"] as const,
  mine: () =>
    queryOptions({ queryKey: ["my-companies"] as const, queryFn: () => companiesApi.mine() }),
  directory: (search: string) =>
    queryOptions({
      queryKey: [...companyQueries.directoryKey, search] as const,
      queryFn: () => jobsApi.companies(search || undefined, 120),
    }),
  detail: (slug: string) =>
    queryOptions({
      queryKey: ["empresa", slug] as const,
      queryFn: () => companiesApi.bySlug(slug),
    }),
};
