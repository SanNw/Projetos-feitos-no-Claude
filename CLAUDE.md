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
6. Fonte de dados real (Amadeus Self-Service API) com fallback automático para o
   simulador — ver seção "Fonte de dados de preços" acima.
7. Notificações push reais via Expo Push API quando um alerta de preço dispara
   — ver seção "Notificações push" acima.
8. Gráfico de histórico/tendência de preços — ver seção "Histórico de preços"
   acima.

Ainda não implementado (fase 2, mencionados no prompt original do produto):
- Monetização/paywall para alertas ilimitados.

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
