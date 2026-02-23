# Guia: Qual ferramenta usar para WhatsApp após ban na API oficial

**Contexto:** Você tentou integrar diretamente com a API oficial do WhatsApp (Meta) e foi banido. Este guia ajuda a escolher a melhor solução com base nas suas demandas: **integração, notificações, captação de informações, documentos e integração com a plataforma**. Também responde se o ideal é **chatbot** ou **IA com WhatsApp**.

---

## 1. Suas demandas (mapeadas no seu projeto)

| Demanda | O que você já tem / precisa |
|--------|-----------------------------|
| **Notificações** | Confirmação de consulta, pagamento, receita emitida, lembretes (24h, 1h, 5 min), convite para adiantar, alertas para admin/médico |
| **Captação** | Funil site → WhatsApp (patologia + nome), link `wa.me` com texto pré-preenchido, mensagem de boas-vindas, qualificação (tempo de sofrimento, tratamentos, etc.) |
| **Documentos** | Envio de link da receita (PDF) por WhatsApp |
| **Integração com a plataforma** | Webhook de status, histórico em banco (`WhatsAppMessage`), templates, admin em `/admin/whatsapp` |
| **Respostas automáticas** | Hoje o webhook só trata status (entregue/lido). Falta tratar **mensagens recebidas** para fluxo de qualificação e respostas automáticas |

---

## 2. Por que o ban acontece (API oficial direta)

Causas comuns quando se usa a **API oficial da Meta diretamente**:

- **Envio sem opt-in** – Mensagens para quem não iniciou contato ou não autorizou (lista fria).
- **Uso fora do modo desenvolvimento** – Número em produção sem verificação do negócio (Business Verification).
- **Templates não aprovados** – Envio de texto livre fora da janela de 24h ou templates rejeitados.
- **Padrão de spam** – Muitas mensagens idênticas, disparos em massa, muitos usuários reportando.
- **Número de teste** – Uso do número “Até” em produção ou para muitos destinatários.

Isso não significa que a API oficial seja “ruim”; significa que o uso precisa ser **dentro das regras** e, em muitos casos, **via parceiro (BSP)** reduz erros de configuração e melhora suporte.

---

## 3. Recomendação geral: **API oficial via parceiro (BSP) + bot com fluxos**

Para o seu cenário (telemedicina, notificações, captação, documentos, integração):

- **Não use** APIs não oficiais (Evolution API, Baileys, WPPConnect, etc.) para produção. Elas violam os termos do WhatsApp e trazem risco alto de **banimento permanente** e insegurança (dados passando por terceiros). Para uma plataforma de saúde, isso é inaceitável.
- **Use a mesma API oficial**, mas **via um parceiro (BSP)**:
  - Menos chance de erro de configuração.
  - Suporte e documentação.
  - Possibilidade de usar um **novo número** (importante após ban).

**Sobre chatbot vs IA:**

- **Chatbot com fluxos (regras)** – Ideal para:
  - Captação (boas-vindas, perguntas de qualificação, envio de link de pagamento e de agendamento).
  - Respostas automáticas por etapa (ex.: “qual sua patologia?”, “enviando link de pagamento”).
  - Não depende de aprovação especial da Meta; é uso padrão da API.
- **IA generativa (ex.: ChatGPT no WhatsApp)** – Útil para dúvidas abertas e FAQ, mas:
  - A Meta está restringindo chatbots de IA de “uso geral” (política 2026).
  - Continua permitido para contextos empresariais concretos (atendimento, vendas, notificações).
  - Se quiser IA, use em cenários claros (ex.: FAQ, triagem) e com provedor que deixe claro conformidade com as políticas.

Ou seja: **o ideal é um chatbot com fluxos definidos** (e, se quiser, IA só em partes específicas e conformes).

---

## 4. Opções de ferramenta (por cenário)

### Opção A – Continuar com **Twilio** (você já tem no código)

- **Vantagem:** Já integrado (`lib/whatsapp.ts`, prioridade META depois TWILIO). Só configurar com um **novo número** (não o que foi banido).
- **Uso:** Envio de notificações, templates e mensagens dentro da janela de 24h. Webhook para status e, se quiser, para **mensagens recebidas** (implementar no `POST /api/whatsapp/webhook`).
- **Chatbot:** Você mesmo implementa os fluxos no backend (estado da conversa por número, respostas por etapa, envio de links de pagamento/agendamento). Não é um “chatbot visual”, mas atende captação e qualificação.
- **Recomendado se:** Quer manter uma única stack, controle total e já conhece o Twilio.

### Opção B – BSP brasileiro com **chatbot e API** (ex.: **Blip**, **Z-API**, **Wati**)

- **Vantagem:** Número novo, suporte local, e muitos já oferecem:
  - Envio/recebimento de mensagens e documentos.
  - Editor de fluxos (chatbot) em interface visual.
  - Webhooks para integrar com sua plataforma (consultas, pagamentos, receitas).
- **Uso:** Notificações e documentos você pode enviar via API deles; captação e qualificação você desenha nos fluxos do bot e conecta ao seu backend via webhook.
- **Recomendado se:** Quer menos código e mais no-code/low-code para fluxos de atendimento e captação.

### Opção C – **API oficial Meta de novo, com outro número e boas práticas**

- **Vantagem:** Sem custo de intermediário (só custo Meta por mensagem/template).
- **Requisitos:** Novo número, Business Verification aprovado, templates aprovados, **só enviar para quem deu opt-in** e dentro das regras (janela 24h, templates quando iniciar conversa).
- **Recomendado se:** Você identificou exatamente o que causou o ban (ex.: lista sem opt-in, template rejeitado) e quer continuar direto na Meta com disciplina rigorosa.

### Opção D – **NÃO usar** (Evolution, Baileys, WPPConnect, etc.)

- Risco de banimento, violação de termos e insegurança. **Não recomendado** para produção, ainda mais em saúde.

---

## 5. Resumo prático

| Pergunta | Resposta |
|----------|----------|
| **Qual ferramenta usar?** | API oficial via **Twilio** (já no projeto) **ou** um BSP brasileiro (Blip, Z-API, Wati) com número novo. Evitar API direta Meta no mesmo número banido e evitar soluções não oficiais. |
| **Chatbot ou IA?** | **Chatbot com fluxos** para captação, qualificação, envio de links (pagamento/agendamento) e respostas automáticas. **IA** só em partes específicas (ex.: FAQ) e em conformidade com políticas da Meta. |
| **Notificações e documentos?** | Todas as opções oficiais (Twilio ou BSP) suportam envio de texto, links (ex.: receita PDF) e templates. Seu código já está preparado; basta garantir número e configuração corretos. |
| **Captação (site → WhatsApp)?** | Manter link `wa.me` com texto pré-preenchido (nome + patologias). No WhatsApp: **tratar mensagem recebida no webhook** e responder com fluxo (boas-vindas → perguntas → link pagamento → link agendamento). |
| **Integração com a plataforma?** | Manter webhook na sua API; salvar estado da conversa (ex.: tabela `Lead` ou `WhatsAppConversation`) e disparar eventos da sua plataforma (criar consulta, enviar link de pagamento, etc.) a partir das respostas do usuário. |

---

## 6. Próximos passos sugeridos

1. **Definir a origem do ban:** Foi no número usado na **API Meta direta**? Se sim, usar **outro número** em qualquer solução (Twilio ou BSP).
2. **Se ficar com Twilio:**  
   - Configurar um número WhatsApp no Twilio (ou migrar para um novo).  
   - Implementar no webhook o tratamento de **mensagens recebidas** (Body, From) e um fluxo simples (boas-vindas → qualificação → links).  
   - Manter todas as notificações e documentos que você já envia hoje.
3. **Se migrar para um BSP (ex.: Blip):**  
   - Cadastrar número novo no BSP.  
   - Criar fluxos de captação/qualificação na ferramenta deles.  
   - Conectar via webhook à sua API (consultas, pagamentos, receitas) e, se o BSP tiver API de envio, usar para notificações e link da receita.
4. **Em qualquer caso:**  
   - Só enviar para quem deu opt-in (ex.: clicou em “Falar com médico” e mandou a primeira mensagem).  
   - Usar templates aprovados quando iniciar conversa após 24h.  
   - Evitar listas frias e disparos em massa.

Se quiser, na próxima etapa podemos: (1) desenhar o fluxo exato do bot (estados e mensagens) para captação, ou (2) esboçar as mudanças no `POST /api/whatsapp/webhook` para tratar mensagens recebidas e integrar com o restante da plataforma.
