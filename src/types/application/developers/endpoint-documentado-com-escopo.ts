/** Um endpoint da matriz documentada, com o escopo que a pagina promete (`public`/`auth`/`admin`). */
export type EndpointDocumentadoComEscopo = {
  method: string;
  path: string;
  access: "public" | "auth" | "admin";
};
