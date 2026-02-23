# Análise Estratégica de Upsell Pós-Consulta

**Documento:** Análise exclusivamente estratégica e conceitual  
**Escopo:** Avaliar possibilidades, riscos, formatos e impactos de upsell após a consulta médica, sem implementação.  
**Princípios:** Opcional, transparente, não intrusivo, alinhado a ética e legislação.

---

## 1. Contexto considerado

- O usuário já realizou a **consulta médica** na plataforma.
- Pode ou não ter **receita** (emissão pelo médico em até 24h).
- Fluxos atuais: página da consulta finalizada → **Próximos passos** (receita, carteirinha, retorno, pagamentos, documentos, blog).
- Já existem no produto: **Laudo Agronômico** (página institucional `/laudo-agronomico`, compliance forte) e **Curso** de cultivo/extração com certificado (`/curso-cannabis`).
- Qualquer upsell deve ser **opcional**, **transparente**, **não intrusivo** e **ético/legal**.

---

## 2. Objetivo da análise

Avaliar **se**, **quando** e **como** os três serviços abaixo poderiam ser apresentados ao usuário sem quebrar a experiência, sem risco jurídico e sem parecer venda forçada:

1. Avaliação médica complementar (com eventual laudo médico, se indicado)  
2. Análise por engenheiro agrônomo (com eventual laudo agronômico)  
3. Curso educacional de cultivo e extração, com certificado de conclusão  

---

## 3. A. Momento ideal do upsell

### Opções de momento

| Momento | Descrição | Prós | Contras / Riscos |
|--------|-----------|------|-------------------|
| **Imediatamente após a consulta** (na mesma tela “Consulta finalizada”) | Banner ou bloco na página `/paciente/consultas/[id]` assim que status = COMPLETED | Alta visibilidade, contexto quente | Risco de **sobrecarga** e de parecer que a consulta “vira venda”. Paciente ainda pode estar processando a receita ou sem receita. |
| **Após o recebimento da receita** | Ex.: na página de receitas ou ao abrir a receita pela primeira vez | Quem tem receita é o público natural para laudo agronômico; momento de “próximo passo” | Se mostrar antes da receita estar disponível, gera frustração. Exige lógica condicional (só quem tem receita vê certos upsells). |
| **Na página “Próximos passos”** | Incluir cards ou seção “Serviços e apoio opcionais” em `/paciente/proximos-passos` | Já é o hub pós-consulta; framing de “o que você pode fazer agora” combina com “opcionais” | Precisa ficar **abaixo** ou **separado** dos passos obrigatórios (receita, carteirinha, retorno) para não confundir. |
| **Comunicação assíncrona** (e-mail ou WhatsApp, horas/dias depois) | E-mail “Sua consulta foi concluída – conheça serviços opcionais” ou mensagem contextual | Menos intrusivo na tela; usuário escolhe quando ler | Risco de ser ignorado ou visto como spam. Deve ser **uma** mensagem informativa, não sequência de vendas. |
| **Página ou área dedicada** | Ex.: “Serviços complementares” no menu do paciente, acessível a qualquer momento | Sem pressão de tempo; usuário busca quando quiser | Baixa descoberta espontânea; depende de link no menu ou em “Próximos passos”. |

### Recomendações de momento

- **Evitar:** único bloco de upsell **em destaque** na tela imediata “Consulta finalizada”, antes do usuário ver receita e próximos passos. Isso pode ser lido como “a plataforma já está vendendo”.
- **Preferir:**  
  - **Primeiro contato com o upsell** na página **Próximos passos**, em seção clara tipo “Serviços e apoio opcional” ou “Conheça também”, **abaixo** dos passos principais.  
  - **Reforço** leve na página da consulta (ex.: link “Conheça serviços opcionais” junto aos botões existentes), sem ocupar o foco.  
  - **Comunicação assíncrona** (e-mail) como **complemento**, nunca como único canal, e com tom informativo (“conheça”), não de oferta urgente.
- **Risco de cedo demais:** parecer condicionamento da consulta ao upsell; desvio de foco da receita e dos passos essenciais.  
- **Risco de tarde demais:** menor relevância contextual; usuário já “fechou” mentalmente a jornada da consulta.

**Conclusão:** O momento mais equilibrado é **Próximos passos** como ponto principal de oferta, com link discreto na página da consulta e, opcionalmente, um e-mail informativo posterior.

---

## 4. B. Enquadramento conceitual (framing)

### Como enquadrar

- **“Próximos passos possíveis”** – alinha com a página já existente e com a ideia de “o que você pode fazer a seguir”.
- **“Serviços complementares”** – deixa claro que não fazem parte do pacote da consulta; são adicionais.
- **“Apoio técnico e educacional opcional”** – bom para laudo agronômico (técnico) e curso (educacional); reforça **opcional**.

### O que evitar

- **“Recomendado pelo médico”** ou “Seu médico indicou”** – a menos que seja verdade clínica (ex.: médico realmente indicou retorno ou avaliação complementar). Caso contrário, é enganoso e arriscado.
- **“Complete sua jornada”** ou **“Não perca”** – tom de venda que pode soar como obrigatoriedade ou FOMO.
- **“Garantia de laudo”**, **“Aprovação certa”**, **“Resultado garantido”** – inaceitável para laudo médico ou agronômico.
- **Vincular a obtenção da receita** ao consumo de outro serviço (ex.: “Só com laudo você consegue o medicamento”) – condicionamento ilegal e antiético.
- **Linguagem de e-commerce agressiva** – carrinho, “últimas vagas”, countdown – inadequada para saúde e serviços regulados.

### Tom recomendado

- Informativo, calmo, profissional.  
- Sempre que for serviço com resultado não garantido (laudo): deixar explícito que é **opcional**, que o **resultado depende de avaliação independente** e que **pagamento é pelo serviço**, não pelo “documento garantido”.

---

## 5. C. Avaliação individual de cada upsell

### 5.1 Avaliação médica complementar / eventual laudo médico

**O que seria:** Uma segunda avaliação ou um serviço que gera um laudo/relatório médico complementar (ex.: para trabalho, seguro, documentação específica), **distinto** da receita da consulta já realizada.

**Riscos éticos e legais:**

- **Conflito de interesse:** Se a plataforma ou o mesmo médico “indicar” essa avaliação logo após a consulta, pode parecer que a consulta inicial é insuficiente ou que há incentivo financeiro para pedir mais exames/avaliações. Código de Ética Médica e boas práticas condenam pedidos desnecessários.
- **Critério clínico:** Laudo ou avaliação complementar **só faz sentido quando há indicação clínica**. Oferecer como “upsell” genérico pode levar a:
  - Paciente solicitando sem necessidade clínica.
  - Médico sob pressão (implícita) para aceitar ou emitir.
- **Expectativa de resultado:** Se o usuário paga “por laudo” e o médico conclui que não há indicação, surge conflito (reclamação, chargeback, má interpretação).

**Como deixar claro que não é garantido e não é “produto”:**

- Enquadrar como **“Avaliação médica complementar, quando indicada”**.
- Explicitar que: (1) não é garantido que haverá laudo; (2) a decisão é do médico com base em critério clínico; (3) o pagamento é pela **avaliação**, não pela emissão do documento.
- Evitar venda como “compre seu laudo”; preferir “solicite avaliação complementar, se o médico indicar”.

**Faz sentido como upsell direto?**

- **Em formato de “oferta padrão” na sequência da consulta:** **não**. O risco de parecer “venda de laudo” ou de induzir demanda desnecessária é alto.
- **Como serviço acessível sob demanda** (ex.: paciente ou terceiro solicita quando há real necessidade – trabalho, seguro, documentação), com triagem e critério clínico claro: **possível**, desde que:
  - Seja **solicitação do paciente ou de terceiro**, não “oferta ativa” na tela pós-consulta.
  - Haja fluxo que deixe explícito que o médico pode concluir que **não há indicação** e não emitir laudo (e que o valor pago refere-se à avaliação).

**Conclusão:** Não recomendar como upsell ativo no pós-consulta. Se existir como serviço, manter **sob demanda**, com copy e fluxo que reforcem critério clínico e ausência de garantia de laudo.

---

### 5.2 Laudo agronômico

**Situação atual:** A plataforma já possui página institucional de **Laudo Agronômico** com diretrizes de compliance (não garante laudo, engenheiro independente, pagamento pelo serviço de análise). O público-alvo documentado são pacientes que já passaram por consulta e têm receita.

**Riscos vs. valor percebido:**

- **Risco regulatório:** Baixo **se** mantido o enquadramento atual (plataforma só conecta; engenheiro independente; transparência sobre pagamento e resultado).
- **Risco de expectativa:** Se na hora do upsell a comunicação sugerir “compre e receba seu laudo”, o usuário pode achar que o pagamento garante o documento. **Mitigação:** usar o mesmo tom da página institucional – “conheça o serviço de análise por engenheiro agrônomo”; “resultado depende da avaliação técnica”.
- **Valor percebido:** Alto para quem pretende cultivar ou precisa de orientação técnica; o laudo agronômico é um próximo passo lógico após a receita.

**Papel da plataforma:**

- **Intermediadora:** conectar paciente a engenheiro agrônomo; não emitir laudo; não garantir resultado. Isso já está bem definido na documentação e na página.

**Expectativas do usuário:**

- Podem achar que “laudo” = autorização automática ou que a plataforma “dá o laudo”. **Cuidados de copy e UX:** em qualquer menção pós-consulta, repetir em uma linha: “Serviço opcional; o laudo depende da análise independente do profissional.”

**Recomendação:**

- **Faz sentido como upsell** na jornada pós-consulta, especialmente na página **Próximos passos**, após “Ver receita” e “Carteirinha”.
- Apresentar como **“Conheça a análise por engenheiro agrônomo”** ou **“Apoio técnico opcional”**, com link para `/laudo-agronomico`, sem prometer laudo nem resultado.
- **Não** colocar preço ou CTA de compra na própria tela de próximos passos se isso exigir compromissos legais complexos; preferir “Saiba mais” → página institucional onde já está o compliance.

**Conclusão:** Laudo agronômico é o upsell com **melhor equilíbrio risco/valor** entre os três, desde que o framing e o copy sigam as diretrizes já definidas (opcional, independente, sem garantia de laudo).

---

### 5.3 Curso de cultivo e extração com certificado

**Situação atual:** Existe página de vendas do curso (`/curso-cannabis`) com posicionamento educacional, FAQ (legalidade, certificado, garantia), e aviso de que o curso é informativo e que o usuário deve respeitar a legislação local.

**Segurança jurídica:**

- **Alta**, desde que mantido o enquadramento atual: conteúdo **educacional**, sem incentivo a atos ilegais, com avisos de conformidade local. O certificado é de **conclusão do curso**, não de “autorização” para cultivar.
- **Escalabilidade:** Curso é produto digital escalável; não depende de profissional específico por demanda (diferente de laudo médico/agronômico).

**Relação com a consulta:**

- **Indireta:** a consulta trata do uso medicinal e da receita; o curso trata de conhecimento técnico (cultivo, extração). Não é continuidade clínica, é **complemento educacional**. Evitar dizer “seu médico recomenda o curso” a menos que haja programa formal de indicação e compliance.

**Como manter caráter educacional:**

- Na oferta pós-consulta: “Conheça nosso curso de formação em cultivo e extração (educacional, com certificado de conclusão).”
- Evitar: “Aprenda a cultivar o que o médico receitou” (pode ser lido como instrução para cultivar sem considerar lei local). Preferir: “Conteúdo técnico e responsável; verifique a legislação da sua região.”

**Recomendação:**

- **Faz sentido como upsell** na página Próximos passos, em bloco separado (ex.: “Formação e conteúdo” ou “Conheça também”).
- Apresentar como **opção de educação**, não como etapa do tratamento. Link para `/curso-cannabis` com copy que reforce “curso 100% online, certificado de conclusão, fins educacionais”.
- **Risco baixo** de confusão com receita ou com laudo se o card for claramente “Curso” e “Educacional”.

**Conclusão:** Curso é o upsell com **menor risco jurídico e maior escalabilidade**. Pode ser oferecido no pós-consulta com tom informativo e educacional, sem vincular à decisão médica.

---

## 6. D. Integração com o que já existe hoje

### Onde encaixar

- **Próximos passos (`/paciente/proximos-passos`):**  
  - Já lista passos (receita, carteirinha, retorno, pagamentos, documentos, blog).  
  - Incluir uma seção **“Serviços e apoio opcional”** ou **“Conheça também”** **abaixo** desses passos, com até 2–3 cards: Laudo Agronômico (saiba mais), Curso (saiba mais). Avaliação médica complementar **não** como card ativo de upsell (conforme análise acima).
- **Página da consulta (`/paciente/consultas/[id]`):**  
  - Manter foco em: consulta finalizada, receita, próximos passos, carteirinha, feedback.  
  - Opcional: um link discreto do tipo “Serviços opcionais” que leva a Próximos passos ou a uma seção de serviços complementares, **sem** blocos grandes de oferta nessa tela.
- **Dashboard do paciente:**  
  - Pode ter um card ou link “Serviços complementares” ou “Formação e laudo” que leve à mesma seção de opcionais, sem ser o elemento principal.

### O que pode gerar fricção ou confusão

- **Misturar** “Próximos passos obrigatórios” (receita, carteirinha, retorno) com “opcionais” no mesmo nível visual, sem separação clara. **Mitigação:** seção distinta com título que diga “opcional” ou “conheça também”.
- **Muitos CTAs** na mesma tela (receita, próximos passos, carteirinha, laudo, curso). **Mitigação:** na consulta, não adicionar mais que um link genérico; detalhes na página Próximos passos.
- **Expectativa de que “opcionais” sejam necessários** para ter receita ou carteirinha. **Mitigação:** copy explícito: “Estes serviços não são obrigatórios para seu tratamento.”

### O que manter separado propositalmente

- **Consulta em si** (vídeo, resumo, receita) **separada** de qualquer oferta comercial. Nenhum pop-up ou modal de upsell durante ou imediatamente ao fechar a chamada.
- **Emissão da receita** e **acesso à receita** sem condicionamento a clique ou compra de outro serviço.
- **Avaliação médica complementar / laudo médico:** fora do fluxo de upsell ativo; apenas sob demanda, com critério clínico explícito.

### Impacto na confiança

- **Positivo** se a oferta for **clara**, **opcional** e **útil** (laudo para quem quer orientação agronômica; curso para quem quer formação). Reforça que a plataforma oferece um ecossistema de apoio.
- **Negativo** se parecer venda agressiva, condicionamento da consulta ou garantia de resultados (laudo/receita). Daí a importância do framing e do momento.

---

## 7. E. UX e experiência do usuário (sem layout)

### Formatos possíveis

- **Página explicativa (existente):** Laudo e Curso já têm páginas próprias. O upsell pode ser “Saiba mais” → redirecionamento para essas páginas, sem duplicar conteúdo.
- **Seção informativa pós-consulta:** Na página Próximos passos, uma área com título “Serviços e apoio opcional” e cards curtos (título, uma linha de descrição, link “Saiba mais”). Sem preço na lista se isso simplificar compliance; preço apenas na página final.
- **Comunicação assíncrona:** E-mail único, após 24–48h da consulta, com assunto do tipo “Sua consulta foi concluída – conheça serviços opcionais”. Corpo informativo, links para Próximos passos e/ou Laudo e Curso. Sem insistência; sem sequência de e-mails de vendas.

### Riscos de parecer venda agressiva ou condicionamento

- **Venda agressiva:** Muitos blocos, cores de CTA fortes, urgência (“últimas vagas”), pop-ups. **Mitigação:** tom informativo; no máximo 1 seção de opcionais; botões “Saiba mais” em vez de “Comprar agora” na primeira aparição.
- **Condicionamento da consulta:** Usuário achar que precisa comprar algo para “validar” a consulta ou a receita. **Mitigação:** texto explícito: “Sua consulta e sua receita estão concluídas. Os itens abaixo são opcionais.”

### Experiência fluida e respeitosa

- Ordem: primeiro **sempre** receita e passos essenciais; depois opcionais.
- Linguagem: “Conheça”, “Saiba mais”, “Serviço opcional” – nunca “Você precisa” ou “Não perca”.
- Sem obrigatoriedade de interação: usuário pode ignorar a seção de opcionais e seguir normalmente.

---

## 8. F. Riscos, trade-offs e mitigação

### Principais riscos

| Risco | Mitigação |
|-------|-----------|
| Parecer que a consulta “vira venda” | Upsell só em Próximos passos (e link discreto na consulta); nunca na tela de “Consulta finalizada” como bloco principal. |
| Expectativa de laudo/resultado garantido | Copy e FAQ explícitos: serviço opcional; resultado depende de avaliação independente; pagamento pelo serviço. |
| Conflito de interesse (médico/plataforma) | Não oferecer “avaliação complementar/laudo médico” como upsell ativo; laudo agronômico como “conexão com profissional independente”. |
| Condicionamento da receita a outro serviço | Nunca vincular acesso à receita ou à carteirinha à compra de laudo ou curso. |
| Spam ou má experiência em canal | E-mail único, informativo; sem sequência de vendas; opt-out respeitado. |

### Trade-offs conversão x compliance

- **Mais conversão, menos compliance:** CTAs fortes, preço em destaque, “Garantia de laudo” → **não recomendado**; risco jurídico e ético alto.
- **Mais compliance, menos conversão:** Oferta discreta, “Saiba mais”, sem preço na primeira tela → **recomendado**; sustentável e alinhado ao setor de saúde.

### O que não recomendar fazer

- Upsell de **avaliação médica complementar / laudo médico** na sequência direta da consulta como oferta padrão.
- Garantir ou sugerir garantia de **laudo** (médico ou agronômico) em troca de pagamento.
- Colocar upsell **acima** ou **no mesmo nível** dos passos essenciais (receita, carteirinha, retorno) sem rótulo claro de “opcional”.
- Usar linguagem do médico (“recomendado pelo seu médico”) sem base real em indicação clínica.
- Pop-up ou modal de oferta ao encerrar a consulta ou ao abrir a receita.

### Linhas vermelhas

- **Nunca** condicionar a entrega ou visualização da **receita** à compra de qualquer outro serviço.
- **Nunca** afirmar que laudo (médico ou agronômico) é **garantido** pelo pagamento.
- **Nunca** usar dados clínicos da consulta para personalizar oferta de forma que sugira que o médico “indicou” o serviço, sem que isso seja verdade.
- **Nunca** oferecer laudo médico como “produto” (ex.: “compre seu laudo”); no máximo “solicite avaliação complementar quando indicado”.

---

## 9. Entregáveis resumidos

### 9.1 Viabilidade geral do upsell pós-consulta

- **Viável** para **Laudo Agronômico** e **Curso**, desde que:
  - Momento principal = **Próximos passos**, com seção “Serviços e apoio opcional”.
  - Framing = opcional, transparente, sem garantia de resultado onde aplicável.
- **Não viável** como upsell ativo para **Avaliação médica complementar / laudo médico**; apenas sob demanda, com critério clínico explícito.

### 9.2 Prós e contras por opção

| Opção | Prós | Contras |
|-------|------|---------|
| **Avaliação médica complementar / laudo médico** | Atende necessidade real em casos específicos (trabalho, seguro). | Alto risco ético e de conflito de interesse; não deve ser oferta padrão pós-consulta. |
| **Laudo agronômico** | Já tem página e compliance; público com receita é natural; bom valor percebido. | Requer copy cuidadoso para não criar expectativa de laudo garantido. |
| **Curso** | Baixo risco jurídico; escalável; claramente educacional. | Relação indireta com a consulta; conversão pode ser menor que laudo para quem já tem receita. |

### 9.3 Recomendações estratégicas

- **Fazer:**  
  - Incluir **Laudo Agronômico** e **Curso** na página Próximos passos em seção “Serviços e apoio opcional” ou “Conheça também”.  
  - Link discreto “Serviços opcionais” na página da consulta finalizada, levando a essa seção.  
  - Manter copy e compliance alinhados às páginas institucionais já existentes (laudo e curso).  
  - Opcional: um e-mail informativo pós-consulta com links para esses serviços, sem tom de campanha.
- **Evitar:**  
  - Upsell ativo de avaliação médica complementar / laudo médico no fluxo pós-consulta.  
  - Qualquer garantia de laudo ou resultado.  
  - Condicionar receita ou carteirinha a outro serviço.  
  - Oferta em destaque na tela imediata “Consulta finalizada”.

### 9.4 Ordem de priorização (sugestão)

1. **Laudo agronômico** – já existe produto e página; encaixe natural após receita; maior alinhamento com “próximo passo” do paciente que vai cultivar ou buscar orientação técnica.  
2. **Curso** – já existe produto e página; menor risco; boa para “formação e conteúdo”, em paralelo ao tratamento.  
3. **Avaliação médica complementar / laudo médico** – não priorizar como upsell; se existir, manter sob demanda e com fluxo que enfatize critério clínico e ausência de garantia.

### 9.5 Pontos que exigiriam validação jurídica futura

- Enquadramento exato de “avaliação médica complementar” e “laudo médico” perante o Código de Ética Médica e normas do CFM (quando for o caso).  
- Se houver remuneração da plataforma por encaminhamento ao engenheiro agrônomo ou ao curso: conformidade com regras de publicidade e transparência (ex.: relação comercial explícita).  
- Uso de e-mail/WhatsApp para oferta de serviços opcionais: conformidade com LGPD e política de comunicação (consentimento, opt-out).  
- Termos de uso e termos específicos da contratação do laudo agronômico e do curso, se ainda não cobrirem explicitamente “serviço opcional” e “resultado não garantido”.

### 9.6 Nível de risco por abordagem (conclusão)

| Abordagem | Nível de risco | Comentário |
|-----------|----------------|------------|
| **Laudo agronômico** como “Saiba mais” em Próximos passos | **Baixo** | Desde que copy repita: opcional, independente, laudo não garantido. |
| **Curso** como “Conheça o curso” em Próximos passos | **Baixo** | Educacional; já documentado; sem vínculo com decisão médica. |
| **Avaliação/laudo médico** como upsell ativo pós-consulta | **Alto** | Risco ético e de expectativa; não recomendado. |
| Oferta em destaque na tela “Consulta finalizada” | **Médio–Alto** | Pode prejudicar confiança e parecer venda forçada. |
| E-mail único informativo pós-consulta | **Baixo** | Se tom informativo e sem insistência. |

---

*Documento elaborado com base no contexto atual da plataforma (fluxos de consulta, Próximos passos, páginas de Laudo Agronômico e Curso) e nos princípios solicitados: análise estratégica e conceitual, sem implementação.*
