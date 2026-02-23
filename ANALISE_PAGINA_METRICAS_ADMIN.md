# Análise detalhada: página /admin/metricas

**Objetivo:** Painel onde o admin acompanha métricas da plataforma (acessos, consultas, agendamentos, cancelamentos, vendas, receitas, saques, totais acumulativos).  
**URL:** `http://localhost:3000/admin/metricas`

---

## 1. Estado atual da página

### 1.1 Conteúdo existente

| Bloco | Conteúdo | Fonte de dados |
|-------|----------|----------------|
| **Filtros** | Período: Hoje, Esta Semana, Este Mês, Trimestre, Este Ano + intervalo personalizado (data início/fim) | Frontend → API `period`, `startDate`, `endDate` |
| **KPIs principais (6 cards)** | Consultas agendadas, realizadas, em andamento; Receitas emitidas; Acessos (logins); Receita no período | API `/api/admin/metrics` |
| **Percentuais / extras (4 cards)** | Taxa de conclusão, Taxa de cancelamento, Novos pacientes no período, Ticket médio | API |
| **Gráfico** | Consultas por período (barras horizontais empilhadas: agendadas, realizadas, em andamento, canceladas/no-show) | `consultations.chart` |
| **Consultas por status** | Lista com barra proporcional e contagem por status | `consultations.byStatus` |
| **Receitas por período** | Barras horizontais por período | `prescriptions.chart` |
| **Acessos por período** | Barras horizontais (logins) | `access.chart` |
| **Receita por período** | Barras horizontais (R$) | `financial.chart` |
| **Receitas por status** | Emitida, Utilizada, Expirada, Cancelada (contagem) | `prescriptions.byStatus` |
| **Resumo geral** | Pacientes cadastrados, médicos, período aplicado | `users`, `dateRange` |

### 1.2 O que a API **não** entrega hoje

- **Totais acumulativos** (histórico desde o início): receita total, consultas totais, receitas totais, etc.
- **Solicitações de saques** (repasse aos médicos): modelo `DoctorPayout` existe no schema (`REQUESTED`, `PROCESSING`, `PAID`, `REJECTED`, `CANCELLED`) mas não é usado na rota de métricas.
- **Vendas/pagamentos por status**: apenas pagamentos `PAID` entram na receita; não há contagem de pendentes, falhas, reembolsos.
- **Comparativo período anterior** (ex.: este mês vs mês passado).
- **Regiões** (a descrição da página menciona “regiões”, mas não há dados geográficos na API).

---

## 2. Lacunas de conteúdo (o que o admin precisa e não tem)

| Necessidade | Situação atual | Sugestão |
|-------------|----------------|----------|
| Totais acumulativos | Só métricas do período filtrado | Adicionar bloco “Desde o início” ou “Total histórico”: receita total, consultas totais realizadas, receitas totais emitidas, total de saques pagos. |
| Solicitações de saques | Não exibido | Incluir: quantidade por status (solicitado, em processamento, pago, rejeitado), valor total solicitado/pago no período e acumulado. Link para lista de saques se existir. |
| Cancelamentos vs no-show | Agrupados em um único número no gráfico | Separar em dois KPIs ou duas linhas/legendas: “Canceladas” e “Não compareceu”, para análise de abandono. |
| Vendas (pagamentos) | Só receita (PAID) e ticket médio | Card “Pagamentos no período”: total pago, pendentes, falhas, reembolsos (quantidade e valor). |
| Comparativo | Nenhum | Opcional: “vs período anterior” (ex.: +12% consultas, -5% cancelamentos) em tooltip ou mini indicador ao lado do KPI. |
| Regiões | Mencionado na descrição, não implementado | Remover da descrição ou, no futuro, adicionar mapa/lista por estado/cidade se houver dado de endereço. |
| Exportar | Não existe | Botão “Exportar (CSV/Excel)” para os dados do período (consultas, receitas, financeiro). |
| Data da última atualização | Não exibido | Mostrar “Dados atualizados em: DD/MM/AAAA HH:mm” para confiança. |

---

## 3. Layout e estrutura da página

### 3.1 Pontos positivos

- Filtros de período no topo, visíveis.
- Grid responsivo (1/2/4/6 colunas) para os KPIs.
- Uso de `motion` (Framer Motion) para entrada suave.
- Agrupamento lógico: KPIs → percentuais → gráficos → resumo.

### 3.2 Problemas e sugestões

| Problema | Sugestão |
|----------|----------|
| Muitos cards iguais em sequência (6 + 4) sem hierarquia visual | Dividir em **seções nomeadas**: “Visão geral”, “Consultas”, “Financeiro”, “Acessos e usuários”, “Saques”, “Totais acumulativos”. Cada seção com título (h2) e possível colapso (accordion) em mobile. |
| “Resumo geral” no final parece secundário | Mover “Totais acumulativos” (pacientes totais, médicos, receita histórica, consultas totais) para o topo ou para uma barra lateral/faixa fixa, e deixar “Resumo do período” explícito. |
| Gráficos só em barras horizontais | Incluir pelo menos um gráfico de **linha** ou **área** para evolução no tempo (ex.: receita acumulada no período, consultas realizadas por dia). Facilita tendência. |
| Sem resumo “one glance” | Adicionar no topo, logo abaixo dos filtros, uma **linha de resumo** (ex.: “Neste período: X consultas, R$ Y receita, Z acessos”) em uma única faixa. |
| Filtro “Personalizado” competindo com botões | Manter botões de período; deixar “Intervalo personalizado” em um dropdown “Mais opções” ou em uma segunda linha para não poluir. |

---

## 4. Design e UI

### 4.1 Consistência

- Cards brancos, borda cinza, sombra leve: alinhado ao restante do admin.
- Ícones Lucide por tipo (Calendar, FileText, CreditCard, etc.): bom.

### 4.2 Melhorias sugeridas

| Aspecto | Sugestão |
|--------|----------|
| **Hierarquia** | Título da página (h1) maior e com maior contraste; subtítulo mais discreto. Separar seções com `border-t` ou espaçamento maior em vez de só margem. |
| **Cores** | Manter paleta atual; usar verde para “positivo” (realizadas, receita), vermelho para cancelamentos/no-show, amarelo/âmbar para “em andamento” e azul para agendadas. Evitar muitos tons no mesmo bloco. |
| **Números** | Valores monetários sempre com símbolo R$ e formatação pt-BR. Números grandes (ex.: receita) podem ter peso maior (font-bold) e tamanho ligeiramente maior. |
| **Empty states** | Quando `chart.length === 0`, usar mensagem amigável: “Nenhuma consulta neste período” com ícone e, se fizer sentido, link para “Ver todos os períodos” ou “Alterar filtro”. |
| **Loading** | Manter skeleton; garantir que apenas a área de conteúdo troque (não o layout inteiro), para não “piscar” o cabeçalho e filtros. |
| **Acessibilidade** | Gráficos com `role="img"` e `aria-label` descritivo; barras com cores + texto (não só cor). Contraste de texto em cinza sobre fundo branco dentro do padrão. |

### 4.3 Responsividade

- Em telas pequenas, os 6 KPIs em 1 coluna podem ficar longos: considerar **2 colunas** (grid-cols-2) no mobile para reduzir scroll.
- Filtros: em mobile, colocar período em uma linha e “Personalizado” em linha abaixo ou em drawer.
- Gráficos de barras horizontais: garantir que não quebrem (overflow-x com scroll suave se necessário).

---

## 5. UX (fluxo e interação)

### 5.1 Descoberta e clareza

- **Título:** Manter “Métricas da Plataforma” e ajustar o subtítulo para refletir o que realmente existe: “Consultas, receitas, acessos, financeiro e indicadores por período.” (remover “regiões” até haver dados).
- **Legendas:** Em todos os gráficos, legenda fixa (ex.: Agendadas / Realizadas / Em andamento / Canceladas) visível sem hover.
- **Tooltips:** Em KPIs, tooltip opcional explicando o que é “Taxa de conclusão” e “Taxa de cancelamento” (ex.: “Consultas realizadas / total de consultas no período”).

### 5.2 Ações

- **Atualizar:** Botão “Atualizar” ao lado dos filtros para recarregar dados sem mudar período (útil se houver atualização em tempo quase real).
- **Exportar:** Como citado, “Exportar CSV” ou “Exportar Excel” para o período atual.
- **Links contextuais:** Nos cards “Consultas”, “Receitas”, “Pagamentos”, adicionar link “Ver lista” para `/admin/consultas`, `/admin/receitas`, `/admin/pagamentos` com filtro de data quando possível.

### 5.3 Performance e feedback

- Evitar re-fetch ao montar se período não mudou (já usa `useEffect` com dependências corretas).
- Após alterar período, manter skeleton até a resposta; não mostrar dados antigos com novo período.
- Se a API demorar, considerar loading progressivo: primeiro KPIs, depois gráficos (se no futuro a API puder ser dividida).

---

## 6. Resumo das prioridades de melhoria

### Alta prioridade (conteúdo + valor para o admin)

1. **Totais acumulativos** – Bloco “Desde o início” com receita total, consultas totais realizadas, receitas totais, total de saques pagos.
2. **Solicitações de saques** – Cards e/ou tabela resumo por status (solicitado, processando, pago, rejeitado) e valores; depende de expor `DoctorPayout` na API de métricas.
3. **Separar canceladas e no-show** – Em KPIs e no gráfico, para análise de abandono.
4. **Resumo de vendas/pagamentos** – Quantidade e valor por status (pagos, pendentes, falhas, reembolsos).

### Média prioridade (layout e UX)

5. **Seções nomeadas** – “Visão geral”, “Consultas”, “Financeiro”, “Saques”, “Totais acumulativos” com títulos e possível colapso.
6. **Um gráfico de tendência** – Linha ou área por dia/mês para consultas ou receita.
7. **Data da última atualização** – Exibir no rodapé do bloco ou ao lado dos filtros.
8. **Links “Ver lista”** – Dos KPIs para as páginas de listagem correspondentes.

### Baixa prioridade (refino)

9. **Comparativo com período anterior** – Ex.: “+10% em relação ao mês passado”.
10. **Exportar CSV/Excel** – Para o período selecionado.
11. **Tooltips nos indicadores** – Explicando taxa de conclusão/cancelamento.
12. **Ajuste de copy** – Remover “regiões” da descrição até existir funcionalidade.

---

## 7. Próximos passos técnicos sugeridos

1. **API `/api/admin/metrics`:**
   - Incluir totais acumulativos (count de consultas COMPLETED, sum de payments PAID, count de prescriptions, etc., sem filtro de data).
   - Incluir agregados de `DoctorPayout` por status e soma de valores (período + acumulado).
   - Incluir contagem de pagamentos por status (PENDING, PAID, FAILED, REFUNDED).
   - Retornar `generatedAt` (timestamp) para exibir “Dados atualizados em”.

2. **Página `app/admin/metricas/page.tsx`:**
   - Atualizar interface `MetricsData` com os novos campos (accumulated, payouts, paymentCountByStatus).
   - Adicionar seções e blocos conforme prioridades acima.
   - Separar canceladas e no-show na UI e, se necessário, na API.
   - Adicionar bloco de saques e bloco de totais acumulativos.
   - Ajustar layout (seções, um gráfico de linha se usar lib de charts) e copy (remover “regiões”).

3. **Opcional:** Biblioteca de gráficos (ex.: Recharts, Chart.js) para gráfico de linha/área além das barras atuais.

---

Este documento serve como base para implementação incremental: primeiro API e totais acumulativos + saques, depois ajustes de layout e seções, e por fim exportação e comparativo.
