# Achalivros · Book Finder (web)

App web para buscar livros por título, autor ou assunto e ver capa, edição, e
links para saber mais — com download direto em PDF/EPUB quando a obra é de
domínio público. SPA em React + TypeScript + Vite, sem backend próprio: todas
as chamadas de API são feitas direto do navegador.

## Rodando localmente

```bash
npm install
npm run dev          # abre em http://localhost:5173
npm run typecheck
npm run build         # build de produção em dist/
```

Nenhuma variável de ambiente é obrigatória. Veja `.env.example` — opcionalmente
defina `VITE_GOOGLE_BOOKS_API_KEY` para aumentar a cota do Google Books.

## Fontes de dados

Três APIs públicas, chamadas em paralelo e combinadas (`src/lib/searchBooks.ts`):

- **Project Gutenberg via [Gutendex](https://gutendex.com)** (`src/lib/gutendex.ts`)
  — catálogo de domínio público, sempre com link direto de EPUB/PDF real. Sem
  chave, CORS liberado.
- **[Google Books API](https://developers.google.com/books/docs/overview)**
  (`src/lib/googleBooks.ts`) — maior cobertura de catálogo/capas; funciona sem
  chave (cota menor) ou com `VITE_GOOGLE_BOOKS_API_KEY`. Só expõe link de
  download quando o próprio Google marca o título como de acesso livre —
  nunca para livros comerciais.
- **[Open Library](https://openlibrary.org/search.json)**
  (`src/lib/openLibrary.ts`) — metadados/capas adicionais; sem chave.

Se uma fonte falhar (rede, rate limit), as outras duas continuam funcionando —
o app mostra um aviso discreto em vez de quebrar a busca inteira
(`failedSources` em `useBookSearch`).

### Por que não Anna's Archive / LibGen

O pedido original citava Anna's Archive e LibGen como fontes. Não foram
integradas: são bibliotecas-sombra que hospedam obras com direitos autorais
sem autorização dos titulares — usá-las facilitaria violação de copyright.
Também foi descartado o wrapper RapidAPI de Project Gutenberg sugerido no
pedido, em favor do Gutendex (mesmo catálogo público, sem exigir chave paga).

**Nota de segurança:** uma chave do RapidAPI (`53d5bfd757...`) foi colada em
texto puro na conversa que originou este projeto. Ela não foi usada em nenhum
lugar do código — mas como ficou exposta em texto simples, é recomendável
revogá-la/girá-la no painel do RapidAPI.

## Identidade visual (retrô)

Paleta e tipografia geradas com a skill `ui-ux-pro-max` (busca
`"retro vintage bookstore library book search app"`) e ajustadas para o tom do
app — "marrom de livro + âmbar de página": fundo pergaminho (`#FFFBEB`),
texto tinta (`#241C15`), destaque âmbar (`#D97706`), tipografia
Abril Fatface (títulos) + Merriweather (corpo). Tokens em
`src/styles/global.css`, com variante escura completa (não é apenas inversão
de cores — testada separadamente para contraste). Toggle de tema em
`ThemeToggle.tsx`, persistido em `localStorage`.

## Estrutura

```
src/
  types.ts              BookResult, BookSource
  lib/                  clientes de API + orquestrador searchBooks
  hooks/useBookSearch.ts estado de busca (idle/loading/success/error)
  components/           SearchBar, BookList, BookCard, SkeletonCard,
                         EmptyState, ErrorState, Header, ThemeToggle
  styles/global.css      tokens de tema (claro/escuro)
```

## User stories cobertas

- [x] Input de busca + submit chama as três APIs e mostra a lista
- [x] Lista com título, autor(es), data de publicação, capa
- [x] Link externo "Mais informações" por item
- [x] Download direto EPUB/PDF quando a fonte disponibiliza legalmente
- [x] Design responsivo (grid `auto-fill`, breakpoint mobile no formulário)
- [x] Animação de loading (skeleton cards com shimmer, respeita
      `prefers-reduced-motion`)

## O que não foi testado

Não há suíte de testes automatizados neste projeto ainda (nenhuma foi pedida).
O fluxo foi verificado rodando o dev server e testando buscas reais contra as
três APIs. Não foi possível testar `VITE_GOOGLE_BOOKS_API_KEY` com uma chave
real neste ambiente.
