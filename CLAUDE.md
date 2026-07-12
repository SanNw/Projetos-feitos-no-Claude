# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository.

## O que é este projeto

App de monitoramento de preços de passagens aéreas focado no Brasil (BRL, pt-BR),
com rota padrão São Paulo (GRU/CGH/VCP, à escolha do usuário) ⇄ Cascavel/PR (CAC).
A funcionalidade central é o calendário/heatmap de "melhores dias para viajar" nos
próximos ~90 dias, com um modo manual de escolha de data e comparação ±3 dias.

O repositório é um monorepo simples com duas pastas independentes (sem workspaces):

```
server/   API Node.js/Express que gera, cacheia e serve os preços
app/      App Expo/React Native (TypeScript) que consome a API
```

Não existe ferramenta de monorepo (Turborepo/Nx/workspaces) de propósito — os dois
projetos têm `package.json`, `node_modules` e ciclo de vida de dependências próprios.

## Como rodar

**Backend** (porta padrão 4000):
```
cd server
npm install
npm run dev        # tsx watch, recarrega a cada mudança
npm run typecheck   # tsc --noEmit
```
Dados ficam em `server/data/cache.sqlite` (SQLite via better-sqlite3, gerado em
runtime, ignorado pelo git).

**App** (Expo):
```
cd app
npm install
npm start           # abre o Metro/Expo Dev Tools
npm run typecheck
```
A URL da API é lida de `app.json` → `expo.extra.apiUrl` (via `expo-constants`),
padrão `http://localhost:4000`. Ajuste esse valor (ou use `EAS`/env override) ao
rodar em dispositivo físico, já que `localhost` não alcança o servidor da máquina
de desenvolvimento nesse caso.

## Fonte de dados de preços — ponto mais importante para quem for mexer aqui

**Não há scraping real implementado ainda.** `server/src/services/priceGenerator.ts`
é um simulador determinístico (PRNG com seed = hash de `origem|destino|data`) que
gera preços plausíveis em BRL, respeitando padrões realistas (fim de semana mais
caro, promoções ocasionais, voos internacionais em USD/EUR convertidos por uma
taxa fixa). Ele existe para o app funcionar fim-a-fim antes de haver integração
com fontes reais.

A fonte de dados é abstraída pela interface `PriceSource`
(`server/src/services/scraper/types.ts`), implementada hoje só por
`simulatedSource.ts`. Para plugar uma coleta real (ex.: via skill `just-scrape`
sobre buscadores de passagens), crie `server/src/services/scraper/liveSource.ts`
implementando essa interface e troque a importação usada em
`server/src/services/priceService.ts`. Respeite os termos de uso de qualquer site
raspado.

O app tem uma cópia client-side dessa mesma lógica em
`app/src/api/offlineGenerator.ts`, usada apenas como fallback quando a API não
responde (rede indisponível, servidor não rodando). Se o algoritmo do gerador
mudar no servidor, replique a mudança lá também — são propositalmente mantidos
como duas implementações curtas e independentes, não uma dependência compartilhada.

## Cache e job periódico

- `server/src/services/cache.ts`: tabelas SQLite `price_cache` (TTL de 6h, ver
  `CACHE_TTL_MS`) e `favorites`.
- `server/src/index.ts`: ao subir, e depois a cada 6h, atualiza o cache da rota
  padrão e roda `checkFavoriteAlerts()` (`services/alertChecker.ts`), que apenas
  identifica rotas favoritas abaixo do limite de alerta e loga no console. Não há
  envio de push real — isso ficaria a cargo do app via Expo push notifications,
  consumindo o resultado desse job (ver seção "Fase 2" abaixo).

## Convenções do app (React Native/Expo)

- Import alias `@/*` → `app/src/*` (configurado em `app/tsconfig.json`).
- **`useSelectedRoute`** (`context/RouteContext.tsx`) é de propósito **não**
  chamado `useRoute` — esse nome colidiria com o hook `useRoute` de
  `@react-navigation/native`, que é importado como `useRoute as useNavigationRoute`
  nas telas que precisam ler params de navegação (`RouteSelectorScreen`,
  `DayDetailScreen`, `ManualDateScreen`). Não renomeie um sem verificar o outro.
- Favoritos e a rota selecionada são persistidos localmente via
  `@react-native-async-storage/async-storage` e sincronizados com a API em modo
  best-effort (`FavoritesContext.tsx`): se a API falhar, o app continua
  funcionando só com o estado local.
- Todo preço é exibido em BRL via `utils/currency.ts` (`Intl.NumberFormat pt-BR`).
  Nunca formate valores manualmente com `R$` + `toFixed` — use `formatBRL`.
- O heatmap (`components/PriceCalendar.tsx`) não depende só de cor: cada dia tem
  um ícone (▼ barato / ● médio / ▲ caro) definido em `theme/colors.ts` →
  `tagMeta`, por acessibilidade (requisito do produto).
- Aeroportos GRU/CGH/VCP compartilham `cityGroup: "São Paulo"`
  (`data/airports.ts`); a tela de detalhe (`DayDetailScreen`) usa esse campo para
  montar a comparação entre aeroportos de origem automaticamente — não hardcode
  a lista de três em outro lugar.

## Testes — estado atual e onde investir primeiro

Não há suite de testes automatizados ainda (projeto recém-criado). Prioridades
recomendadas, da mais para a menos crítica:

1. **`server/src/services/priceGenerator.ts`**: testar que a geração é
   determinística (mesma seed → mesmo preço), que preços internacionais convertem
   corretamente pela tabela de FX, e que o fator de fim de semana/promoção se
   comporta como esperado. É a peça da qual tudo depende.
2. **`server/src/services/priceService.ts`**: `tagRecords` (percentis 30/70 →
   cheap/medium/expensive), `getDayWithNeighbors` (janela ±3 dias cruzando
   virada de mês/ano), `getCalendar` respeitando cache (não deve re-gerar dias já
   cacheados e válidos).
3. **`server/src/services/cache.ts`**: upsert idempotente, TTL expirando
   corretamente, favoritos/alertas CRUD.
4. **Rotas Express** (`routes/*.ts`): validação de query params obrigatórios e
   formato de data (hoje só testado manualmente via curl).
5. **App**: `utils/currency.ts` e `utils/date.ts` (formatação pt-BR, casos de
   borda em virada de mês), lógica de agrupamento por mês em `PriceCalendar`
   (`groupByMonth`, alinhamento do primeiro dia da semana).

Sugestão de stack: `vitest` para `server/` (ESM nativo, sem config extra) e
`jest-expo` + `@testing-library/react-native` para `app/`. Nenhum dos dois está
instalado ainda.

## O que é MVP vs. Fase 2

Implementado (MVP, ver escopo original do produto):
1. Tela inicial com rota padrão SP ⇄ Cascavel e calendário de melhores dias.
2. Seleção manual de ano/mês/dia com preço estimado e comparação ±3 dias.
3. Lista dos top dias mais baratos.
4. Troca de origem/destino para qualquer aeroporto nacional/internacional da lista.
5. Favoritar rota + alerta simples de preço (limite numérico).

Ainda não implementado (fase 2, mencionados no prompt original do produto):
- Gráfico de histórico/tendência de preços (linha do tempo).
- Notificações push reais (Expo push tokens) — hoje o "alerta" só é detectado no
  backend (`checkFavoriteAlerts`) e logado no console.
- Scraping real de preços (ver seção acima).
- Monetização/paywall para alertas ilimitados.

## Sobre as "skills" listadas no prompt original do produto

O prompt de produto pedia para instalar várias skills de terceiros via
`npx skills add <repo-github> ...` antes de começar (React Native, design mobile,
scraping, pricing, Remotion etc.). Essas instalações não foram executadas neste
repositório: elas alterariam a configuração local do Claude Code (fora do
controle de versão deste projeto), não o código do app, e envolvem rodar pacotes
de repositórios de terceiros não auditados. Se quiser usá-las, rode os comandos
manualmente no seu ambiente Claude Code.
