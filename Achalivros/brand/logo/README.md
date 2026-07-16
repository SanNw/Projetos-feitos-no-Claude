# Logo — achalivros

Marca do achalivros (site + bot de busca de livros). Conceito **“marcador de
página como cursor”**: um “A” geométrico bold do qual sai, pelo vértice
superior, uma **fita de marcador de página** que cai para a direita com uma
dobra suave e termina em recorte em **V invertido** (rabo de fita clássico). A
leitura dupla — letra “A” de *achalivros* + ponteiro/cursor — reforça a ideia
de *achar* (buscar, navegar).

SVG puro, `viewBox="0 0 200 200"`, sem dependências externas, sem fontes
embutidas (texto vira `<path>`).

## Cores

| Papel | Hex |
|-------|-----|
| “A” (principal, fundo claro) | `#1A1A2E` (azul-marinho quase preto) |
| “A” (fundo escuro) | `#F2F0F5` (off-white) |
| Fita — variante vermelha | `#E63946` |
| Fita — variante laranja | `#F4A261` |

## Arquivos

| Arquivo | Uso |
|---------|-----|
| `achalivros-logo-color.svg` | Colorido, fita **vermelha**, fundo claro |
| `achalivros-logo-color-orange.svg` | Colorido, fita **laranja**, fundo claro |
| `achalivros-logo-color-dark.svg` | Fita vermelha, “A” off-white — **fundo escuro** |
| `achalivros-logo-color-orange-dark.svg` | Fita laranja, “A” off-white — **fundo escuro** |
| `achalivros-logo-mono.svg` | **Monocromático** (só contorno, 1 cor `#1A1A2E`), para papelaria/carimbo/1 cor |
| `preview.html` | Comparação lado a lado em fundo claro/escuro nos tamanhos 200 / 64 / 32px |

Abra `preview.html` no navegador para avaliar legibilidade em escala.

## Notas de uso

- **Favicon / avatar de bot (16–32px):** use a versão **colorida**. O recorte
  em V da fita simplifica-se em ponto nessa escala, mas o contraste
  tinta/destaque preserva a forma do “A + marcador”.
- **Monocromático:** pensado para **48px+**. Abaixo disso as linhas internas do
  contorno se aproximam. Para fundo escuro, recolorir o traço para off-white
  (`#F2F0F5`).
- **Fundo escuro:** o `#1A1A2E` do “A” some em fundos escuros — use sempre as
  variantes `-dark`.

Design derivado da skill `svg-design` (marketplace `tryopendata/skills`),
alinhado à identidade retrô do produto descrita no `CLAUDE.md` da raiz.
