# Nick Finance (front-end)

Front-end em Angular 20 do Nick Finance, consumindo a API Spring Boot.

## Rodando localmente

Pré-requisitos: Node 20+ e a API rodando em `http://localhost:8080`.

```bash
npm install
npm start
```

Acesse http://localhost:4200. O `ng serve` encaminha `/api/*` para `http://localhost:8080/*`
(ver `proxy.conf.json`), então a API não precisa liberar CORS em desenvolvimento.

> A API usa Gradle 8.13, que não roda em Java 24. Suba-a com JDK 17 ou 21
> (ex.: `JAVA_HOME=<caminho-do-jdk-17> ./gradlew bootRun`).

### Conta de teste local

Criada durante o desenvolvimento no banco local (só existe na sua máquina):

- e-mail: `teste.nick@nickfinance.test`
- senha: `Teste@1234`

## Scripts

| Comando | O que faz |
|---|---|
| `npm start` | Servidor de desenvolvimento com proxy para a API |
| `npm run build` | Build de produção em `dist/nick-finance/browser` |
| `npm test` | Testes unitários (Karma + Jasmine) |

## Arquitetura

```
src/app/
├── core/                 # Singletons usados pela aplicação toda
│   ├── auth/             # AuthService, sessão, interceptor JWT e guards
│   ├── http/             # Tradução de erros HTTP em mensagens
│   └── utils/            # Datas e JWT (funções puras)
├── shared/               # Peças reutilizáveis, sem regra de negócio
│   ├── ui/               # Ícone, modal, toast, estado vazio
│   └── utils/            # Exportação CSV
├── layout/shell/         # Menu lateral e moldura da área logada
└── features/             # Uma pasta por funcionalidade, carregada sob demanda
    ├── auth/             # Login e cadastro
    ├── dashboard/        # Visão geral: entradas, saídas e saldo
    ├── despesas/data-access/  # Modelos, mapper, API (HTTP) e store de despesas
    ├── receitas/data-access/  # Modelos, mapper, API (HTTP) e store de entradas
    ├── categorias/       # Categorias (data-access, selo, diálogo e página)
    ├── planejamento/     # Orçamentos, recorrentes, contas a pagar/receber e metas
    │   ├── data-access/  # Modelos, APIs e stores dos quatro recursos
    │   └── planejamento-calculos.ts  # Uso do orçamento, projeção do mês, plano das metas
    └── lancamentos/      # Visão unificada de entradas + despesas
        ├── lancamentos.facade.ts  # Ponto único de acesso para as telas
        ├── lancamento-stats.ts    # Cálculos (saldo, totais por mês, rankings)
        ├── components/   # Formulário (com máscara de moeda) e modal
        └── pages/        # Extrato, Entradas e Despesas (mesma tela, filtrada pela rota)
```

Decisões principais:

- **Standalone components + signals**, com `OnPush` em todos os componentes.
- **CRUD genérico**: `core/http/crud-api.ts` e `CrudStore` (em `core/state/collection-store.ts`)
  implementam listar/criar/editar/excluir; cada recurso só declara o caminho e o mapeamento.
- **Camadas por feature**: as telas falam com a *facade* de lançamentos; ela usa os *stores*
  de despesas e receitas (que herdam de `core/state/collection-store.ts`); cada store usa sua
  *API*, que converte o formato do back para o modelo do front via *mapper*.
  Se o contrato da API mudar, só o mapper muda.
- **Máscara de moeda**: a diretiva `appCurrencyInput` (`shared/ui/currency-input`) mostra
  `1.234,56` enquanto o usuário digita, mas entrega um `number` ao formulário.
- **Rotas lazy** (`loadComponent`): cada tela é um chunk separado.
- **Sessão**: o token fica no `localStorage`, é anexado pelo `authInterceptor` e a sessão
  expira sozinha na data do `exp` do JWT. Respostas 401/403 também encerram a sessão.
- **Regras de cálculo** (totais, comparativos, rankings) ficam em funções puras em
  `despesa-stats.ts`, cobertas por testes.

## Assistente Nick

Tela **Nick**: chat que responde sobre os dados da conta, só com leitura. O modelo roda no Groq e é chamado
pela API; a chave nunca chega ao navegador, e a conversa não é gravada.

Crie a chave em <https://console.groq.com/keys>. Localmente, coloque `groq.api-key` no `local.properties` da API;
na hospedagem, use a variável `GROQ_API_KEY`. Opcionais: `GROQ_MODEL` e `NINO_LIMITE_DIARIO` (padrão 30).

## Bot do Telegram

O usuário registra lançamentos mandando mensagens como `gastei 45,90 no mercado` ou
`recebi 5200 de salário`. A tela **Telegram** do app gera o código que liga a conta ao chat.

Para ligar o bot na API:

1. No Telegram, fale com o **@BotFather**, envie `/newbot` e siga as instruções.
2. Na raiz da API, preencha o arquivo `local.properties` (fora do git; modelo em
   `local.properties.example`) com `telegram.bot.token` e `telegram.bot.username` e reinicie.
   Na hospedagem, use as variáveis de ambiente `TELEGRAM_BOT_TOKEN` e `TELEGRAM_BOT_USERNAME`.
   Sem token válido, o bot fica desligado e o resto funciona normalmente.

O bot usa *long polling*: não precisa de URL pública, mas a API precisa ficar rodando
(em planos gratuitos que "dormem", o bot também dorme).

## Deploy gratuito (Vercel)

1. Suba este repositório no GitHub e importe-o na Vercel. O `vercel.json` já define build e saída.
2. O `vercel.json` já repassa `/api/*` para `https://nick-finance-api.onrender.com`.

O front chama sempre `/api/...`, e a Vercel repassa para a API. Como o navegador só fala com o
domínio do front, **não é preciso configurar CORS** na API.

## Limitações atuais (dependem da API)

- Filtros, busca, paginação e totais são calculados no navegador, porque a API devolve tudo de uma vez.
- Recorrências não geram meses passados: se o dia deste mês já passou ao cadastrar (ou ao retomar),
  o primeiro lançamento é no mês seguinte.
