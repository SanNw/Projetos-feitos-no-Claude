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
npm test            # vitest run
```
Dados ficam em `server/data/cache.sqlite` (SQLite via better-sqlite3, gerado em
runtime, ignorado pelo git).

**App** (Expo):
```
cd app
npm install
npm start           # abre o Metro/Expo Dev Tools
npm run typecheck
npm test             # jest-expo
```
A URL da API é lida de `app.json` → `expo.extra.apiUrl` (via `expo-constants`),
padrão `http://localhost:4000`. Ajuste esse valor (ou use `EAS`/env override) ao
rodar em dispositivo físico, já que `localhost` não alcança o servidor da máquina
de desenvolvimento nesse caso.

## Fonte de dados de preços — ponto mais importante para quem for mexer aqui

A fonte de dados é abstraída pela interface `PriceSource`
(`server/src/services/scraper/types.ts`). Há duas implementações:

- **`simulatedSource.ts`**: simulador determinístico (PRNG com seed = hash de
  `origem|destino|data`) que gera preços plausíveis em BRL, respeitando padrões
  realistas (fim de semana mais caro, promoções ocasionais, voos internacionais
  em USD/EUR convertidos por uma taxa fixa). Não depende de rede.
- **`liveSource.ts`** (fonte usada por padrão em `priceService.ts`): consulta a
  **Amadeus for Developers Self-Service API** (https://developers.amadeus.com,
  free tier) via o SDK oficial `amadeus`. Optamos por uma API oficial de dados
  de voos em vez de raspar HTML de sites como Google Flights/Skyscanner/Decolar
  porque esses sites proíbem scraping automatizado em seus termos de uso e são
  tecnicamente frágeis (JS pesado, anti-bot, CAPTCHA). Detalhes:
  - **Configuração**: defina `AMADEUS_CLIENT_ID` e `AMADEUS_CLIENT_SECRET` no
    ambiente do servidor (crie credenciais gratuitas de teste no site acima).
    Sem essas variáveis, `liveSource` cai 100% no simulador — comportamento
    idêntico a antes de essa integração existir.
  - **Estratégia de chamadas**: para lotes pequenos de datas (≤ 8 — o caso do
    "±3 dias" e do detalhe de um dia), chama `flightOffersSearch` por data
    (preço + companhia real). Para o calendário de ~90 dias, chama
    `flightDates` (cheapest-date-search) uma única vez para o range inteiro,
    para não estourar cota/rate limit da API.
  - **Fallback automático por data**: qualquer erro (rota não coberta, rate
    limit, rede) faz aquela data específica cair para
    `generatePriceRecord` (mesma função usada pelo simulador) — o app nunca
    quebra por falta de cobertura.
  - **Limitação conhecida**: o ambiente padrão (`AMADEUS_ENV` não definida, ou
    `test`) usa um dataset estático/limitado. Aeroportos regionais pequenos
    como **CAC (Cascavel) — a rota padrão do app — muito provavelmente não
    têm dados reais nesse ambiente**; espere fallback para o simulador nessa
    rota até configurar `AMADEUS_ENV=production` com uma conta paga que tenha
    cobertura para ela. Rotas maiores (ex.: GRU↔GIG, GRU↔LIS) têm mais chance
    de retornar dados reais mesmo no ambiente de teste.
  - Não foi possível validar contra uma conta Amadeus real neste ambiente (sem
    credenciais); a integração foi testada garantindo que (a) sem credenciais o
    comportamento é idêntico ao simulador, e (b) com credenciais inválidas o
    erro é capturado e cai para o simulador por data, sem derrubar o servidor.

Para trocar de fonte (ex.: usar outra API ou voltar ao simulador puro), edite a
única linha `const source = ...` em `server/src/services/priceService.ts`.

O app tem uma cópia client-side da lógica do simulador em
`app/src/api/offlineGenerator.ts`, usada apenas como fallback quando a API não
responde (rede indisponível, servidor não rodando). Se o algoritmo do gerador
mudar no servidor, replique a mudança lá também — são propositalmente mantidos
como duas implementações curtas e independentes, não uma dependência compartilhada.

## Cache e job periódico

- `server/src/services/cache.ts`: tabelas SQLite `price_cache` (TTL de 6h, ver
  `CACHE_TTL_MS`), `favorites` e `push_tokens`.
- `server/src/index.ts`: ao subir, e depois a cada 6h, atualiza o cache da rota
  padrão e roda `checkFavoriteAlerts()` (`services/alertChecker.ts`).

## Notificações push (alertas de preço)

Fluxo ponta a ponta, sem depender de conta própria no Firebase/APNs:

1. **App** (`src/notifications/registerForPushNotifications.ts`): no primeiro
   load (`App.tsx`), pede permissão e obtém o Expo push token do dispositivo
   (`Notifications.getExpoPushTokenAsync()`), depois registra esse token no
   backend via `POST /api/push-tokens` (`api/client.ts` → `registerPushToken`).
   Falha silenciosamente em qualquer etapa (emulador sem push, permissão
   negada, backend fora do ar) — nunca bloqueia o uso do app.
2. **Backend** (`services/cache.ts` tabela `push_tokens`): guarda os tokens
   registrados. Sem autenticação/contas de usuário no MVP, qualquer token
   registrado recebe notificação de qualquer favorito que dispare alerta —
   suficiente para um app de uso pessoal/single-user.
3. **`services/alertChecker.ts`**: a cada rota favorita com `alertThreshold`
   definido, se o menor preço do calendário de 90 dias ficar ≤ threshold,
   dispara `sendPushNotifications` (`services/pushNotifications.ts`, que só
   faz um `POST` para a Expo Push API em `https://exp.host/--/api/v2/push/send`
   — não precisa de credenciais Firebase/APNs próprias para isso).
4. **Debounce**: `favorites.last_alert_price` guarda o preço que motivou o
   último push enviado para aquela rota. Só reenvia se o preço mais barato
   cair *ainda mais* do que o último notificado. Se o preço volta a ficar
   acima do limite, o estado é resetado (`resetFavoriteAlertState`) para que a
   próxima queda notifique de novo — sem isso, o job de 6h reenviaria a mesma
   notificação indefinidamente enquanto o preço ficasse baixo.

Limitações conhecidas / não testadas de ponta a ponta:
- Não foi possível validar contra a Expo Push API real neste ambiente (o
  outbound para `exp.host` não é alcançável no sandbox de desenvolvimento);
  o código foi validado garantindo que (a) sem tokens registrados nada é
  enviado, (b) falhas de rede/API são capturadas e logadas sem derrubar o
  servidor, e (c) o debounce evita reenvio na mesma condição de preço.
- Para build de produção (EAS Build), Android exige credenciais FCM (V1)
  configuradas via `eas credentials`; iOS exige um certificado APNs (a Expo
  gerencia isso automaticamente na maioria dos casos via EAS). Em
  desenvolvimento (Expo Go / dev client), a Expo intermedia a entrega sem
  configuração adicional.
- Notificações push só funcionam em dispositivo físico (`Device.isDevice`),
  não em emulador/simulador.

## Histórico de preços (gráfico de tendência)

- `server/src/services/cache.ts` tabela `price_history`: um ponto por
  `(origin, destination, date)`, onde `date` é o **dia em que a rota foi
  consultada** (não uma data de voo) e `price` é o menor preço encontrado no
  calendário de 90 dias naquele dia (`MIN` em caso de múltiplas consultas no
  mesmo dia). `services/priceService.ts` grava esse ponto toda vez que
  `getCalendar()` roda — ou seja, o histórico se acumula organicamente com o
  uso do app (e com o job periódico da rota padrão/favoritos).
- `GET /api/prices/history?origin=&destination=&days=` devolve a série
  ordenada por data.
- App: `components/PriceHistoryChart.tsx` — gráfico de linha único (sem
  legenda, ver skill `dataviz`: "a single series needs no legend box"),
  renderizado com `react-native-svg` (SVG puro, sem lib de terceiros — o
  volume de pontos, ≤90, está bem abaixo do limiar onde uma lib dedicada
  compensaria). Arrastar o dedo sobre o gráfico mostra data/preço do ponto
  mais próximo (equivalente touch ao hover). Estado vazio explícito quando há
  menos de 2 pontos ("ainda não há histórico suficiente").
- Como o histórico é dado real acumulado ao longo do tempo, **não há fallback
  offline sintético** para ele (ao contrário do calendário/preço do dia) —
  sem API, a tela mostra o estado vazio, o que é o comportamento honesto.

## Monetização (paywall)

**Modelo:** freemium, 2 planos (Grátis / Pro), sem tiers B2B — a skill
`pricing` instalada é focada em SaaS B2B (per-seat, ARPU, churn); para um app
de utilidade pessoal sem contas, o que se aproveita dela é o framework
Good-Better (aqui virou só "Better", já que não há um terceiro tier que faça
sentido) e a recomendação de freemium para produtos de baixo custo marginal
por usuário gratuito e gatilho de upgrade claro por limite de uso.

- **Métrica de valor / gatilho de upgrade:** número de rotas favoritas com
  alerta de preço. Grátis: até `FREE_FAVORITES_LIMIT` (hoje 2, ver
  `app/src/billing/constants.ts`). Pro: ilimitado. É o único diferenciador
  real implementado — não invente outros (ex.: "sem anúncios") no paywall
  sem construir a funcionalidade correspondente antes.
- **Preços** (placeholder, em `billing/constants.ts`): R$ 14,90/mês ou
  R$ 99,90/ano (~R$ 8,33/mês, "economize 44%"). São números de ancoragem
  competitiva para apps de utilidade de viagem no Brasil, **não validados**
  com os usuários reais do produto. Antes de lançar cobrança de verdade, rode
  uma pesquisa de willingness-to-pay (método Van Westendorp, documentado na
  skill `pricing` em `references/research-methods.md`) e ajuste aqui.
- **Onde o gate acontece:** `FavoritesContext.addFavorite()` (`app/src/context/FavoritesContext.tsx`)
  recusa adicionar (`{ ok: false, reason: "limit_reached" }`) quando
  `!isPremium && favorites.length >= FREE_FAVORITES_LIMIT`; quem chama (hoje
  `HomeScreen`) reage navegando para a tela `Paywall`. Isso é **gate só no
  cliente** — coerente com o app não ter contas/autenticação hoje (favoritos
  já são um "melhor esforço" sincronizado com o servidor, ver seção de
  convenções abaixo), mas também significa que é tecnicamente contornável
  (reinstalar o app, editar o AsyncStorage). Aceitável para o estágio atual;
  reforçar isso exigiria contas de usuário reais, que não existem no MVP.

### Provider de compras: mock hoje, RevenueCat é o caminho para produção

`app/src/billing/` segue o mesmo padrão de fonte plugável já usado em
`liveSource.ts` (server) — uma interface (`PurchaseProvider`, em `types.ts`)
com uma implementação ativa (`mockProvider.ts`) trocável por uma real depois.

**Por que só o mock está implementado:** o SDK padrão de compras in-app para
Expo/React Native é o **RevenueCat** (`react-native-purchases`), mas é um
módulo nativo — **não roda no Expo Go**. Adicionar essa dependência tiraria o
projeto inteiro da compatibilidade com Expo Go (autolinking nativo passa a
exigir `expo-dev-client` / `eas build` para *qualquer* tela, não só o
paywall), uma mudança de fluxo de desenvolvimento que não foi pedida
explicitamente. Em vez de arriscar isso silenciosamente, o paywall foi
construído inteiro (UI, comparação de planos, gate de limite) contra um
provider simulado que roda em Expo Go sem restrição: "Assinar" só marca um
flag local (`AsyncStorage`) como premium, sem cobrança real.

**Para conectar pagamento de verdade:**
1. `npx expo install expo-dev-client && npm install react-native-purchases` —
   a partir daqui, rode com `npx expo run:ios`/`run:android` ou EAS Build, não
   mais Expo Go.
2. Configure os produtos de assinatura mensal/anual no App Store Connect e no
   Google Play Console, e o projeto correspondente no dashboard da RevenueCat.
3. Crie `app/src/billing/revenueCatProvider.ts` implementando `PurchaseProvider`
   (mesma interface do mock) e troque a exportação `provider` em
   `billing/index.ts`.
4. Não foi possível validar nada disso neste ambiente (sem conta RevenueCat,
   sem dev client, sem simulador iOS/Android) — é um caminho documentado, não
   testado.

### Modo de demonstração

A própria `PaywallScreen.tsx` deixa claro na UI que é uma simulação ("nenhuma
cobrança real é feita"). Há também um componente `DevPremiumReset` exportado
de `PaywallScreen.tsx` (não usado em nenhuma tela hoje) para desativar a
simulação durante testes manuais — importe-o temporariamente onde for
conveniente se precisar resetar o estado premium sem reinstalar o app.

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

## Testes automatizados

**Backend** (`vitest`, ESM nativo, sem transpiler extra):
```
cd server
npm test          # roda uma vez (vitest run)
npm run test:watch
```
28 testes em `server/test/`:
- `priceGenerator.test.ts`: determinismo (mesma seed → mesmo preço), conversão
  de câmbio (USD/EUR → BRL), e que preços de terça/quarta tendem a ser mais
  baratos que sexta/sábado/domingo (checado estatisticamente sobre uma amostra
  grande, já que "promoções" são probabilísticas).
- `priceService.test.ts`: `tagRecords` (o dia mais barato do calendário é
  sempre "cheap", o mais caro sempre "expensive"; os cortes de percentil
  30/70 são respeitados para todo o resto), `getDayWithNeighbors` cruzando
  virada de mês e de ano, `compareOrigins`, e que `getCalendar` usa um
  registro já cacheado (`upsertRecords`) em vez de gerar de novo.
- `cache.test.ts`: upsert idempotente (upsert duas vezes na mesma chave
  atualiza, não duplica), expiração por TTL (usando `vi.setSystemTime` —
  **atenção**: isso só finge o `Date` do JS, não a função `date('now')` do
  SQLite, que lê o relógio real do SO; o teste de janela do histórico de
  preços contorna isso "fabricando" a data no passado antes de gravar, e lendo
  com o relógio real restaurado), CRUD de favoritos, debounce de alerta
  (`markFavoriteNotified`/`resetFavoriteAlertState`), push tokens.
- `alertChecker.test.ts`: dispara e envia push quando abaixo do limite, não
  dispara quando acima, debounce (não reenvia no mesmo preço), reenvia se o
  preço cair ainda mais, e reseta o debounce quando o preço volta a subir
  acima do limite. `sendPushNotifications` é mockado (`vi.mock`) — os testes
  nunca tentam alcançar `exp.host` de verdade.

Banco de teste: `cache.ts` lê `CACHE_DB_PATH` do ambiente (`test/setup.ts`
define `:memory:`), então os testes nunca tocam `server/data/cache.sqlite`.
Isso também é útil fora dos testes — para depurar com um banco descartável,
rode com `CACHE_DB_PATH=:memory: npm run dev`.

Dois tsconfigs por causa disso: `tsconfig.json` (inclui `src` + `test`, usado
por `npm run typecheck`) e `tsconfig.build.json` (só `src`, com `rootDir`/
`outDir`, usado por `npm run build` — `tsc` reclama se `rootDir: src` tiver
que incluir arquivos de `test/`).

**App** (`jest-expo`):
```
cd app
npm test
```
14 testes:
- `utils/__tests__/currency.test.ts`: `formatBRL` — atenção que
  `Intl.NumberFormat('pt-BR')` insere um **espaço não separável (U+00A0)**
  entre "R$" e o valor, não um espaço comum; os testes usam
  `String.fromCharCode(160)` explicitamente porque um literal com espaço
  normal parece idêntico no editor/terminal mas falha em `toBe`.
- `utils/__tests__/date.test.ts`: formatação pt-BR, virada de ano.
- `components/__tests__/PriceCalendar.test.ts`: testa `groupByMonth` (exportada
  de `PriceCalendar.tsx` só para isso) — agrupamento por mês, rótulo por
  extenso, `leadingBlanks` (alinhamento do primeiro dia da semana).

Não usa `@testing-library/react-native` de propósito — nenhum teste
renderiza componentes, só exercita funções puras extraídas deles, então essa
dependência (mais pesada) não foi adicionada.

**O que ainda não tem teste automatizado**: rotas Express (validação de query
params, hoje só testada manualmente via curl — ver seção de scraper/fonte de
dados para os comandos), `liveSource.ts` (não dá pra testar contra a Amadeus
real sem credenciais), o módulo `billing/` do app (mockProvider é simples o
bastante para não ter sido priorizado), e a integração ponta-a-ponta do app
(precisaria de Detox ou similar, não configurado).

## O que é MVP vs. Fase 2

Implementado (MVP, ver escopo original do produto):
1. Tela inicial com rota padrão SP ⇄ Cascavel e calendário de melhores dias.
2. Seleção manual de ano/mês/dia com preço estimado e comparação ±3 dias.
3. Lista dos top dias mais baratos.
4. Troca de origem/destino para qualquer aeroporto nacional/internacional da lista.
5. Favoritar rota + alerta simples de preço (limite numérico).
6. Fonte de dados real (Amadeus Self-Service API) com fallback automático para o
   simulador — ver seção "Fonte de dados de preços" acima.
7. Notificações push reais via Expo Push API quando um alerta de preço dispara
   — ver seção "Notificações push" acima.
8. Gráfico de histórico/tendência de preços — ver seção "Histórico de preços"
   acima.
9. Monetização/paywall para alertas ilimitados (plano Grátis/Pro simulado)
   — ver seção "Monetização" acima. Falta a integração real de pagamento
   (RevenueCat), documentada mas não implementada por exigir sair do Expo Go.

Todos os itens do escopo original do produto (seção 8 do prompt) estão
implementados. O que resta é aprofundamento/produção: pagamento real,
scraping/API com melhor cobertura de aeroportos regionais, testes
automatizados.

## Sobre as "skills" listadas no prompt original do produto

O prompt de produto pedia para instalar várias skills de terceiros via
`npx skills add <repo-github> ...` (React Native, design mobile, scraping,
pricing, Remotion, find-skills). A pedido explícito do usuário, foram
instaladas em `.claude/skills/` (majoritariamente markdown; a exceção é
`ui-ux-pro-max/scripts/*.py`, scripts de busca BM25 sobre os CSVs de dados da
própria skill — sem rede, `eval`/`exec` ou `subprocess`, conferido antes do
commit). Vêm de repositórios de terceiros não auditados por nós; revise antes
de confiar cegamente:

- `vercel-react-native-skills`, `sleek-design-mobile-apps`, `ui-ux-pro-max`,
  `just-scrape`, `remotion-best-practices`, `find-skills`
- `pricing` (a skill do repo `coreyhaines31/marketingskills` se chama
  `pricing`, não `pricing-strategy` como no prompt original)

Essas pastas ficam versionadas dentro do repositório (não estão no
`.gitignore`) porque foi assim que a ferramenta `skills add` as gravou (em
`./.claude/skills/`, relativo ao diretório atual). Se preferir não versionar
conteúdo de terceiros junto com o código do app, mova-as para fora do repo ou
adicione `.claude/skills/` ao `.gitignore` e reinstale localmente quando
precisar.

### Como cada skill foi de fato aplicada ao código

- **`ui-ux-pro-max`**: usada para decidir o tipo de gráfico do histórico de
  preços (`python3 scripts/search.py "price trend..." --domain chart` →
  confirmou Line Chart, SVG para <1000 pontos, sem eixo duplo) e para o
  checklist de acessibilidade de charts (rótulo direto, tabela/estado
  alternativo, tooltip por toque). Também usada (junto com a skill `dataviz`,
  já embutida no agente) para validar a paleta do heatmap e do gráfico com
  `validate_palette.js` — passou; o único WARN (separação de cor para
  daltonismo entre "médio" e "caro") é aceitável porque o app já usa ícone +
  texto em todo lugar, nunca só cor.
- **`vercel-react-native-skills`**: aplicada revisando o código já escrito —
  trocou todo `TouchableOpacity` por `Pressable` (regra `ui-pressable`) com
  feedback visual de toque via `style={({pressed}) => ...}`, e nas listas
  (`PriceCalendar`, `BestDaysList`, `RouteSelectorScreen`) os estilos
  condicionais foram *hoisted* para `StyleSheet.create` no escopo do módulo em
  vez de objetos inline por iteração (regra `list-performance-inline-objects`).
  Conferido também: nenhum `{valor && <Text>}` com valor potencialmente
  numérico/string vazia (regra `rendering-no-falsy-and` — todos os `&&` no
  código já eram booleanos genuínos) e `Intl.NumberFormat` já estava hoisted
  no escopo do módulo (regra `js-hoist-intl`).
- **`sleek-design-mobile-apps`**: **não pôde ser aplicada** — é uma integração
  com a API paga do sleek.design (`SLEEK_API_KEY`), não um guia local; sem uma
  chave configurada neste ambiente, não há como gerar/consultar nada por ela.
  Se você tiver uma conta, defina `SLEEK_API_KEY` e peça de novo.
- **`just-scrape`**: revisada, mas a decisão de usar a Amadeus Self-Service
  API em vez de raspar HTML (ver "Fonte de dados de preços" acima) se mantém —
  a skill é uma ferramenta de scraping genérica e não muda o argumento de
  ToS/robustez que motivou usar uma API oficial de voos.
- **`pricing`**: não aplicada — instalar uma estratégia de monetização é uma
  decisão de produto (freemium? paywall em alertas ilimitados?) que ninguém
  pediu ainda; fica disponível para quando o assunto entrar em pauta.
- **`remotion-best-practices`** e **`find-skills`**: não se aplicam ao código
  do app (vídeo de demonstração e descoberta de outras skills,
  respectivamente); ficam disponíveis para quando forem necessárias.
