# ANVISA no projeto: situação atual e como fazer

## Hoje: não há integração com a ANVISA

No projeto **não existe** nenhuma integração com sistemas da ANVISA:

- Nenhuma chamada a API da ANVISA
- Nenhum envio automático de solicitação para o governo
- Nenhuma consulta de status no portal gov.br

O que existe é um **fluxo interno** no seu sistema:

1. **Paciente/admin** cria uma “solicitação de autorização ANVISA” vinculada a uma receita (API `POST /api/anvisa`).
2. Essa solicitação fica salva no banco com status **PENDING** e documentos (se houver).
3. No **menu Admin → ANVISA**, a equipe:
   - Lista e filtra as autorizações
   - Atualiza o status **manualmente** (Enviado, Em Análise, Aprovado, Rejeitado)
   - Registra o número ANVISA quando a autorização é aprovada (fora do sistema)

Ou seja: o sistema só **organiza e acompanha** o processo. Quem de fato solicita e acompanha na ANVISA é a pessoa (paciente, familiar ou equipe), **fora** do sistema, no portal do governo.

---

## Como a ANVISA funciona na prática

A autorização para **importação excepcional de produtos à base de cannabis** hoje é feita assim:

- **Onde:** formulário eletrônico no **Portal de Serviços do Governo Federal** (gov.br).  
  Exemplo: [Solicitar autorização para importar produtos derivados de Cannabis](https://www.gov.br/pt-br/servicos/solicitar-autorizacao-para-importacao-excepcional-de-produtos-a-base-de-canabidiol).
- **Quem:** paciente ou responsável legal, com prescrição médica e documentos.
- **Como:** preenchimento manual do formulário, anexação de documentos (receita, etc.). Não existe **API pública** para clínicas/sistemas enviarem essa solicitação em nome do paciente.
- A ANVISA tem API para **outro fim** (SNGPC – controle de produtos controlados em farmácias), não para esse fluxo de “autorização excepcional cannabis”.

Conclusão: hoje **não dá para integrar de ponta a ponta** (seu sistema → ANVISA) porque o processo oficial é manual no gov.br.

---

## Como podemos fazer (opções)

### 1. Manter workflow interno (o que já temos)

- **O que é:** usar o menu ANVISA como **controle interno** do processo.
- **Fluxo:**
  1. Paciente/receita gera uma “autorização ANVISA” no sistema (status PENDING).
  2. Alguém (paciente ou equipe) faz a solicitação real no site do gov.br.
  3. No sistema, alguém marca como “Enviado” quando de fato enviou no gov.br.
  4. Quando souber o resultado, marca “Em Análise”, “Aprovado” (e preenche o número ANVISA) ou “Rejeitado”.
- **Vantagem:** não depende de API; funciona com o que a ANVISA oferece hoje.
- **Limitação:** tudo que é “enviado para ANVISA” e “número aprovado” é **manual** (informado no seu sistema por quem fez o processo no gov.br).

### 2. Melhorar o fluxo sem integrar com a ANVISA

- **Link direto no sistema:** botão/link na tela da autorização abrindo o serviço correto no gov.br (formulário de autorização de importação de cannabis).
- **Checklist de documentos:** na tela da solicitação, listar o que a ANVISA pede (receita, dados do paciente, etc.) e marcar o que já foi anexado/preparado.
- **Campo “Número ANVISA”:** quando a autorização for aprovada, a equipe ou o paciente preenche manualmente no sistema o número recebido no gov.br.
- **Instruções para o paciente:** texto ou tela explicando que a solicitação oficial é feita no gov.br e que o sistema só acompanha o status internamente.

Assim, “como faríamos” hoje = **não integramos com a ANVISA**, mas **organizamos e guiamos** o processo e registramos o resultado (incluindo o número ANVISA) no nosso sistema.

### 3. Integração futura (se a ANVISA disponibilizar API)

- Se no futuro a ANVISA disponibilizar **API** para o serviço de “autorização excepcional de importação de cannabis”, aí sim daria para:
  - Enviar solicitação a partir do seu sistema
  - Consultar status
  - Receber número da autorização automaticamente
- Hoje essa API **não existe** para esse fluxo; quando existir, aí sim faria sentido implementar a integração no backend (chamadas à API da ANVISA).

---

## Resumo

- **Não temos integração com a ANVISA.** O menu ANVISA serve para **gestão interna** das autorizações (status e número ANVISA quando aprovado).
- **Como faríamos hoje:** manter esse workflow interno e, se quiser, melhorar com link para o gov.br, checklist de documentos e campo para número ANVISA + instruções claras para o paciente.
- **Integração real** só será possível quando a ANVISA oferecer API para esse serviço específico; até lá, o processo oficial continua sendo o formulário no gov.br.
