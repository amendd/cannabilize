# Página Laudo Agronômico — Diretrizes e Compliance

Este documento descreve a estrutura da página institucional **Conexão com Engenheiro Agrônomo (Laudo Agronômico)**, as diretrizes de UI/UX, o checklist de compliance e os pontos de atenção legal.

---

## 1. Objetivo da página

- **Informar** o usuário sobre um serviço adicional e **opcional**.
- **Explicar** como funciona a conexão com o engenheiro agrônomo.
- Deixar explícito que:
  - A plataforma **não garante** laudo.
  - O laudo depende de **análise técnica independente**.
  - O pagamento refere-se ao **serviço profissional** do engenheiro.

---

## 2. Público-alvo

- Pacientes que já passaram por consulta médica na plataforma.
- Usuários que receberam receita.
- Pessoas que buscam **orientação técnica complementar**, não autorização automática.

**Linguagem:** clara, acessível, profissional, sem jargões excessivos.

---

## 3. Estrutura da página (entregue)

| Seção | Conteúdo |
|-------|----------|
| **Hero** | Headline institucional, subheadline explicativa, CTA “Entenda como funciona”. |
| **Como funciona** | 4 passos: consulta → receita → solicitação opcional → avaliação independente. |
| **O que é a análise agronômica** | Papel do engenheiro, o que é o laudo, o que ele não é. |
| **Serviço opcional e independente** | Destaque de compliance: opcional, independente, plataforma só conecta, pagamento = serviço. |
| **Transparência sobre pagamento** | Quando paga, pelo que paga, que não garante laudo. |
| **Benefícios para o usuário** | Orientação técnica, análise responsável, clareza, mais informação (sem promessa de resultado). |
| **Para quem faz / não faz sentido** | Duas colunas: quem busca orientação x quem espera garantias automáticas. |
| **FAQ** | 7 perguntas com respostas transparentes (laudo garantido? plataforma emite? engenheiro independente? obrigatório? pagamento garante? substitui lei? uso em qualquer região?). |
| **Avisos legais** | Legalidade por região, caráter técnico/informativo, responsabilidade do usuário, plataforma não substitui órgãos. |
| **CTA final** | Discreto: agendar consulta e tirar dúvidas no WhatsApp. |

---

## 4. Copywriting e tom de voz

- **Institucional e profissional.**
- **Educativo e neutro** — clareza acima de persuasão.
- **Sem promessas implícitas** (ex.: “garantimos”, “você terá”, “100% aprovado”).
- **Sem gatilhos agressivos** (urgência falsa, escassez enganosa).

**Exemplos de headlines usadas:**
- “Avaliação agronômica profissional como próximo passo opcional”
- “Conectamos você a especialistas técnicos, quando fizer sentido”

**Microcopy de botões:**
- “Entenda como funciona” (hero)
- “Agendar consulta” / “Tirar dúvidas no WhatsApp” (final)

---

## 5. Diretrizes de UI/UX

- **Estilo:** clean, confiável e técnico.
- **Cores:** paleta neutra e natural (verde suave, cinzas, âmbar leve na seção de compliance).
- **Tipografia:** hierárquica e legível; títulos em negrito, corpo em tamanho confortável.
- **Cards:** bem espaçados, bordas suaves, sombra leve.
- **Destaque:** informações críticas (opcional, independente, pagamento não garante) em evidência visual, não como “venda”.
- **Mobile-first:** seções empilhadas, CTAs em coluna em telas pequenas.
- **Acessibilidade:** contraste adequado, tamanho de fonte legível, áreas de toque ≥ 44px, labels/aria onde necessário.

---

## 6. Checklist de compliance

Antes de publicar ou após alterações de copy, conferir:

- [ ] Em nenhum lugar está escrito que o laudo é garantido.
- [ ] Está explícito que o serviço é **opcional**.
- [ ] Está explícito que o engenheiro atua de forma **independente**.
- [ ] Está explícito que a plataforma **apenas conecta** (não emite laudo).
- [ ] Está explícito que o **pagamento** é pelo serviço profissional, não pela emissão do laudo.
- [ ] Está claro que o laudo **não substitui** exigências legais/regulatórias.
- [ ] Avisos legais visíveis (responsabilidade do usuário, legislação local).
- [ ] FAQ responde objetivamente: laudo garantido? plataforma emite? obrigatório? pagamento garante?
- [ ] Nenhuma linguagem sugere automatismo ou “aprovação certa”.

---

## 7. Pontos de atenção legal

- **Revisão jurídica:** esta página pode ser revisada por advogados e órgãos reguladores; manter tom factual e limites do serviço.
- **Regionalidade:** deixar claro que legalidade e uso do laudo dependem da legislação de cada região.
- **Independência do profissional:** não criar vínculo de subordinação entre plataforma e engenheiro na comunicação.
- **Pagamento:** não vincular valor à “emissão de laudo” e sim ao “serviço de análise técnica”.
- **Atualização:** revisar textos sempre que houver mudança no fluxo, na oferta ou na regulamentação.

---

## 8. Sugestões de evolução futura

- **Link no Navbar:** incluir “Laudo Agronômico” no menu principal se o produto ganhar mais destaque.
- **Formulário de solicitação:** página ou fluxo na área do paciente para “Solicitar análise agronômica” (após consulta + receita), com termos claros e valor exibido antes do pagamento.
- **Testes A/B:** testar variações de headline e da seção “Para quem faz sentido” para conversão informada (sem comprometer compliance).
- **Conteúdo extra:** blog ou FAQ expandido sobre “O que é laudo agronômico” e diferença em relação a outros documentos.
- **Métricas:** acompanhar visualizações da página, cliques em “Entenda como funciona” e solicitações do serviço para orientar evolução de copy e UX.

---

## 9. Rota e arquivos

- **Rota:** `/laudo-agronomico`
- **Página:** `app/laudo-agronomico/page.tsx`
- **Layout (metadata):** `app/laudo-agronomico/layout.tsx`
- **Link no site:** Footer → “Laudo Agronômico”

A página foi desenvolvida priorizando **ética, clareza, independência profissional e segurança jurídica**, adequada a revisão por profissionais jurídicos e regulatórios.
