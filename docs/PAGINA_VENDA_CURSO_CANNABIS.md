# Página de Venda do Curso de Cannabis — Estratégia, Copy e Implementação

Este documento reúne a estratégia da landing page de vendas do curso de cultivo, colheita e extração de óleo de cannabis, as diretrizes de design, copy, aspectos legais e checklist de implementação.

---

## 1. Estratégia geral da página

### Público-alvo
- **Iniciantes** com interesse em formação técnica e educacional.
- **Intermediários** que já cultivam ou estudam e querem aprofundar (colheita, extração, qualidade).
- **Profissionais** de saúde, pesquisa ou agronomia que atuam em contextos onde a lei permite.
- **Produtores/autorizados** em regiões com marco legal definido.
- **Uso medicinal** como contexto de interesse, sempre com linguagem que remeta a acompanhamento médico e lei local.

### Tom de comunicação
- **Educacional**: foco em aprendizado, não em “receita” ou passo a passo que viole leis.
- **Profissional**: vocabulário técnico quando necessário, sem sensacionalismo.
- **Confiável**: transparência sobre garantia, suporte e limites do curso.
- **Científico**: referência a boas práticas, segurança e legislação.

### Objetivo principal
- **Conversão para compra** do curso (clique no CTA → checkout/pagamento).

### Objetivos secundários
- Construir **confiança** e **autoridade** (quem criou, por que é seguro).
- **Esclarecer dúvidas** (FAQ: legalidade, segurança, para quem é, acesso, certificado, suporte).
- **Reduzir objeções** (garantia, avisos legais, “para quem não é”).

---

## 2. Estrutura da página (layout em seções)

A página implementada segue esta ordem:

| Seção | Objetivo |
|-------|----------|
| **Hero** | Headline forte, subheadline, CTA principal, elemento visual (mockup do curso). |
| **Problema/Dor** | Dificuldades do público: erros no cultivo, colheita, extração; riscos de fontes não confiáveis. |
| **Proposta de valor** | Diferenciais: segurança, legislação, base técnica, acesso e suporte. |
| **Conteúdo do curso** | 6 módulos descritos (legislação, botânica, ambiente, colheita, extração, qualidade). |
| **Para quem é / não é** | Alinhamento de expectativa e filtro de público. |
| **Autoridade** | Quem criou o curso; experiência e compromisso educacional/responsável. |
| **Prova social** | Depoimentos (placeholders; substituir por reais quando houver). |
| **Oferta** | O que está incluso, bônus (se houver), garantia, preço, CTA. |
| **FAQ** | Legalidade, segurança, para quem é, acesso, certificado, suporte, garantia. |
| **Rodapé** | Avisos legais, termos, privacidade, contato. |

---

## 3. Copywriting e headlines

### Princípios adotados
- **Clareza antes de criatividade**: mensagem entendida na primeira leitura.
- **Benefícios > características**: “aprenda com segurança e base técnica” em vez de só “curso com 6 módulos”.
- **Linguagem simples**, sem promessas irreais (ex.: “cura”, “resultado garantido”).
- **Posicionamento educacional e responsável**: ênfase em lei local e segurança.

### Headline principal — variações sugeridas (5–10)
1. **Implementada:** “Aprenda cultivo, colheita e extração de óleo de cannabis com segurança e base técnica”
2. “Curso completo de cannabis: do cultivo à extração, com segurança e respeito à lei”
3. “Formação técnica em cannabis: cultivo, colheita e extração com base científica”
4. “Aprenda cultivo e extração de óleo de cannabis de forma segura e dentro da lei”
5. “Do plantio ao óleo: curso técnico e responsável sobre cannabis”
6. “Curso de cannabis: conhecimento técnico, segurança e conformidade legal”
7. “Domine cultivo, colheita e extração de cannabis com método seguro e educacional”
8. “A formação que faltava: cannabis do cultivo à extração, com técnica e responsabilidade”

### Subheadline
- **Atual:** “Curso 100% online, com abordagem educacional e científica, para quem busca conhecimento em contextos onde a legislação permite.”

### CTAs variados
- “Quero aprender com segurança”
- “Acessar o curso agora”
- “Garantir minha vaga no curso”
- “Ver conteúdo do curso”
- “Quero garantir minha vaga”

### Microcopy
- **Botão principal:** “Quero aprender com segurança” / “Acessar o curso agora”
- **Secundário:** “Ver conteúdo do curso”
- **Oferta:** “Investimento único” / “ou em até 12x no cartão”
- **Garantia:** “Garantia de 7 dias: não gostou? Devolvemos 100%.”
- **Rodapé do CTA:** “Ao clicar, você será direcionado à página de pagamento seguro. O curso é destinado exclusivamente a fins educacionais e deve ser utilizado em conformidade com as leis da sua região.”

---

## 4. Design e UI

### Diretrizes
- **Estilo:** Clean, moderno, natural (verdes, neutros), com toque “científico” (clareza, hierarquia).
- **Paleta:**  
  - Primária: verde do projeto (`#00A859` e tons primary-*).  
  - Neutros: gray-50 a gray-900 para texto e fundos.  
  - Alertas: red/amber para “problemas/riscos”; green para “benefícios”.
- **Tipografia:** Inter (já no projeto); hierarquia clara (H1 > H2 > H3); corpo legível (text-base / text-lg).
- **Componentes:** Cards com borda sutil, ícones (lucide-react), grids responsivos, espaçamento generoso (py-16 / py-20).
- **Mobile-first:** Seções em coluna no mobile; grid 2–3 colunas no desktop.
- **CTAs:** Botão primário em destaque (bg-primary-600), contraste adequado; foco visível (focus:ring).
- **Acessibilidade:** Contraste mínimo WCAG AA; headings em ordem (H1 → H2 → H3); aria-labels e skip link já no layout global.

### Ritmo visual
- Seções alternadas: fundo branco / gray-50 para separação.
- Hero e oferta: gradiente verde (primary) para destaque e conversão.

---

## 5. UX e conversão

- **Fluxo:** Hero → problema → valor → conteúdo → público → autoridade → prova social → oferta → FAQ → rodapé.
- **CTAs:** Principal no hero e na seção oferta; link “Ver conteúdo do curso” no hero; “Garantir minha vaga” após módulos; sticky CTA no mobile (após ~50% do scroll, esconde perto do rodapé).
- **Redução de fricção:** Garantia em evidência; FAQ próximo à oferta; aviso legal claro (não promete uso ilegal).
- **Confiança:** Autoridade + prova social + garantia + avisos legais próximos ao CTA.
- **Sticky CTA (mobile):** Implementado em `CursoStickyCta.tsx`; só em telas pequenas.

---

## 6. Aspectos legais e responsabilidade

### Recomendações implementadas
- **Aviso no rodapé:** O curso é “exclusivamente educacional e informativo”; a legalidade varia por país/região; o usuário deve verificar e cumprir a legislação local; o conteúdo não é aconselhamento jurídico nem incentiva práticas ilegais.
- **Posicionamento do curso:** Sempre como “educacional”, “técnico”, “responsável”, “em contextos onde a legislação permite”.
- **Linguagem segura:** Evitar “como cultivar em casa” sem contexto legal; preferir “cultivo em contextos permitidos”, “conformidade com a lei da sua região”.
- **FAQ:** Perguntas sobre legalidade, segurança e “para quem não é” deixam explícito que não incentivamos uso/cultivo ilegal.
- **Por região:** Se o site for usado em mais de um país, considerar bloco de aviso por país (ex.: “No Brasil, o cultivo para uso pessoal ainda é restrito; consulte um advogado”).

---

## 7. SEO e performance

### Estrutura de headings
- **H1** (uma por página): “Aprenda cultivo, colheita e extração de óleo de cannabis com segurança e base técnica”
- **H2** por seção: Problema, Proposta de valor, Conteúdo, Para quem é, Autoridade, Depoimentos, Oferta, FAQ
- **H3** dentro de seções (módulos, “É para você se”, “Não é para você se”, etc.)

### Palavras-chave (orientação)
- Curso cannabis, cultivo cannabis, extração óleo cannabis, formação cannabis, cannabis medicinal, educação cannabis, legislação cannabis (sem black hat).

### Meta (implementadas na página)
- **Title:** “Curso de Cultivo, Colheita e Extração de Óleo de Cannabis | Formação Técnica e Responsável”
- **Description:** “Aprenda cultivo, colheita e extração de óleo de cannabis com base técnica e científica. Conteúdo educacional para uso em contextos legais. Verifique a legislação da sua região.”
- **Keywords:** curso cannabis, cultivo cannabis, extração óleo cannabis, formação cannabis, cannabis medicinal, educação cannabis
- **Open Graph:** title e description para compartilhamento.

### Performance
- Evitar scripts pesados acima da dobra.
- Imagens: quando houver fotos reais do curso, usar next/image e formatos modernos (WebP); preferir ícones/ilustrações leves no hero (atualmente sem imagem pesada).
- Fontes: Inter já carregada no layout; sem fontes extras na página do curso.

---

## 8. Entregáveis finais

### 8.1 Estrutura completa da página (outline)
Conforme seção 2: Hero → Problema → Valor → Conteúdo → Para quem é/não é → Autoridade → Prova social → Oferta → FAQ → Rodapé.

### 8.2 Textos iniciais (copy)
- Headlines, subheadlines, CTAs e microcopy estão na página e listados na seção 3.
- Textos dos módulos, “para quem é”, “não é”, oferta e FAQ estão em `app/curso-cannabis/page.tsx` e `components/curso/CursoFaq.tsx`.

### 8.3 Diretrizes de design e layout
Resumidas na seção 4 (paleta, tipografia, componentes, mobile-first, CTAs, acessibilidade).

### 8.4 Checklist de implementação
- [x] Rota `/curso-cannabis` com página completa
- [x] Hero com headline, subheadline, CTA e elemento visual (mockup)
- [x] Seção problema/dor (3 cards)
- [x] Seção proposta de valor (3 diferenciais)
- [x] Seção conteúdo (6 módulos)
- [x] Seção para quem é / não é
- [x] Seção autoridade
- [x] Seção prova social (placeholders)
- [x] Seção oferta (incluídos, preço, garantia, CTA)
- [x] FAQ (legalidade, segurança, acesso, certificado, suporte, garantia)
- [x] Rodapé com avisos legais e links (termos, privacidade)
- [x] Sticky CTA mobile
- [x] Metadata (title, description, keywords, OG)
- [ ] **Substituir** link do CTA por URL real de checkout quando houver
- [ ] **Incluir** link “Curso” na Navbar (opcional)
- [ ] **Substituir** depoimentos placeholder por depoimentos reais
- [ ] **Ajustar** preço R$ 497 conforme oferta real
- [ ] **Configurar** página de checkout/pagamento (Hotmart, Eduzz, própria, etc.)

### 8.5 Melhorias futuras (A/B e variações)
- **Headline:** Testar 2–3 variações (ex.: foco “segurança” vs “base técnica” vs “dentro da lei”).
- **CTA:** “Quero aprender com segurança” vs “Acessar o curso agora” vs “Garantir minha vaga”.
- **Preço:** Exibir valor à vista vs parcelado; testar posição do preço (acima vs abaixo dos benefícios).
- **Prova social:** Número de alunos, nota (ex.: “4,8 – 500+ alunos”); vídeo-depoimento curto.
- **Garantia:** Destaque visual (selo “7 dias”), ou texto expandido.
- **Formulário/lead:** Antes do checkout, captura de e-mail para nutrir (opcional).
- **Sticky CTA:** Testar mostrar também no desktop ou só mobile.

---

## 9. Observação importante

A página foi pensada para **clareza, responsabilidade, profissionalismo e segurança**, sem instruções que incentivem violação de leis locais. O conteúdo é apresentado como **educacional e informativo**, e o usuário é sempre lembrado a **verificar a legislação da sua região**. Assim, a página pode ser publicada em um site profissional com riscos legais reduzidos, desde que a operação comercial (venda, reembolso, suporte) também siga as leis aplicáveis.

---

## 10. Arquivos criados/alterados

| Arquivo | Descrição |
|---------|-----------|
| `app/curso-cannabis/page.tsx` | Página principal da landing (todas as seções). |
| `components/curso/CursoFaq.tsx` | FAQ expansível (legalidade, segurança, acesso, etc.). |
| `components/curso/CursoStickyCta.tsx` | CTA fixo no mobile. |
| `docs/PAGINA_VENDA_CURSO_CANNABIS.md` | Este documento (estratégia, copy, design, legal, SEO, checklist). |

**Próximo passo técnico:** Configurar a URL real de compra/checkout e apontar os botões “Acessar o curso agora” e “Quero aprender com segurança” para essa URL (ou para uma página intermediária de checkout no próprio site).
