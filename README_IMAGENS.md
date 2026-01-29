# 📸 Guia Rápido: Adicionar Imagens ao Site

Este guia mostra onde adicionar as imagens para que o site fique completo.

---

## 📁 ESTRUTURA DE PASTAS

Crie as seguintes pastas em `public/images/`:

```
public/
  images/
    hero/
    testimonials/
    team/
    process/
```

---

## 🎯 IMAGENS PRIORITÁRIAS

### 1. Hero Section (ALTA PRIORIDADE)

**Caminho:** `public/images/hero/doctor-consultation.jpg`

**Especificações:**
- Tamanho: 1200x600px (ou proporção 2:1)
- Formato: JPG ou WebP
- Conteúdo: Médico realizando consulta online
- Onde buscar: Unsplash, Pexels
- Termos: "doctor consultation telemedicine"

**Fallback:** Se não existir, mostra gradiente (já implementado)

---

### 2. Equipe (MÉDIA PRIORIDADE)

**Caminhos:**
- `public/images/team/dr-joao-silva.jpg`
- `public/images/team/dra-maria-santos.jpg`
- `public/images/team/equipe-suporte.jpg`
- `public/images/team/default-avatar.jpg` (fallback)

**Especificações:**
- Tamanho: 400x400px (quadrado)
- Formato: JPG ou WebP
- Conteúdo: Fotos profissionais dos membros da equipe
- Se não tiver foto: usa iniciais automaticamente (já implementado)

---

### 3. Processo (MÉDIA PRIORIDADE)

**Caminhos:**
- `public/images/process/consultation.jpg`
- `public/images/process/prescription.jpg`
- `public/images/process/anvisa.jpg`
- `public/images/process/delivery.jpg`

**Especificações:**
- Tamanho: 800x500px (ou proporção 16:10)
- Formato: JPG ou WebP
- Conteúdo: Imagens ilustrativas de cada etapa

---

### 4. Depoimentos (OPCIONAL)

**Caminhos:**
- `public/images/testimonials/natalia-almeida.jpg`
- `public/images/testimonials/luciana-pereira.jpg`
- etc.

**Nota:** Se não adicionar fotos, o sistema usa iniciais automaticamente (já implementado)

---

## 🖼️ ONDE BAIXAR IMAGENS GRATUITAS

### Unsplash (Recomendado)
https://unsplash.com

**Termos de busca:**
- "doctor consultation"
- "telemedicine"
- "medical cannabis"
- "online medical appointment"

### Pexels
https://pexels.com

**Termos similares**

### Pixabay
https://pixabay.com

---

## ⚡ OTIMIZAÇÃO

### Converter para WebP (Recomendado)

**Ferramentas:**
- Squoosh: https://squoosh.app (online, gratuito)
- ImageOptim (Mac)
- Sharp (Node.js)

**Comando (se tiver Sharp):**
```bash
npm install sharp
node optimize-images.js
```

---

## ✅ CHECKLIST

- [ ] Criar pasta `public/images/hero/`
- [ ] Adicionar `doctor-consultation.jpg`
- [ ] Criar pasta `public/images/team/`
- [ ] Adicionar fotos da equipe (ou deixar vazio para usar iniciais)
- [ ] Criar pasta `public/images/process/`
- [ ] Adicionar imagens do processo (opcional)
- [ ] Otimizar todas as imagens (WebP)
- [ ] Testar no site

---

## 🎨 RESULTADO

Após adicionar as imagens:

✅ Hero section com foto real  
✅ Depoimentos com avatares (ou iniciais)  
✅ Equipe com fotos profissionais  
✅ Processo com imagens ilustrativas  
✅ Site mais profissional e humanizado  

---

**Nota:** O sistema já está preparado! Basta adicionar as imagens nas pastas indicadas. Se alguma imagem não existir, o sistema usa fallbacks elegantes automaticamente.
