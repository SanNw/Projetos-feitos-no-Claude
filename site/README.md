# Daf Encadernações — landing page

Site institucional de uma página para a Daf Encadernações (Daf Ateliê), um
ateliê de encadernação artesanal. HTML/CSS/JS estático, sem build step —
abra `index.html` direto no navegador ou sirva a pasta com qualquer servidor
estático (`npx serve site`, `python3 -m http.server`, etc.).

Este projeto não tem relação com o app de monitoramento de passagens
(`app/`, `server/`) descrito no `CLAUDE.md` da raiz do repositório — é um
projeto independente dentro do mesmo monorepo de portfólio.

## Origem do design

Implementado a partir do projeto Claude Design "Landing page design system"
(`https://claude.ai/design/p/4e32ad13-f609-4953-b9da-e4c585f76a36`), que por
sua vez referencia o design system "Ateliê de Encadernação Artesanal"
(estilo **Scriptorium Medieval** — parchment/ink/gold/lapis, cantos quase
quadrados, ornamento girih). Duas telas foram fornecidas — `Landing Page.dc.html`
(desktop) e `Landing Page Mobile.dc.html` — e foram unificadas aqui num único
`index.html` responsivo (breakpoint em 640px) em vez de dois arquivos
separados, já que é o mesmo conteúdo com layout adaptado.

- `tokens/` — tokens de cor/tipografia/espaçamento/forma/componentes,
  copiados verbatim do design system (fonte da verdade para retheme).
- `styles.css` — estilos da página que consomem os tokens.
- `script.js` — scroll-spy do menu, carrossel de galeria (mobile) e envio
  simulado do formulário de contato.
- `assets/hero-manuscrito.png` — imagem de fundo do hero, também herdada do
  design project.

**Limitações herdadas da fonte** (ver `readme.md` do design system): nenhuma
foto real do ateliê foi fornecida — a galeria usa painéis de placeholder
("[ foto do trabalho do ateliê — placeholder ]"); nenhum logo foi fornecido —
a marca é só tipografia (`--font-display`); os depoimentos e a cópia de
serviços são os textos de exemplo do brief original, não conteúdo real do
negócio. Substitua por fotos/depoimentos reais antes de publicar.

**Formulário de contato**: sem backend. O envio hoje só troca o formulário
por uma mensagem de agradecimento no cliente (`script.js`) — nada é
persistido ou enviado por e-mail. Para receber os pedidos de verdade, plugue
um serviço de formulário (Formspree, um endpoint próprio, etc.) no
`action`/`fetch` do `#contactForm`.

## Skills aplicadas

A pedido do usuário, os princípios das skills abaixo (já instaladas em
`.claude/skills/`, ver `skills-lock.json` na raiz) foram aplicados na
implementação:

- **`ui-ux-pro-max`** — usada para o checklist de acessibilidade/UX
  (`Skill` invocado com o contexto da paleta "Scriptorium Medieval").
  Aplicado: contraste de texto (ink-900 sobre parchment ≈ 11:1; texto
  "muted" a 65% de opacidade ainda fica ≈ 5:1, acima do mínimo AA de 4.5:1 —
  verificado manualmente, não só copiado da documentação da fonte);
  `touch-target-size` (CTAs e inputs com `min-height: 44px`; os dots da
  galeria mobile têm hitbox de 44×44px embora o dot visual continue em
  10px); `viewport-meta` e `mobile-first` (breakpoint único em 640px,
  grids `auto-fit` que colapsam para 1 coluna sem precisar de regra extra);
  `heading-hierarchy` (h1 único no hero, h2 por seção, h3 nos cards);
  `skip-links` (link "Pular para o conteúdo principal"); `focus-states`
  (`:focus-visible` com o `--focus-ring` lapis do design system, em vez de
  remover o outline padrão); `reduced-motion` (o carrossel da galeria não
  faz auto-advance quando `prefers-reduced-motion: reduce`, além do reset
  global de transições já presente em `tokens/shape.css`); `tap-delay`
  (`touch-action: manipulation` em links/botões); `image-dimension`
  (`width`/`height` na imagem do hero, evita layout shift);
  `input-type-keyboard`/`autofill-support` (`type="email"`,
  `autocomplete="name|email"`); `aria-live-errors`/`toast-accessibility`
  adaptado para sucesso (`role="status" aria-live="polite"` na confirmação
  do formulário, com foco movido para lá após o envio).
- **`vercel-react-native-skills`** — as regras são escritas para React
  Native, então foram traduzidas por princípio (não por regra literal) para
  HTML/CSS estático, já que este não é um app RN:
  - `list-performance-inline-objects` → o `.dc.html` de origem tinha um
    objeto de estilo inline por card/passo/link repetido; aqui cada padrão
    repetido (`.card`, `.step`, `.site-header__nav a`, `.quote`) é uma
    classe CSS única, então o navegador não recalcula um objeto de estilo
    por elemento da lista.
  - `ui-pressable` (feedback de toque real) → os estados hover/active dos
    botões, que no bundle original eram implementados com `React.useState`
    (`onMouseEnter`/`onMouseDown`), viraram pseudo-classes CSS
    (`:hover`, `:active`, `:focus-visible`) — mais barato que reimplementar
    estado em JS para algo que a plataforma já faz nativamente.
  - `rendering-no-falsy-and` → o princípio geral (não deixar a UI depender
    de um valor "falsy" renderizado por acidente) foi respeitado evitando
    qualquer `if (count) {...}` ambíguo no `script.js` (os `if` de
    `track`/`dotsContainer`/`form`/`success` checam presença de elemento,
    não um número/string que pudesse ser `0`/`""`).
  - `js-hoist-intl` → não há formatação `Intl` nesta página; o princípio
    equivalente aplicado foi montar os `dots` da galeria uma única vez no
    load (não a cada scroll/clique).
- **`sleek-design-mobile-apps`** — como já registrado no `CLAUDE.md` da
  raiz para o app mobile, esta skill é uma integração com a API paga do
  sleek.design (precisa de `SLEEK_API_KEY`); sem uma chave configurada neste
  ambiente não há como gerar/consultar nada por ela. Os princípios gerais de
  UX mobile que ela mesma documenta (touch targets, hierarquia, espaçamento)
  foram aplicados manualmente na versão responsiva (ver breakpoint de
  640px em `styles.css`: nav reduzida a 3 links, cards em coluna única,
  timeline vertical, carrossel com dots em vez de grid).
- **`find-skills`** — skill de meta-descoberta (achar outras skills
  instaláveis); não há nada para "aplicar ao código" aqui, fica disponível
  caso surja necessidade de uma capability nova mais adiante.

## O que falta para produção

- Fotos reais do ateliê (substituir os placeholders da galeria).
- Depoimentos reais de clientes.
- Backend real para o formulário de contato.
- Favicon / ícone de aba (nenhum foi fornecido pela fonte de design).
