/**
 * Ambiente de produção.
 *
 * As chamadas vão para `/api`, que o host do front (ex.: Vercel, ver `vercel.json`)
 * redireciona para a URL real da API. Assim o navegador nunca faz requisição
 * cross-origin e a API não precisa liberar CORS.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
};
