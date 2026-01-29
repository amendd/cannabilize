# 🛡️ Estratégia Completa de Segurança e Proteção Contra Bots

## 📋 Visão Geral

Este documento descreve todas as medidas de segurança implementadas para proteger o site contra ataques de bots, spam, e outras ameaças de segurança.

---

## 🎯 Objetivos

1. **Proteger formulários** contra submissões automatizadas de bots
2. **Prevenir spam** e ataques de força bruta
3. **Garantir segurança geral** do sistema
4. **Manter boa experiência do usuário** (sem CAPTCHAs visuais intrusivos)
5. **Monitorar e detectar** tentativas de ataque

---

## 🔒 Camadas de Proteção Implementadas

### 1. **reCAPTCHA v3 (Google)**
- ✅ **Invisível**: Não interrompe o fluxo do usuário
- ✅ **Análise comportamental**: Analisa padrões de navegação
- ✅ **Score de risco**: Retorna score de 0.0 a 1.0
- ✅ **Configurável**: Threshold ajustável por tipo de formulário

**Como funciona:**
- Executa em background durante navegação
- Analisa comportamento do usuário
- Gera token que é validado no servidor
- Bloqueia automaticamente bots conhecidos

### 2. **Honeypot Fields**
- ✅ **Campos invisíveis**: Campos que humanos não veem, mas bots preenchem
- ✅ **Detecção automática**: Se preenchido = bot detectado
- ✅ **Zero impacto UX**: Usuários reais não veem nem interagem

**Implementação:**
- Campo CSS `display: none` ou `position: absolute` fora da tela
- Nome genérico que atrai bots (ex: "website", "url")
- Validação no servidor rejeita se preenchido

### 3. **Rate Limiting Inteligente**
- ✅ **Por IP**: Limita requisições por endereço IP
- ✅ **Por formulário**: Limites específicos por tipo de formulário
- ✅ **Por email/telefone**: Previne múltiplas contas do mesmo usuário
- ✅ **Janela deslizante**: Reset automático após período

**Limites configurados:**
- Formulário de agendamento: 3 por hora por IP
- Login: 5 tentativas por 15 minutos
- API geral: 200 requisições por 15 minutos

### 4. **Validação de Tempo de Preenchimento**
- ✅ **Tempo mínimo**: Detecta preenchimento muito rápido (bot)
- ✅ **Tempo máximo**: Detecta sessões abandonadas
- ✅ **Análise de padrões**: Identifica comportamento não-humano

**Thresholds:**
- Mínimo: 10 segundos (formulário complexo)
- Máximo: 30 minutos (sessão expirada)

### 5. **CSRF Protection**
- ✅ **Tokens únicos**: Gerados por sessão
- ✅ **Validação obrigatória**: Todas as submissões de formulário
- ✅ **Rotação automática**: Tokens renovados periodicamente

### 6. **Sanitização e Validação de Inputs**
- ✅ **Sanitização HTML**: Remove scripts e tags perigosas
- ✅ **Validação de tipos**: Zod schemas rigorosos
- ✅ **Limite de tamanho**: Previne payloads grandes
- ✅ **Encoding**: Previne XSS e injection

### 7. **Headers de Segurança**
- ✅ **CSP (Content Security Policy)**: Previne XSS
- ✅ **HSTS**: Força HTTPS
- ✅ **X-Frame-Options**: Previne clickjacking
- ✅ **X-Content-Type-Options**: Previne MIME sniffing
- ✅ **Referrer-Policy**: Controla informações compartilhadas

### 8. **Logging e Monitoramento**
- ✅ **Tentativas bloqueadas**: Log de todas as tentativas suspeitas
- ✅ **Padrões de ataque**: Detecção de padrões anômalos
- ✅ **Alertas**: Notificações para administradores
- ✅ **Métricas**: Dashboard de segurança

---

## 🚀 Implementação Técnica

### Estrutura de Arquivos

```
lib/
  security/
    recaptcha.ts          # Validação reCAPTCHA
    honeypot.ts           # Validação honeypot
    rate-limit.ts         # Rate limiting avançado
    csrf.ts               # Geração e validação CSRF
    sanitize.ts           # Sanitização de inputs
    bot-detection.ts      # Detecção de bots
    security-logger.ts    # Logging de segurança
  middleware/
    security.ts           # Middleware de segurança
components/
  security/
    HoneypotField.tsx     # Componente honeypot
    RecaptchaProvider.tsx # Provider reCAPTCHA
    SecurityWrapper.tsx   # Wrapper de segurança
```

### Fluxo de Proteção

```
1. Usuário acessa formulário
   ↓
2. reCAPTCHA v3 executa em background
   ↓
3. Honeypot field renderizado (invisível)
   ↓
4. Usuário preenche formulário
   ↓
5. Tempo de preenchimento registrado
   ↓
6. CSRF token validado
   ↓
7. Submissão enviada com:
   - Token reCAPTCHA
   - Timestamp
   - Honeypot (vazio)
   ↓
8. Servidor valida:
   - reCAPTCHA score
   - Honeypot (vazio?)
   - Rate limit
   - Tempo de preenchimento
   - CSRF token
   - Sanitização de inputs
   ↓
9. Se tudo OK → Processa
   Se suspeito → Bloqueia e registra
```

---

## 📊 Configuração

### Variáveis de Ambiente

```env
# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=seu_site_key
RECAPTCHA_SECRET_KEY=seu_secret_key
RECAPTCHA_THRESHOLD=0.5  # Score mínimo (0.0-1.0)

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REDIS_URL=redis://localhost:6379  # Opcional (Redis)

# Segurança
CSRF_ENABLED=true
HONEYPOT_ENABLED=true
SECURITY_LOGGING=true
```

### Thresholds Recomendados

| Formulário | reCAPTCHA | Rate Limit | Tempo Mín |
|------------|-----------|------------|-----------|
| Agendamento | 0.5 | 3/hora | 10s |
| Login | 0.3 | 5/15min | 5s |
| Contato | 0.4 | 5/hora | 8s |
| Cadastro | 0.5 | 2/hora | 15s |

---

## 🔍 Detecção de Ataques

### Padrões Detectados

1. **Bot simples**: Preenche honeypot
2. **Bot avançado**: Score reCAPTCHA < 0.3
3. **Spam**: Múltiplas submissões rápidas
4. **Força bruta**: Muitas tentativas de login
5. **Scraping**: Muitas requisições em sequência

### Ações Automáticas

- **Bloqueio temporário**: IP bloqueado por 1 hora
- **Bloqueio permanente**: IP adicionado à blacklist
- **Notificação**: Admin recebe alerta
- **Logging**: Registro detalhado para análise

---

## 📈 Monitoramento

### Métricas Coletadas

- Tentativas bloqueadas por tipo
- IPs mais ativos (suspeitos)
- Taxa de falsos positivos
- Score médio reCAPTCHA
- Tempo médio de preenchimento

### Dashboard de Segurança

Acesse `/admin/security` para ver:
- Gráficos de tentativas bloqueadas
- Lista de IPs bloqueados
- Logs de segurança em tempo real
- Estatísticas de ataques

---

## 🛠️ Manutenção

### Tarefas Regulares

1. **Semanal**: Revisar logs de segurança
2. **Mensal**: Ajustar thresholds baseado em dados
3. **Trimestral**: Auditoria completa de segurança
4. **Anual**: Penetration testing

### Ajustes de Thresholds

Se muitos falsos positivos:
- Aumentar threshold reCAPTCHA
- Aumentar rate limits
- Aumentar tempo mínimo

Se muitos ataques passando:
- Diminuir threshold reCAPTCHA
- Diminuir rate limits
- Adicionar mais validações

---

## ⚠️ Considerações Importantes

### Performance

- reCAPTCHA v3: ~50ms overhead
- Honeypot: ~0ms (apenas validação)
- Rate limiting: ~10ms (com Redis: ~2ms)
- **Total**: ~60ms por requisição

### Privacidade

- reCAPTCHA coleta dados do Google (conforme política deles)
- Logs não armazenam dados pessoais sensíveis
- IPs são hasheados após 30 dias

### Compliance

- ✅ LGPD: Dados minimizados e protegidos
- ✅ GDPR: Direito ao esquecimento respeitado
- ✅ Acessibilidade: Não impacta usuários com deficiência

---

## 🚨 Resposta a Incidentes

### Se detectar ataque:

1. **Automático**: IP bloqueado imediatamente
2. **Log**: Registro completo do incidente
3. **Alerta**: Notificação para admin
4. **Análise**: Revisar padrões e ajustar proteções

### Se falso positivo:

1. **Whitelist**: Adicionar IP/email à whitelist
2. **Ajuste**: Revisar thresholds
3. **Comunicação**: Informar usuário afetado

---

## 📚 Recursos Adicionais

- [Google reCAPTCHA v3 Docs](https://developers.google.com/recaptcha/docs/v3)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)

---

**Última atualização**: Janeiro 2026
**Versão**: 1.0
