# Análise de conversão – visão código + sua análise

Documento que cruza **sua análise de produto/UX** com o que **existe hoje no código** da home e fluxo de entrada.

---

## Visão geral – concordo

Sua conclusão bate com o que o código mostra:

- **Visual**: Hero, Statistics, ProcessSteps, Testimonials e CTASection estão bem estruturados. O site **é** bonito e confiável.
- **Conversão**: Não há elemento "conversão-first": sem sticky CTA, sem barra de progresso, sem chat, sem personalização por condição. O fluxo é linear (scroll) e pouco guiado.
- **Diferencial**: Não existe seção "Por que CannabiLize" nem comparação explícita com concorrentes.

**Concordo que o site peca em excesso de informação linear, pouco direcionamento de conversão e falta de diferenciação clara.**

---

## 1. Hero (primeira dobra)

- **Headline genérica**: No código (`HeroSection.tsx` linhas 23–26) está exatamente "Médicos prescritores de Cannabis Medicinal". Sua sugestão (dor + solução, ex.: "Tratamento com Cannabis Medicinal de forma legal, acessível e acompanhada...") é implementável direto no componente.
- **Dois CTAs competindo**: Linhas 34–47 têm "Iniciar jornada" (primário) e "Entenda como funciona" (secundário) com peso visual parecido. Faz sentido ter 1 CTA dominante e o outro em texto/link discreto.
- **Imagem decorativa**: A imagem usa overlay com "+90.000 Atendimentos" (repetindo prova social). Sua ideia de passos 1→2→3 ou dashboard real cabe no mesmo bloco.

---

## 2. Seleção de condições (PathologySelector)

- **Falta contexto clínico**: No código só há lista de labels (Alcoolismo, Ansiedade, etc.) sem microcopy nem explicação. Transformar em questionário guiado + microcopy ao clicar ("A cannabis medicinal é amplamente utilizada para esse caso...") é coerente com o componente atual.
- **Botão desabilitado**: Linhas 98–106: quando `selected.length === 0`, o botão fica cinza com `cursor-not-allowed` e `pointer-events: none`. Realmente gera frustração; questionário pode reduzir isso.
- **Dados já fluem**: O Link usa `query: { pathologies: selected.join(',') }` e a página `/agendamento` lê `searchParams.get('pathologies')` e passa `initialPathologies` ao AppointmentForm. A **passagem de dados** já existe; falta melhorar a **experiência** (questionário + microcopy).

---

## 3. Prova social (Statistics + Testimonials)

- **Prova social forte**: Statistics tem 90k atendimentos, 400k seguidores, 30k consultas, 2k depoimentos; Testimonials tem 6 depoimentos com nome, data, Google, estrelas. Está acima da média.
- **Prova social vem tarde**: Ordem na home é Hero → PathologySelector → **Statistics** → ProcessSteps → Testimonials. Levar mini prova social (⭐ 4,9/5, 👥 +90 mil) para o Hero faz sentido.
- **Depoimentos longos**: Todos os comentários são 2–4 linhas. Versões curtas (1 linha) antes dos longos é implementável nos dados do componente.

---

## 4. Processo em 4 etapas (ProcessSteps)

- **Visual excelente**: Cards, ícones, timeline, expandível "Saiba mais". Confirmado no código.
- **Linguagem institucional**: Os textos em `steps` são descritivos. Adicionar microfrases ("100% dentro da lei", "Cuidamos de toda a burocracia", "Você não fica sozinho em nenhuma etapa") não exige mudança de estrutura.
- **Detalhe**: No título aparece "CannabiLizi" (linha 60). Vale padronizar para "CannabiLize" se for o nome oficial.

---

## 5. Conteúdo (BlogPreview, EventsSection)

- **Bom para SEO, ruim para conversão**: BlogPreview tem 3 artigos + "Ver todos"; EventsSection tem 3 eventos + "Ver galeria". Nenhum CTA de conversão no meio. Inserir "Prefere falar com um médico agora?" ou mover conteúdo para depois do CTA principal é coerente com o código.

---

## 6. FAQ

- **Estrutura**: Accordion com 6 perguntas. Bem estruturado.
- **Falta agressividade comercial**: Não há "É legal no Brasil?", "Posso ter problemas com a polícia?", "O valor final é só R$50?". Basta acrescentar 2–3 itens no array `faqs` em `FAQ.tsx`.

---

## 7. UX / conversão (visão crítica)

- **Sticky CTA no mobile**: Não existe. Navbar é sticky no topo; no mobile há "Falar com Especialista" no menu, mas não CTA fixo no bottom tipo "Iniciar tratamento".
- **Barra de progresso**: Não existe ("Você está a X passos do seu tratamento").
- **Chat contextual**: Não existe.
- **Personalização por condição**: Conteúdo da home é estático; `pathologies` só vai na URL para o agendamento. Tudo que você listou como "implementar urgentemente" realmente **não está** no código.

---

## 8. Diferencial competitivo

- Não há seção "Por que CannabiLize" nem comparação com Click Cannabis ou outros. EventsSection menciona "Click Runner" como evento, não como posicionamento. Sua sugestão (atendimento, burocracia, preço, acompanhamento, plataforma) exige bloco novo na home.

---

## Resumo e prioridade sugerida

- **Concordo em tudo** com sua visão geral e com os problemas por seção.
- O que você descreveu está alinhado com o código; não há contradição.

**Prioridade sugerida:**

1. **Rápido (só copy):** Headline e subheadline do Hero, microfrases no ProcessSteps, novas perguntas no FAQ, mini prova social no Hero.
2. **Médio (componentes existentes):** Um CTA dominante no Hero, CTAs no meio de Blog/Events, versões curtas de depoimentos.
3. **Maior (novo comportamento):** PathologySelector em questionário + microcopy, sticky CTA mobile, barra de progresso, seção "Por que CannabiLize".
4. **Futuro:** Chat contextual, personalização por condição.

Se quiser, na próxima etapa podemos desenhar as mudanças exatas (textos e props) para Hero, FAQ e ProcessSteps e implementar em código.
