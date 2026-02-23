# Análise: Hierarquia de Atenção (micro-ajustes)

## Diagnóstico

Em várias seções da landing e páginas institucionais há **muitos elementos competindo** pela atenção ao mesmo tempo:

- **Ícones** + **títulos** + **textos** + **badges**
- Pouco respiro vertical entre blocos
- Títulos e textos secundários com peso visual parecido

Isso dilui o foco e dificulta a leitura em ordem lógica (título → subtítulo → conteúdo).

---

## Seções analisadas

| Seção | Elementos em competição | Observação |
|-------|-------------------------|------------|
| **HeroSection** | Badge + H1 + subheadline + CTA + mini prova social (estrelas + avatares) | Tudo no mesmo “bloco”; subheadline pode ficar mais leve. |
| **ConsumptionForms** | Título + badge ANVISA + badgeSub | Cabeçalho denso; texto do badge secundário pode ser mais discreto. |
| **ProcessSteps** | Badge “Processos” + subtítulo + cards (badge “Etapa N” + título + ícone + texto) | Vários níveis no mesmo card; respiro entre badge e título ajuda. |
| **Statistics** | Badge “Números que Comprovam” + H2 + parágrafo | Parágrafo pode ser mais leve (opacidade/cor). |
| **FAQ** | H2 + parágrafo introdutório | Pouco espaço entre título e texto; parágrafo pode ser mais secundário. |
| **CTASection** | Ícone + H2 + parágrafo + 3 benefits + CTA + trust indicators | Muita informação; subtítulo e benefits podem ser mais leves. |
| **AboutDifferentials** | H2 + cards (ícone + título + descrição) | Descrições podem ser mais leves; mais espaço no card. |
| **AboutTeam** | Badge + H2 + parágrafo + cards (foto + badge experiência + ícone + nome + cargo + CRM + especialização + bio) | Card muito denso; cargos/especialização podem ser mais secundários. |
| **Testimonials** | Badge + H2 + parágrafo + cards (estrelas + “Destaque” + quote + autor + badge fonte) | Mesmo padrão de cabeçalho; subtítulo mais leve. |

---

## Princípios dos micro-ajustes

1. **Respiro vertical**  
   Aumentar um pouco `space-y`, `mb-*` ou `gap` entre:
   - badge e título
   - título e subtítulo/parágrafo
   - blocos de conteúdo (ex.: cabeçalho da seção vs. grid)

2. **Títulos levemente mais fortes**  
   Sem mudar estrutura:
   - `font-bold` → `font-extrabold` onde fizer sentido
   - ou manter `font-bold` e garantir `tracking-tight` / tamanho adequado para o título ser o primeiro elemento a “puxar” o olhar

3. **Textos secundários mais leves**  
   Reduzir peso visual dos subtítulos e descrições:
   - `text-gray-600` → `text-gray-500`
   - Em fundos escuros: `text-white/90` → `text-white/80` (ou similar)
   - Manter contraste de acessibilidade (não ir abaixo de ~4.5:1 onde for texto longo)

4. **Nada estrutural**  
   Não alterar ordem de elementos, nem remover ícones/badges; apenas refinamento de espaçamento e peso visual.

---

## Ajustes aplicados (resumo)

- **HeroSection**: Mais espaço entre badge e H1; subheadline `text-gray-500`; H1 com `tracking-tight`.
- **ConsumptionForms**: Cabeçalho com mais `mb-*`; título com `tracking-tight`; badgeSub `text-gray-500`.
- **ProcessSteps**: Mais respiro no cabeçalho e nos cards (badge → título); subtítulo e descrições mais leves.
- **Statistics**: Mais espaço no cabeçalho; parágrafo `text-white/80`.
- **FAQ**: Mais `mb-*` no cabeçalho; parágrafo `text-gray-500`.
- **CTASection**: Mais espaço entre bloco de título e benefits; parágrafo e trust indicators mais leves.
- **AboutDifferentials**: Mais espaço no card; descrição `text-gray-500`.
- **AboutTeam**: Cabeçalho com mais respiro; no card, role/specialization mais leves.
- **Testimonials**: Cabeçalho com mais respiro; parágrafo `text-gray-500`.

---

## Resultado esperado

- **Ordem de leitura** mais clara: badge → título → subtítulo → conteúdo.
- **Menos competição** entre ícones, títulos e textos.
- **Sensação de “respiro”** sem mudar layout ou estrutura.
- **Refinamento visual** apenas com espaçamento e hierarquia tipográfica.
