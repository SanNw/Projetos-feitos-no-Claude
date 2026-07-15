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

Cinco APIs públicas, chamadas em paralelo e combinadas (`src/lib/searchBooks.ts`):

- **Project Gutenberg via [Gutendex](https://gutendex.com)** (`src/lib/gutendex.ts`)
  — catálogo de domínio público, sempre com link direto de EPUB/PDF real. Sem
  chave, CORS liberado.
- **[Internet Archive](https://archive.org/advancedsearch.php)**
  (`src/lib/internetArchive.ts`) — acervo de scans de livros. A maior parte é
  empréstimo controlado (DRM, não é download real), então cada resultado é
  filtrado pelo flag `access-restricted-item` do próprio archive.org — duas
  vezes: no índice de busca (`advancedsearch.php`) e de novo na resposta de
  metadados por item (`/metadata/{id}`), já que o nome real do arquivo
  EPUB/PDF não é previsível a partir do identificador e precisa ser resolvido
  ali. Só itens de acesso aberto com um arquivo real entram na lista. Sem
  chave.
- **[Standard Ebooks](https://standardebooks.org)** (`src/lib/standardEbooks.ts`)
  — edições revisadas/formatadas profissionalmente de obras já em domínio
  público. Sem API JSON própria (o feed OPDS `/feeds/opds/all` é grande
  demais para busca em tempo real — chega a estourar timeout), então isso
  faz parsing do HTML de busca (`/ebooks?query=...`) com `DOMParser` — a
  página, incomum para uma rota HTML normal, permite leitura cross-origin
  (confirmado direto contra o site). Nunca tem flag de restrição para
  checar (diferente do Internet Archive): todo item listado é de fato
  domínio público. Só produz EPUB, nunca PDF — `downloads.pdf` nunca é
  preenchido por essa fonte. É também a única fonte cujos links de download
  respondem a CORS, então a verificação de link quebrado (abaixo) funciona
  de verdade aqui, sem a limitação que afeta gutenberg.org/archive.org. Sem
  chave.
- **[Google Books API](https://developers.google.com/books/docs/overview)**
  (`src/lib/googleBooks.ts`) — maior cobertura de catálogo/capas; funciona sem
  chave (cota menor) ou com `VITE_GOOGLE_BOOKS_API_KEY`. Só expõe link de
  download quando o próprio Google marca o título como de acesso livre —
  nunca para livros comerciais.
- **[Open Library](https://openlibrary.org/search.json)**
  (`src/lib/openLibrary.ts`) — metadados/capas adicionais; sem chave.

Se uma fonte falhar (rede, rate limit), as outras continuam funcionando — o
app mostra um aviso discreto em vez de quebrar a busca inteira
(`failedSources` em `useBookSearch`).

### Verificação de link quebrado

Todo botão de download (`DownloadButton`) verifica o link antes de abrir e
troca automaticamente para outro candidato do mesmo formato se o primeiro
falhar (`findWorkingLink`, em `src/lib/downloadLinkCheck.ts` — candidatos vêm
do merge entre fontes que apontam pro mesmo livro, em `searchBooks.ts`).
**Limitação conhecida:** sem backend, a verificação depende de `fetch` no
navegador, que esbarra em CORS — nem gutenberg.org nem archive.org enviam
cabeçalhos CORS nos links de download, então a checagem captura falhas reais
de rede (domínio fora do ar, DNS) mas não consegue sempre distinguir um link
"removido" (404) de um funcionando nesses hosts. Ver o comentário em
`downloadLinkCheck.ts` para o detalhe completo.

### Como adicionar uma nova fonte

Ver o comentário no array `sources` em `src/lib/searchBooks.ts` — tem o passo
a passo completo (arquivo a criar, contrato de retorno, onde registrar).


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
  components/           SearchBar, BookList, BookCard, DownloadButton,
                         SkeletonCard, EmptyState, ErrorState, Header,
                         ThemeToggle
  styles/global.css      tokens de tema (claro/escuro)
```

## User stories cobertas

- [x] Input de busca + submit chama as cinco APIs e mostra a lista
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
