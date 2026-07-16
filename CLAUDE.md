# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repository.

## O que é este projeto

**Achalivros / Book Finder** — app de busca de livros por título, autor ou
assunto, com capa, edição e download em PDF/EPUB quando a obra é de domínio
público. Duas implementações independentes da mesma lógica de busca, sem
ferramenta de monorepo (Turborepo/Nx/workspaces) de propósito:

```
Achalivros/
  book-finder-web/   Vite + React + TypeScript (navegador)
  book-finder-app/   Expo + React Native + TypeScript (mobile)
```

Cada pasta tem `package.json`, `node_modules` e ciclo de vida de dependências
próprios, e sua própria cópia de `src/lib/` (fonte plugável, sem dependência
compartilhada entre as duas). Detalhes completos de cada implementação —
como rodar, decisões de design, o que foi testado — estão nos READMEs de cada
pasta: `Achalivros/book-finder-web/README.md` e
`Achalivros/book-finder-app/README.md`. Este arquivo cobre só o que é comum
às duas.

## Fontes de dados

Três APIs públicas, chamadas em paralelo e combinadas com deduplicação
(`src/lib/searchBooks.ts` em cada projeto):

- **Project Gutenberg via [Gutendex](https://gutendex.com)** — catálogo de
  domínio público, sempre com link direto de EPUB/PDF real. Sem chave.
- **[Google Books API](https://developers.google.com/books/docs/overview)** —
  maior cobertura de catálogo/capas; funciona sem chave (cota menor) ou com
  uma chave opcional. Só expõe link de download quando o próprio Google marca
  o título como de acesso livre — nunca para livros comerciais.
- **[Open Library](https://openlibrary.org/search.json)** — metadados/capas
  adicionais; sem chave.

Se uma fonte falhar, as outras continuam funcionando — a busca não quebra
inteira por causa de uma API fora do ar.

### Por que não Anna's Archive / LibGen

Essas fontes foram cogitadas no pedido original do produto e **não foram
integradas de propósito**: são bibliotecas-sombra que hospedam obras com
direitos autorais sem autorização dos titulares — usá-las facilitaria
violação de copyright. Não reconsidere essa decisão sem que o usuário
levante o assunto explicitamente de novo.

## Identidade visual (retrô)

Paleta e tipografia geradas com a skill `ui-ux-pro-max` (busca
`"retro vintage bookstore library book search app"`): fundo pergaminho
(`#FFFBEB`), texto tinta (`#241C15`), destaque âmbar (`#D97706`), marrom de
livro (`#92400E`), tipografia Abril Fatface (títulos) + Merriweather (corpo).
Cada implementação tem sua própria variante escura completa (testada
separadamente para contraste, não é apenas inversão de cores) — ver
`src/styles/global.css` (web) e `src/theme/colors.ts` (mobile).

**Logo:** marca em `Achalivros/brand/logo/` (conceito “marcador de página como
cursor” — um “A” bold com fita de marcador saindo do vértice). SVG puro,
variantes clara/escura e monocromática, `preview.html` para conferir escala.
Gerada com a skill `svg-design` (marketplace `tryopendata/skills`); detalhes e
uso no `README.md` da pasta.

## Skills instaladas em `.claude/skills/`

Vêm de repositórios de terceiros não auditados por nós; revise antes de
confiar cegamente. Aplicadas ao Achalivros:

- **`ui-ux-pro-max`**: paleta retrô e tipografia (acima), checklist de
  acessibilidade/contraste em ambos os temas.
- **`vercel-react-native-skills`**: aplicada em `book-finder-app` —
  `FlashList` em vez de `FlatList` (virtualização), `Pressable` em vez de
  `TouchableOpacity` com feedback via callback de `style` (nunca objeto
  inline recriado por item da lista), `expo-image` para capas, estilos por
  tema calculados uma vez via `useMemo`, componentes memoizados.
- **`sleek-design-mobile-apps`**: **não pôde ser aplicada** — depende da API
  paga do sleek.design (`SLEEK_API_KEY`), não configurada neste ambiente.
- **`find-skills`**, **`just-scrape`**, **`pricing`**,
  **`remotion-best-practices`**: não se aplicam a este produto no momento
  (descoberta de skills, scraping genérico, estratégia de monetização e
  vídeo de demonstração, respectivamente); ficam disponíveis para quando
  forem necessárias.

## Histórico

Este repositório já hospedou um primeiro projeto (monitor de preços de
passagens aéreas, pastas `server/`/`app/`) — removido a pedido do usuário.
O histórico de commits anterior a essa remoção ainda existe no git caso seja
preciso consultar decisões antigas, mas o código não faz mais parte do
repositório.
