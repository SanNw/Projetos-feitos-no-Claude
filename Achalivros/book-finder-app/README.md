# Achalivros · Book Finder (mobile)

Versão Expo/React Native do Book Finder — mesma busca (título/autor/assunto),
mesmas três fontes de dados, mesma identidade visual retrô do app web
(`../book-finder-web`), adaptada para mobile.

## Rodando localmente

```bash
npm install
npm start            # abre o Metro/Expo Dev Tools
npm run android       # ou npm run ios / npm run web
npm run typecheck
```

Sem variáveis de ambiente obrigatórias — chama as mesmas APIs públicas
diretamente do dispositivo.

## Fontes de dados

Idênticas ao app web (`src/lib/`, cópia independente — mesmo padrão do
projeto irmão `monitor-de-passagens` neste monorepo, que mantém
`offlineGenerator.ts` como cópia client-side do gerador do servidor em vez de
uma dependência compartilhada):

- Project Gutenberg via Gutendex — sempre com EPUB/PDF real (domínio público)
- Google Books API — catálogo maior, download só quando o próprio Google
  marca o título como livre
- Open Library — metadados/capas adicionais

Anna's Archive e LibGen **não foram integradas** — são bibliotecas-sombra que
hospedam obras com direitos autorais sem autorização; ver o README do app web
para o detalhe completo dessa decisão (vale para os dois apps).

## Identidade visual (retrô)

Mesma paleta do app web — `src/theme/colors.ts` (`lightPalette`/`darkPalette`),
seguida automaticamente pelo tema do sistema via `usePalette()` (`useColorScheme`).
Tipografia Abril Fatface (títulos) + Merriweather (corpo), carregada via
`@expo-google-fonts/*` (funciona em Expo Go, sem plugin nativo).

## Boas práticas de React Native aplicadas

Via a skill `vercel-react-native-skills`:

- `FlashList` (não `FlatList`) para a lista de resultados — `list-performance-virtualize`
- `Pressable` em vez de `TouchableOpacity`, com feedback de toque via callback
  de `style`, nunca objeto inline recriado por item — `ui-pressable`,
  `list-performance-inline-objects`
- `expo-image` para todas as capas (cache + placeholder) — `ui-expo-image`
- Estilos por tema calculados uma vez por `useMemo(palette)`, não por item da
  lista, e cada card é `React.memo` — `list-performance-item-memo`
- `hitSlop`/altura mínima 44pt em todo alvo tocável, `accessibilityLabel` em
  todo botão só-ícone

A skill `sleek-design-mobile-apps` **não pôde ser usada** — depende da API
paga do sleek.design (`SLEEK_API_KEY`), não configurada neste ambiente (mesma
limitação já documentada no projeto irmão deste monorepo).

## User stories cobertas

- [x] Input de busca (`TextInput`) + submit chama as três APIs
- [x] Lista (`FlashList`) com título, autor(es), data, capa
- [x] Link externo "Mais informações" por item (`expo-linking`)
- [x] Download EPUB/PDF quando disponível legalmente
- [x] Layout responsivo por `SafeAreaView`/`useColorScheme` (claro/escuro)
- [x] Skeleton animado durante o carregamento (`Animated`, respeita
      redução de movimento do sistema)

## O que não foi testado

Não foi possível rodar isto em um simulador/emulador real neste ambiente (sem
Xcode/Android Studio disponíveis) — o código foi revisado estaticamente
(`tsc --noEmit`) mas não exercido em um dispositivo. Ao rodar localmente,
confirme no Expo Go que: a busca retorna resultados, os links abrem no
navegador do dispositivo, e o tema escuro tem contraste adequado.
