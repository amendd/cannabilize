# Análise de validação — sugestões de UX com base no código

Este documento confronta as sugestões que você descreveu com o estado atual do projeto (admin, paciente e médico) e indica o que é **válido** e o que já existe ou precisa de ajuste.

---

## 1. Admin — KPIs estratégicos e prioridade visual

### 1.1 Falta de KPIs estratégicos no topo

**Sua observação:** Admin vê “ações”, mas não vê “estado do sistema”. Sugestão: painel de saúde da plataforma com consultas hoje, receitas pendentes, pendências regulatórias, médicos ativos, alertas ANVISA/documentos vencendo.

**O que o código mostra hoje:**

- **`/api/admin/stats`** retorna apenas totais: `totalPatients`, `totalConsultations`, `totalPrescriptions`, `totalRevenue`. Não há “consultas hoje”, “médicos ativos” nem “documentos vencendo”.
- **`/api/admin/pending`** retorna: consultas agendadas (SCHEDULED), receitas a emitir (consultas concluídas sem receita), ANVISA pendentes, carteirinhas pendentes.
- Na **`app/admin/page.tsx`**:
  - O topo é “Dashboard Administrativo” + “Acesso Rápido” (grupos de links).
  - Depois vêm “Métricas Principais” (Pacientes, Consultas, Receitas, Receita Total — totais).
  - Só então “Ações Pendentes” (4 cards clicáveis).

**Conclusão:** **Válido.** Hoje não existe um “painel de saúde” no topo com KPIs como consultas hoje, receitas pendentes de validação, pendências regulatórias, médicos ativos e alertas ANVISA/documentos vencendo. As APIs precisariam expor esses dados e o layout do admin precisaria de um bloco dedicado no topo (acima ou substituindo a sensação de “só acesso rápido”).

---

### 1.2 Tudo com a mesma prioridade visual

**Sua observação:** Consultas, Receitas, Pacientes, Carteirinhas “gritam” igual. Sugestão: hierarquia Primário (trava operação) > Secundário (gestão) > Terciário (cadastro). Exemplo: Receitas pendentes > Pacientes > Médicos > Carteirinhas.

**O que o código mostra hoje:**

- Em **`app/admin/page.tsx`** os “Acesso Rápido” estão em grupos (Operacional, Regulatório, Financeiro, Conteúdo, Comunicação, Sistema), todos com o mesmo peso visual (cards em grid).
- “Ações Pendentes” são 4 cards do mesmo tamanho e estilo (Consultas pendentes, Receitas para emitir, ANVISA, Carteirinhas).
- Não há diferença de tamanho, cor ou posição para “o que trava a operação” vs “gestão” vs “cadastro”.

**Conclusão:** **Válido.** Não há hierarquia visual clara (primário/secundário/terciário). Reordenar e dar destaque visual (tamanho, cor, posição) aos itens que travam a operação é coerente com a sugestão.

---

## 2. Paciente — Linguagem e CTA

### 2.1 Linguagem “de sistema” vs linguagem de cuidado

**Sua observação:** Exemplos atuais (“Receitas Médicas”, “Pagamentos Pendentes”, “Nenhuma consulta encontrada”) são corretos mas frios. Sugestão: linguagem de cuidado (“Seu tratamento”, “Próximos passos”, “Estamos prontos quando você estiver”).

**O que o código mostra hoje:**

- **`app/paciente/page.tsx`** (dashboard):
  - Cards: “Minhas Consultas”, “**Receitas Médicas**”, “**Pagamentos Pendentes**”, “Meus Documentos”, “Carteirinha Digital”.
  - Empty state: “**Nenhuma consulta encontrada**”, “Você ainda não tem consultas agendadas. Agende sua primeira consulta para começar.”, CTA “**Agendar minha primeira consulta**”.
- **`app/paciente/consultas/page.tsx`**: títulos vazios “Você ainda não possui consultas agendadas” / “Nenhuma consulta encontrada com os filtros”, “Agende sua primeira consulta…”, “Agendar Consulta”.
- **`app/paciente/receitas/page.tsx`**: “Minhas Receitas Médicas”.
- **`app/paciente/pagamentos/page.tsx`**: “Pagamentos Pendentes”.

**Conclusão:** **Válido.** Os textos são técnicos e neutros. Trocar para linguagem de cuidado (ex.: “Seu tratamento”, “Próximos passos”, “Estamos prontos quando você estiver” em empty states) é aplicável e melhora a sensação de produto de saúde.

---

### 2.2 CTA principal pouco emocional

**Sua observação:** “Agendar minha primeira consulta” é funcional; em saúde, emoção importa. Sugestões: “Começar meu tratamento”, “Falar com um médico agora”, “Cuidar da minha saúde”.

**O que o código mostra hoje:**

- **`app/paciente/page.tsx`** (linhas 396–401):  
  `EmptyState` com `actionLabel="Agendar minha primeira consulta"` e `actionHref="/agendamento"`.
- **`app/paciente/consultas/page.tsx`**: `actionLabel="Agendar Consulta"` quando não há consultas.

**Conclusão:** **Válido.** O CTA é literal e pouco emocional. Alternativas como “Começar meu tratamento” ou “Falar com um médico agora” podem ser usadas no empty state principal e em listas vazias, mantendo o mesmo `actionHref` onde fizer sentido.

---

## 3. Médico — Ordem mental e contexto clínico

### 3.1 Ordem mental invertida (financeiro antes do “quem atendo agora”)

**Sua observação:** Financeiro aparece cedo; o médico pensa primeiro “Quem atendo agora?”. Sugestão: topo = Próxima consulta / Paciente aguardando / Tempo restante; financeiro abaixo.

**O que o código mostra hoje (ordem em `app/medico/page.tsx`):**

1. Header (“Dashboard do Médico”).
2. **Cards de métricas** (Consultas Hoje, Consultas Semana, Receitas Emitidas, Pacientes Atendidos).
3. **Disponibilidade para agendamento** (bloco grande com toggle e “Gerenciar meus horários”).
4. **Visão Financeira** (`DoctorFinancialOverview`) — bloco grande.
5. **Consultas de Hoje** (lista detalhada com paciente, horário, anamnese, botões Entrar/Iniciar reunião).
6. Receitas Recentes.
7. Próximas Consultas (tabela).

Ou seja: a **lista operacional “Consultas de Hoje”** (quem atender agora) vem **depois** da **Visão Financeira**. Os cards do topo já mostram “Consultas Hoje” em número, mas o bloco que realmente responde “quem atendo agora” está abaixo do financeiro.

**Conclusão:** **Válido.** Faz sentido subir o bloco “Consultas de Hoje” (e, se existir, “Próxima consulta / paciente aguardando”) para o topo, logo após os cards de métricas (ou integrado a eles), e deixar “Visão Financeira” e “Disponibilidade” abaixo, para alinhar a ordem da tela à ordem mental do médico.

---

### 3.2 Falta de contexto clínico rápido antes de entrar na consulta

**Sua observação:** O médico deveria ver, antes de entrar na consulta: histórico resumido, última prescrição, observações.

**O que o código mostra hoje:**

- **Anamnese:** Em **`app/medico/page.tsx`** (linhas 437–488), cada card de “Consultas de Hoje” já exibe um bloco **Anamnese** quando existe: tratamentos anteriores, medicamentos atuais, alergias, informações adicionais (parse de `consultation.anamnesis`).
- **API:** **`/api/admin/consultations`** inclui `prescription: true`, então a última prescrição daquela consulta (ou consultas anteriores) poderia ser usada, mas **não é mostrada** no card do dashboard.
- **Observações:** Não há campo “observações” explícito no card; apenas o que está na anamnese.

**Conclusão:** **Parcialmente válido.**  
- **Histórico resumido / anamnese:** Já existe no card de “Consultas de Hoje”.  
- **Última prescrição:** Dados existem na API (`prescription` na consultation), mas não são exibidos no dashboard; vale adicionar um resumo (ex.: “Última prescrição: data + linha” ou link).  
- **Observações:** Se “observações” for um campo específico (ex. na consulta ou no paciente), hoje não aparece no card; seria um reforço de contexto clínico rápido.

---

## Resumo executivo

| Área   | Ponto                         | Válido? | Observação |
|--------|--------------------------------|---------|------------|
| Admin  | KPIs estratégicos no topo      | Sim     | APIs e layout precisam de “painel de saúde” (consultas hoje, médicos ativos, documentos vencendo, etc.). |
| Admin  | Hierarquia visual (primário/secundário/terciário) | Sim | Tudo hoje tem o mesmo peso; reordenar e dar destaque ao que trava a operação. |
| Paciente | Linguagem de cuidado         | Sim     | Trocar termos de sistema por “Seu tratamento”, “Próximos passos”, etc. |
| Paciente | CTA mais emocional            | Sim     | Ex.: “Começar meu tratamento” no empty state principal. |
| Médico | Ordem: consulta primeiro, financeiro depois | Sim | Subir “Consultas de Hoje” e descer “Visão Financeira”. |
| Médico | Contexto clínico rápido      | Parcial | Anamnese já existe no card; falta mostrar última prescrição (e observações, se houver campo). |

No conjunto, as sugestões são **válidas e alinhadas ao código**: o projeto ainda não implementa o painel de saúde do admin nem a hierarquia visual; a área do paciente usa linguagem fria e CTA funcional; o dashboard do médico prioriza financeiro antes da lista de “quem atendo agora” e pode ganhar com último prescrição (e observações) no card.

Implementar na ordem que você priorizar (ex.: admin KPIs + ordem médico + textos paciente) traria a sensação de “gerenciar operação de saúde” e “cuidar do paciente” que você descreveu.
