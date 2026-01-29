# 📸 Guia Prático: Implementação de Imagens de Pessoas

**Objetivo:** Adicionar imagens reais de pessoas para humanizar a marca e aumentar conversão.

---

## 🎯 POR QUE IMAGENS DE PESSOAS?

### Benefícios Comprovados
- ✅ **+30% de conversão** em CTAs
- ✅ **+40% de tempo** na página
- ✅ **+25% de confiança** na marca
- ✅ **Redução de ansiedade** do usuário
- ✅ **Humanização** da marca

### Onde Usar
1. Hero Section (maior impacto)
2. Depoimentos (credibilidade)
3. Sobre Nós (equipe)
4. Processo (ilustrações)
5. Blog (autores)

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Hero Section 🔴 ALTA PRIORIDADE

**Onde:** `components/home/HeroSection.tsx`

**Antes:**
```tsx
<div className="absolute inset-0 bg-gradient-to-br from-green-500 via-green-600 to-green-700">
  {/* Apenas gradiente */}
</div>
```

**Depois:**
```tsx
<OptimizedImage
  src="/images/hero/doctor-consultation.jpg"
  alt="Médico especialista em cannabis medicinal realizando consulta online com paciente"
  width={800}
  height={600}
  priority={true}
  className="rounded-2xl shadow-2xl object-cover"
  fill={false}
/>
```

**Onde obter a imagem:**
- Unsplash: "doctor consultation telemedicine"
- Pexels: "medical consultation online"
- Foto própria (ideal)

**Sugestões de busca:**
- "doctor patient video call"
- "telemedicine consultation"
- "medical cannabis doctor"
- "online medical appointment"

---

### Fase 2: Depoimentos 🔴 ALTA PRIORIDADE

**Onde:** `components/home/Testimonials.tsx`

**Antes:**
```tsx
<div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-2xl shadow-md">
  {testimonial.avatar} {/* Emoji */}
</div>
```

**Depois:**
```tsx
<OptimizedImage
  src={testimonial.photo || '/images/testimonials/default-avatar.jpg'}
  alt={`Foto de ${testimonial.name}`}
  width={64}
  height={64}
  className="rounded-full border-2 border-green-200 shadow-md object-cover"
/>
```

**Estrutura de dados atualizada:**
```typescript
interface Testimonial {
  name: string;
  date: string;
  rating: number;
  comment: string;
  source: string;
  photo?: string; // Adicionar campo de foto
}
```

**Onde obter avatares:**
1. **Fotos reais** (com permissão dos pacientes)
2. **Avatares profissionais** (se não tiver fotos)
   - UI Faces: https://uifaces.co
   - Avatar Generator: https://avatar-generator.com
3. **Placeholder inteligente:**
   - Usar iniciais do nome
   - Gradiente baseado no nome

**Componente de Avatar Inteligente:**
```tsx
// components/ui/Avatar.tsx
'use client';

import OptimizedImage from './OptimizedImage';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getColorFromName = (name: string) => {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-green-400 to-green-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-orange-400 to-orange-600',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const sizePx = sizeMap[size];

  if (src) {
    return (
      <OptimizedImage
        src={src}
        alt={`Foto de ${name}`}
        width={sizePx}
        height={sizePx}
        className={`rounded-full border-2 border-green-200 shadow-md object-cover ${className}`}
      />
    );
  }

  // Fallback: Iniciais com gradiente
  return (
    <div
      className={`w-${sizePx} h-${sizePx} rounded-full bg-gradient-to-br ${getColorFromName(name)} flex items-center justify-center text-white font-bold shadow-md ${className}`}
      style={{ width: sizePx, height: sizePx }}
    >
      <span className="text-sm">{getInitials(name)}</span>
    </div>
  );
}
```

---

### Fase 3: Seção "Sobre Nós" 🟡 MÉDIA PRIORIDADE

**Onde:** `components/about/AboutHero.tsx` e componentes relacionados

**Adicionar seção de equipe:**
```tsx
// components/about/AboutTeam.tsx
'use client';

import OptimizedImage from '@/components/ui/OptimizedImage';

const team = [
  {
    name: 'Dr. João Silva',
    role: 'Médico Especialista',
    crm: 'CRM123456',
    photo: '/images/team/dr-joao-silva.jpg',
    bio: 'Especialista em cannabis medicinal com 10 anos de experiência.',
  },
  // ... mais membros
];

export default function AboutTeam() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nossa Equipe
          </h2>
          <p className="text-lg text-gray-600">
            Profissionais especializados em cannabis medicinal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow text-center"
            >
              <div className="relative w-32 h-32 mx-auto mb-4">
                <OptimizedImage
                  src={member.photo}
                  alt={`Foto de ${member.name}`}
                  width={128}
                  height={128}
                  className="rounded-full object-cover border-4 border-green-200"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {member.name}
              </h3>
              <p className="text-green-600 font-medium mb-2">{member.role}</p>
              <p className="text-sm text-gray-500 mb-3">{member.crm}</p>
              <p className="text-gray-600 text-sm">{member.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

### Fase 4: Processo com Imagens 🟡 MÉDIA PRIORIDADE

**Onde:** `components/home/ProcessSteps.tsx`

**Adicionar imagens ilustrativas:**
```tsx
const steps = [
  {
    number: 1,
    title: 'Consulta Médica',
    // ... outros campos
    image: '/images/process/consultation.jpg', // Substituir emoji
    imageAlt: 'Médico realizando consulta online',
  },
  // ...
];

// No componente:
<div className="relative h-48 rounded-xl overflow-hidden mb-4">
  <OptimizedImage
    src={step.image}
    alt={step.imageAlt}
    width={400}
    height={200}
    className="object-cover w-full h-full"
  />
</div>
```

---

### Fase 5: Blog com Capas 🟢 BAIXA PRIORIDADE

**Onde:** `components/home/BlogPreview.tsx` e `app/blog/page.tsx`

**Adicionar imagens de capa:**
```tsx
<OptimizedImage
  src={post.coverImage || '/images/blog/default-cover.jpg'}
  alt={`Capa do artigo: ${post.title}`}
  width={400}
  height={250}
  className="rounded-lg object-cover w-full h-full"
/>
```

---

## 🖼️ ONDE OBTER IMAGENS

### 1. Fotos Próprias (Ideal)
- Fotos da equipe
- Consultas (com autorização)
- Eventos reais
- Pacientes (com autorização e assinatura de termo)

### 2. Stock Photos Gratuitas

**Unsplash** (https://unsplash.com)
- Alta qualidade
- Licença livre
- Buscar: "doctor", "telemedicine", "medical consultation"

**Pexels** (https://pexels.com)
- Boa qualidade
- Licença livre
- Buscar termos similares

**Pixabay** (https://pixabay.com)
- Variedade grande
- Licença livre

### 3. Avatares para Depoimentos

**UI Faces** (https://uifaces.co)
- Avatares profissionais
- API disponível

**Avatar Generator** (https://avatar-generator.com)
- Gerar avatares personalizados

**Placeholder com iniciais** (implementado acima)

---

## 📐 ESPECIFICAÇÕES TÉCNICAS

### Tamanhos Recomendados

| Uso | Largura | Altura | Formato |
|-----|---------|--------|---------|
| Hero | 1200px | 600px | WebP/AVIF |
| Depoimentos (avatar) | 128px | 128px | WebP |
| Equipe | 400px | 400px | WebP |
| Processo | 800px | 500px | WebP |
| Blog (capa) | 1200px | 630px | WebP |

### Otimização

```bash
# Converter para WebP
# Usar ferramentas como:
# - Squoosh (https://squoosh.app)
# - ImageOptim
# - Sharp (Node.js)
```

### Estrutura de Pastas

```
public/
  images/
    hero/
      doctor-consultation.jpg
      hero-alt.jpg
    testimonials/
      natalia-almeida.jpg
      luciana-pereira.jpg
      default-avatar.jpg
    team/
      dr-joao-silva.jpg
      equipe-suporte.jpg
    process/
      consultation.jpg
      prescription.jpg
      anvisa.jpg
      delivery.jpg
    blog/
      default-cover.jpg
      post-1-cover.jpg
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Hero Section
- [ ] Baixar/selecionar imagem
- [ ] Otimizar (WebP, compressão)
- [ ] Adicionar ao componente
- [ ] Testar responsividade
- [ ] Adicionar alt text descritivo

### Depoimentos
- [ ] Criar componente Avatar
- [ ] Adicionar campo photo aos dados
- [ ] Implementar fallback (iniciais)
- [ ] Testar com e sem fotos
- [ ] Otimizar avatares

### Sobre Nós
- [ ] Criar componente AboutTeam
- [ ] Coletar fotos da equipe
- [ ] Adicionar ao layout
- [ ] Estilizar cards

### Processo
- [ ] Selecionar imagens ilustrativas
- [ ] Adicionar aos steps
- [ ] Testar layout

### Blog
- [ ] Adicionar campo coverImage
- [ ] Criar imagens padrão
- [ ] Implementar no componente

---

## 🎨 EXEMPLO COMPLETO: Hero Section

```tsx
// components/home/HeroSection.tsx (atualizado)
'use client';

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';
import OptimizedImage from '@/components/ui/OptimizedImage';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-green-50 via-white to-green-50 py-16 lg:py-24 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left space-y-6">
            {/* ... conteúdo existente ... */}
          </div>

          {/* Image Section - ATUALIZADO */}
          <div className="relative">
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <OptimizedImage
                src="/images/hero/doctor-consultation.jpg"
                alt="Médico especialista em cannabis medicinal realizando consulta online com paciente via videoconferência"
                width={800}
                height={600}
                priority={true}
                className="object-cover w-full h-full"
                fill={false}
              />
              
              {/* Overlay sutil para melhorar legibilidade do texto sobreposto (se houver) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 border-2 border-green-200 hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Play className="text-green-600" size={20} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">Consulta Online</div>
                  <div className="text-xs text-gray-600">24h por dia</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## 📊 MÉTRICAS DE SUCESSO

### Antes
- Hero: Gradiente genérico
- Depoimentos: Emojis
- Equipe: Não existe
- Conversão: Baseline

### Depois (Meta)
- Hero: Foto real profissional
- Depoimentos: Avatares reais ou inteligentes
- Equipe: Seção completa
- Conversão: +30%

---

## 🚀 PRÓXIMOS PASSOS

1. **Imediato:** Adicionar foto no Hero
2. **Curto prazo:** Implementar avatares nos depoimentos
3. **Médio prazo:** Criar seção de equipe
4. **Longo prazo:** Fotos próprias da equipe/pacientes

---

**Última atualização:** 28 de Janeiro de 2026
