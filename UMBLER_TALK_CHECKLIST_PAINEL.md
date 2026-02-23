# Checklist no painel Umbler Talk – parar transferência em "oi" e "como faço o pagamento?"

A mensagem **"Chat transferido para o setor geral pois o contato pediu para falar com um humano"** é gerada **pelo Umbler Talk** (intenção do agente), não pelo nosso site. Quem decide transferir é a **configuração de intenções no painel**. Para "oi" e "como faco o pagamento?" pararem de transferir, faça o seguinte **no painel do Umbler Talk**:

---

## Passos

1. Abra o agente **Lizze** e vá em **Intenções** (ou Fluxos / Regras).

2. Localize a intenção que dispara **"Falar com humano"** ou **"Transferir para setor Geral"**.

3. **Restrinja** os gatilhos/exemplos dessa intenção **só** a frases em que o usuário pede **claramente** atendente humano, por exemplo:
   - quero falar com um humano
   - quero falar com atendente
   - falar com pessoa real
   - quero reclamar
   - não quero bot

4. **Remova ou não use** como gatilho para "transferir para humano":
   - **oi**, **olá**, **bom dia** → devem acionar **boas-vindas / reinício**, nunca transferência.
   - **como faço o pagamento?**, **qual o valor?**, **quanto custa?** → são dúvidas; a IA ou o webhook respondem, **não** transferem.

5. Se houver **prioridade** entre intenções, coloque a de **boas-vindas** (ou "iniciar conversa") **acima** da de "transferir para humano", para que "oi" seja tratado como saudação.

6. Salve e teste de novo com **"oi"** e **"como faco o pagamento?"** – a transferência não deve mais ocorrer nesses casos.

---

## Resumo

- **Problema:** "oi" e "como faco o pagamento?" disparam "contato pediu para falar com um humano".
- **Causa:** A intenção "transferir para humano" no agente Lizze está muito ampla.
- **Solução:** No painel Umbler Talk, restringir essa intenção **apenas** a pedidos explícitos de atendente humano e garantir que "oi" e dúvidas de pagamento não acionem essa intenção.
