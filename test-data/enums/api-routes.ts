/** Shared API path fragments; base URL comes from playwright `use.baseURL` / DIDAXIS_URL. */
export const ApiRoutes = {
  programs: '/api/programs',
  programById: (id: string) => `/api/programs/${id}`,
} as const;
