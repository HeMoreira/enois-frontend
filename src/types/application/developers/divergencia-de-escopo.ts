/**
 * O que a conferencia de escopo achou entre a matriz documentada e a API sem sessao.
 *
 * - `publicasQueExigemSessao`: a pagina promete rota aberta e a API recusa sem credencial.
 * - `fechadasQueRespondem`: a pagina promete rota fechada e a API responde sem credencial.
 */
export type DivergenciaDeEscopo = {
  publicasQueExigemSessao: string[];
  fechadasQueRespondem: string[];
};
