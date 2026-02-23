# Guia completo: onde substituir imagens no layout, banner e identidade visual

Este documento descreve **todos os pontos do site** onde há imagens que fazem parte do layout, banners, hero, logo e identidade visual. Use-o para orientar a criação ou substituição das imagens (por exemplo, ao pedir imagens ao ChatGPT ou a um designer).

---

## Resumo rápido

| Tipo | Onde aparece | Configurável pelo admin? | Onde editar no admin |
|------|----------------|---------------------------|----------------------|
| **Logo** | Navbar, Footer, Login, áreas logadas, receita, favicon | **Sim** | Identidade Visual → Marca e logo |
| **Hero (banner principal)** | Primeira dobra da página inicial | **Sim** | Identidade Visual → Banner Hero |
| **Imagens do processo (4 etapas)** | Seção "Como funciona" na home | **Sim** | Identidade Visual → Como funciona |
| **Depoimentos (fotos)** | Seção de depoimentos na home | **Sim** (cada depoimento tem foto) | Identidade Visual → Depoimentos |
| **Equipe (Sobre Nós)** | Página Sobre Nós (3 cards) | **Sim** | Identidade Visual → Equipe (Sobre Nós) |
| **Formas de consumo (4 itens)** | Seção "Formas de consumo" na home; cada item expandido mostra texto + imagem à direita | **Sim** | Identidade Visual → Formas de consumo |
| **Eventos / Galeria** | Seção eventos na home + galeria | Sim (eventos têm capa) | Admin → Galeria / Eventos |
| **Blog (capas)** | Listagem e posts do blog | Sim (cada post tem `coverImage`) | Admin → Blog |
| **Favicon / ícone do site** | Aba do navegador, favoritos | **Sim** (usa a mesma URL do logo) | Identidade Visual → Marca e logo |

---

## 1. Logo da marca

### Onde é usado
- **Navbar (cabeçalho)** – página inicial, blog, sobre-nos, galeria, termos, privacidade, recuperar senha. Canto superior esquerdo, ao lado dos links de navegação.
- **Footer** – rodapé do site (logo + texto institucional).
- **Páginas de login e recuperar senha** – logo acima do formulário.
- **Área do paciente** – barra lateral e versão mobile (logo no topo).
- **Área do médico** – barra lateral e versão mobile.
- **Painel admin** – barra lateral e versão mobile.
- **Visualização de receita (admin)** – cabeçalho da receita médica (logo à esquerda do título “RECEITA MÉDICA – USO MEDICINAL DE CANNABIS”).

### Especificações técnicas para criação
- **Proporção sugerida:** algo em torno de **200×60 px** (ou proporção similar, ex.: 3:1). O código exibe com `height` ~44–50 px no navbar e ~50 px no footer, com largura automática (`w-auto`).
- **Formato:** **PNG com transparência** (fundo transparente), para funcionar bem no navbar branco e no footer escuro.
- **Tamanho de arquivo:** idealmente até **~50 KB**.
- **Conteúdo:** apenas o logo (marca, ícone + texto “CannabiLizi” ou o que for a identidade). Sem bordas ou fundo colorido que quebrem em fundos claros/escuros.

### Onde configurar / substituir
- **Admin → Identidade Visual → Marca e logo:** campo “URL do logo”. Ao salvar, o logo passa a ser usado em **todo o site** (navbar, footer, login, áreas logadas, receita, favicon). Pode ser caminho local (ex.: `/images/cannalize-logo.png`) ou URL externa.
- O **favicon e ícone da Apple** usam a mesma URL configurada para o logo. Ou seja, **uma única URL define o logo no site e o ícone da aba/navegador**.

---

## 2. Imagem do Hero (banner principal da página inicial)

### Onde é usado
- **Primeira dobra da home:** à direita do título e do texto (em desktop); abaixo do texto (em mobile). É a imagem principal que ilustra consulta/tratamento e transmite confiança.

### Contexto no layout
- Fica dentro de um bloco com **altura ~400–500 px** e **bordas arredondadas** (`rounded-2xl`). A imagem preenche 100% da largura e altura desse bloco (`object-cover`).
- Por cima da imagem há um overlay com um box de estatísticas (“+90.000 Atendimentos”) e elementos decorativos. A imagem deve funcionar bem com esse overlay (não depender de detalhes finos no centro).
- Lado esquerdo: título (headline), subtítulo, botão “Quero iniciar meu tratamento”, link “Como funciona” e mini prova social (estrelas + “X pacientes”).

### Especificações técnicas para criação
- **Resolução sugerida:** **1200×800 px** (proporção 3:2 ou 4:3). O componente usa `width={800}` e `height={600}` para referência; o container é responsivo.
- **Formato:** JPEG ou PNG; **tamanho recomendado até ~300 KB**.
- **Conteúdo sugerido:** cena que comunique **consulta online**, **médico com paciente** ou **tratamento com cannabis** (ex.: videoconferência, consultório, gotas de óleo, ambiente profissional). Evitar imagens puramente decorativas; o foco é explicar o serviço e gerar confiança.

### Onde configurar
- **Admin → Identidade Visual → Banner Hero:** campo “URL da imagem do Hero”.
- Pode ser caminho local, ex.: `/images/hero/doctor-consultation.jpg`, ou URL externa.
- Fallback no código se não houver configuração: `/images/hero/doctor-consultation.jpg`. Placeholder de erro: `/images/hero/placeholder.jpg`. Coloque os arquivos em `public/images/hero/` se for usar caminhos locais.

---

## 3. Imagens das 4 etapas do processo (“Como funciona”)

### Onde são usadas
- **Seção “O processo da CannabiLize acontece em quatro etapas rápidas”** na página inicial.
- Cada etapa é um **card** (Consulta Médica, Receita Médica, Autorização ANVISA, Importação e Entrega). Ao expandir o card (“Saiba mais”), aparece uma **imagem ilustrativa** acima do texto de detalhes.

### Papel de cada imagem
1. **Etapa 1 – Consulta Médica:** ilustrar consulta médica online / videoconferência.
2. **Etapa 2 – Receita Médica:** ilustrar receita médica digital / documento.
3. **Etapa 3 – Autorização ANVISA:** ilustrar processo burocrático / documentação / ANVISA.
4. **Etapa 4 – Importação e Entrega:** ilustrar entrega, medicamento, caixa, etc.

### Especificações técnicas para criação
- **Resolução sugerida:** **400×300 px** (4:3) ou ícone **128×128 px**. Altura exibida no card expandido é **192 px** (`h-48`), largura 100% do card.
- **Formato:** JPEG ou PNG; **até ~100 KB** por imagem.
- **Estilo:** fotos ou ilustrações claras, que ajudem a explicar a etapa (não apenas decorativas).

### Onde configurar
- **Admin → Identidade Visual → Como funciona:** campos “Imagem etapa 1” a “Imagem etapa 4”.
- Valores podem ser URLs ou caminhos como `/images/process/consultation.jpg`, `/images/process/prescription.jpg`, `/images/process/anvisa.jpg`, `/images/process/delivery.jpg`.
- Fallbacks no código: `/images/process/consultation.jpg`, `prescription.jpg`, `anvisa.jpg`, `delivery.jpg` e `step-1.jpg` … `step-4.jpg`. Coloque os arquivos em `public/images/process/` se usar caminhos locais.

---

## 4. Imagens da seção Formas de consumo

### Onde são usadas
- **Seção "Formas de consumo"** na página inicial (home).
- Cada um dos 4 itens (Óleo, Creme, Jujuba, Softgel) pode ter **título**, **descrição** e **imagem**.
- Ao expandir o item ("Ver mais"), a descrição aparece à esquerda e a **imagem à direita**, em bloco com cantos arredondados (como na referência do site).

### Papel de cada imagem
- Ilustrar a forma de consumo (ex.: pessoa aplicando creme, frasco de óleo, etc.) e transmitir confiança.

### Especificações técnicas para criação
- **Proporção sugerida:** **4:3** (ex.: 400×300 px). O componente exibe com `aspect-[4/3]` e largura até ~380 px no desktop.
- **Formato:** JPEG, PNG ou WebP; **até 2 MB** por imagem.
- **Conteúdo:** foto ou ilustração que represente a forma de consumo (ex.: aplicação tópica do creme, gotas de óleo, etc.).

### Onde configurar
- **Admin → Identidade Visual → Formas de consumo:** para cada um dos 4 itens há campo **"Imagem do item (upload ou URL)"**. É possível enviar arquivo (upload) ou informar URL. Após enviar ou editar, clique em **"Salvar Formas de consumo"** para aplicar na home.
- Uploads vão para `public/images/consumption/` (ex.: `consumption_1-1234567890.jpg`). Também é possível usar URL externa.

---

## 5. Fotos dos depoimentos (testimonials)

### Onde são usadas
- **Seção “Relatos reais de pacientes”** na página inicial.
- Cada depoimento mostra: estrelas, trecho do relato, e no rodapé do card a **foto (avatar)** da pessoa, nome e data.

### Especificações técnicas para criação
- **Formato:** quadrado ou que funcione bem em círculo. O componente usa um **Avatar** (círculo); tamanho “lg” (por volta de 48 px de diâmetro na interface).
- **Resolução:** **mínimo ~96×96 px**; **128×128 ou 200×200 px** é confortável.
- **Conteúdo:** foto de rosto ou busto da pessoa (ou avatar/ilustração, se for depoimento genérico). Fundo neutro ou que recorte bem em círculo.

### Onde configurar
- **Admin → Identidade Visual → Depoimentos da landing.** Cada depoimento tem campo **“URL da foto (avatar)”** (`photoUrl`). Pode ser URL externa ou caminho local, ex.: `/images/testimonials/natalia-almeida.jpg`.
- No código, há lista padrão com nomes como `natalia-almeida.jpg`, `luciana-pereira.jpg`, `beatriz-dobruski.jpg`, `vera-oliveira.jpg`, `luadi-morais.jpg`, `thiago-jatoba.jpg`. Coloque em `public/images/testimonials/` se usar caminhos locais.

---

## 6. Fotos da equipe (página Sobre Nós)

### Onde são usadas
- **Página “Sobre Nós”** (`/sobre-nos`), na seção **“Profissionais Especializados”**.
- Três cards: dois médicos (Dr. João Silva, Dra. Maria Santos) e “Equipe de Suporte”. Cada card tem uma **foto redonda** (128×128 px) com borda verde e badge de experiência.

### Especificações técnicas para criação
- **Formato:** quadrado; exibido em **128×128 px** em círculo (`rounded-full`).
- **Resolução:** **mínimo 128×128 px**; **256×256 px** ou maior é ideal.
- **Conteúdo:** foto de rosto/busto profissional (ou ilustração) para cada membro. Fallback no código: `/images/team/default-avatar.jpg`.

### Onde configurar
- **Admin → Identidade Visual → Equipe (Sobre Nós):** três campos “Foto do membro 1”, “Foto do membro 2”, “Foto do membro 3”. Ao salvar, as fotos passam a ser usadas na página Sobre Nós (nomes e cargos continuam os padrões do sistema; apenas as fotos são editáveis aqui).

---

## 7. Eventos / Galeria (home e galeria)

### Onde são usadas
- **Seção “Nossa história está apenas começando”** na home: até 3 eventos em cards com título, data, descrição e link “Ver fotos”.
- No código, cada evento tem um campo `image` (ex.: `/images/events/click-runner.webp`). Na implementação atual do `EventsSection`, o card usa um **gradiente** e o título no centro; a imagem do evento não é exibida no trecho que foi analisado, mas o **modelo de dados** e a **galeria** (admin e página pública) usam `coverImage` para eventos. Ou seja, as imagens de eventos são mais relevantes na **galeria** e no admin de eventos.

### Especificações (para capa de evento)
- **Proporção:** retangular, ex.: **16:9** ou **4:3**; altura de exibição em cards ~192 px (`h-48`).
- **Formato:** JPEG, PNG ou WebP; tamanho razoável (ex.: até 200 KB).

### Onde configurar
- **Admin → Galeria / Eventos:** ao criar/editar evento, há campo para **imagem de capa** (`coverImage`). Pode ser URL. Não há pasta fixa obrigatória; os eventos vêm do banco.

---

## 7. Blog (imagem de capa dos artigos)

### Onde são usadas
- **Listagem do blog** e **página do artigo:** cada post pode ter uma **imagem de capa** (`coverImage`).
- Na home, o componente **BlogPreview** hoje usa um **gradiente** (verde) no lugar da capa; a listagem em `/blog` e a página interna do post podem exibir a capa se existir no banco.

### Especificações técnicas para criação
- **Proporção:** ex.: **16:9** ou **2:1**; altura típica em cards ~192 px.
- **Formato:** JPEG ou PNG; tamanho moderado (ex.: até 200 KB).

### Onde configurar
- **Admin → Blog:** ao criar/editar artigo, campo **“URL da Imagem de Capa”** (`coverImage`). Pode ser URL externa ou caminho em `/public`.

---

## 9. Favicon e ícone do site

### Onde são usados
- **Aba do navegador** (favicon).
- **Tela inicial / favoritos no celular** (Apple touch icon).

### Especificações técnicas para criação
- O projeto usa **o mesmo arquivo do logo:** `/images/cannalize-logo.png` (definido em `app/layout.tsx` em `metadata.icons`).
- Para favicon, o ideal é uma versão **quadrada** e **simplificada** (ex.: só o ícone da marca) em **32×32 px** ou **48×48 px**. Se continuar usando o logo completo, ele será escalado; pode ficar pouco legível em 16×16. Se quiser favicon dedicado, será necessário alterar `app/layout.tsx` para apontar para outro arquivo (ex.: `favicon.ico` ou `icon.png`).

### Onde configurar
- **Não há admin.** Substituir `public/images/cannalize-logo.png` (e, se quiser, adicionar no layout um ícone específico para favicon em outro caminho).

---

## 10. Outros pontos que usam imagens (contexto)

- **Carteirinha digital:** usa a **foto do paciente** (vinda do perfil do usuário), não uma imagem fixa de layout.
- **Receita médica (PDF):** o gerador de PDF usa **texto** para “CannabiLizi” e subtítulos no cabeçalho; **não** desenha o logo como imagem no PDF. A **visualização em HTML** da receita no admin (`PrescriptionView`) usa a imagem do logo em `/images/cannalize-logo.png`.
- **Placeholders gerais:** componente `OptimizedImage` usa fallback `/images/placeholder.jpg` quando não informado. Útil ter um placeholder genérico em `public/images/placeholder.jpg` para evitar ícone de erro.

---

## Resumo de pastas em `public/images/`

Para organizar as substituições, estas são as pastas/caminhos esperados pelo código:

| Pasta/caminho | Conteúdo |
|----------------|----------|
| `public/images/cannalize-logo.png` | Logo principal + favicon |
| `public/images/hero/` | `doctor-consultation.jpg`, `placeholder.jpg` (hero) |
| `public/images/process/` | `consultation.jpg`, `prescription.jpg`, `anvisa.jpg`, `delivery.jpg` (e opcionalmente `step-1.jpg` … `step-4.jpg`) |
| `public/images/consumption/` | Imagens dos 4 itens da seção Formas de consumo (ex.: `consumption_1-*.jpg`) |
| `public/images/testimonials/` | Fotos dos depoimentos (nomes conforme admin ou lista padrão) |
| `public/images/team/` | `dr-joao-silva.jpg`, `dra-maria-santos.jpg`, `equipe-suporte.jpg`, `default-avatar.jpg` |
| `public/images/events/` | Imagens de eventos (ex.: `click-runner.webp`, etc.), se usar caminhos locais |
| `public/images/placeholder.jpg` | Placeholder genérico (opcional) |

---

## O que informar ao ChatGPT (ou designer) ao pedir as imagens

1. **Logo:** PNG transparente, ~200×60 px (ou proporção 3:1), até 50 KB; será usado no cabeçalho, rodapé, login e como ícone do site.
2. **Hero:** 1200×800 px (3:2 ou 4:3), JPEG/PNG até 300 KB; cena de consulta online / médico-paciente / cannabis medicinal; será exibida na primeira dobra da home com overlay de texto.
3. **Processo (4 imagens):** 400×300 px (4:3), JPEG/PNG até 100 KB cada: (1) consulta online, (2) receita digital, (3) documentação/ANVISA, (4) entrega/medicamento.
4. **Formas de consumo (4 imagens):** 4:3 (ex.: 400×300 px), JPEG/PNG/WebP até 2 MB cada; ilustram cada forma de consumo (óleo, creme, jujuba, softgel); aparecem à direita do texto ao expandir o item na home.
5. **Depoimentos:** fotos em círculo, mínimo 96×96 px (ideal 128×128 ou 200×200), uma por depoimento; estilo retrato/busto.
6. **Equipe (3 fotos):** quadrado 128×128 px (ou maior), exibidas em círculo; estilo profissional (médicos e equipe de suporte).
7. **Eventos e blog:** retangular (16:9 ou 4:3), tamanho moderado; eventos e artigos têm campo de URL no admin.

Com isso, você tem um mapa completo de onde cada tipo de imagem aparece e quais especificações usar ao elaborar ou substituir arquivos.
