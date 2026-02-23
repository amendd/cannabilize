# 🚀 Guia Rápido de Configuração de Segurança

## 📋 Pré-requisitos

1. Conta no Google (para reCAPTCHA)
2. Acesso ao arquivo `.env` do projeto

---

## ⚙️ Configuração Passo a Passo

### 1. Configurar reCAPTCHA v3

#### Passo 1: Criar Site no Google reCAPTCHA

1. Acesse: https://www.google.com/recaptcha/admin/create
2. Preencha:
   - **Label**: Nome do seu site (ex: "CannabiLizi")
   - **Tipo**: Selecione **reCAPTCHA v3**
   - **Domínios**: Adicione seus domínios:
     - `localhost` (para desenvolvimento)
     - `seu-dominio.com` (para produção)
     - `www.seu-dominio.com` (se usar www)
3. Aceite os termos e clique em **Enviar**

#### Passo 2: Obter Chaves

Após criar, você verá:
- **Site Key** (chave pública)
- **Secret Key** (chave privada)

#### Passo 3: Adicionar ao `.env`

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=sua_site_key_aqui
RECAPTCHA_SECRET_KEY=sua_secret_key_aqui
RECAPTCHA_THRESHOLD=0.5
```

**⚠️ Importante:**
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` é pública e pode ser exposta no frontend
- `RECAPTCHA_SECRET_KEY` é privada e NUNCA deve ser exposta

---

### 2. Verificar Configurações de Segurança

As seguintes configurações já estão implementadas e funcionam por padrão:

```env
# Já configurado por padrão
HONEYPOT_ENABLED=true
SECURITY_LOGGING=true
RATE_LIMIT_ENABLED=true
```

---

## 🧪 Testando a Configuração

### Teste 1: Verificar reCAPTCHA

1. Acesse a página de agendamento
2. Abra o Console do navegador (F12)
3. Verifique se não há erros relacionados ao reCAPTCHA
4. Preencha o formulário e envie
5. Se tudo estiver OK, o formulário será enviado normalmente

### Teste 2: Verificar Honeypot

1. O campo honeypot é invisível (não aparece na tela)
2. Se um bot tentar preencher, será bloqueado automaticamente
3. Usuários reais não veem nem interagem com ele

### Teste 3: Verificar Rate Limiting

1. Tente enviar o formulário várias vezes rapidamente
2. Após 3 tentativas em 1 hora, você receberá um erro de rate limit
3. Isso é normal e protege contra spam

---

## 🔧 Ajustes Avançados

### Ajustar Threshold do reCAPTCHA

O threshold controla quão restritivo é o reCAPTCHA:

- **0.0 - 0.3**: Muito restritivo (bloqueia muitos usuários legítimos)
- **0.3 - 0.5**: Restritivo (recomendado para formulários sensíveis)
- **0.5 - 0.7**: Moderado (recomendado para maioria dos casos)
- **0.7 - 1.0**: Permissivo (pode deixar passar alguns bots)

**Recomendação**: Comece com `0.5` e ajuste baseado nos logs.

### Ajustar Rate Limits

Os limites padrão são:

- **Agendamento**: 3 por hora por IP
- **Login**: 5 por 15 minutos por IP
- **Contato**: 5 por hora por IP
- **API geral**: 200 por 15 minutos por IP

Para ajustar, edite: `lib/security/rate-limit.ts`

---

## 📊 Monitoramento

### Ver Logs de Segurança

Os logs são exibidos no console do servidor. Em produção, configure um serviço de logging externo.

### Métricas Importantes

- **Tentativas bloqueadas**: Quantas vezes bots foram detectados
- **Taxa de falsos positivos**: Usuários legítimos bloqueados
- **Score médio reCAPTCHA**: Score médio dos usuários

---

## 🚨 Solução de Problemas

### Problema: "reCAPTCHA não carregado"

**Solução:**
1. Verifique se `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` está no `.env`
2. Verifique se o domínio está registrado no Google reCAPTCHA
3. Limpe o cache do navegador

### Problema: "Token reCAPTCHA não fornecido"

**Solução:**
1. Verifique se o script do reCAPTCHA está carregando (Console do navegador)
2. Verifique se há erros de JavaScript
3. Tente recarregar a página

### Problema: "Muitos falsos positivos"

**Solução:**
1. Aumente o `RECAPTCHA_THRESHOLD` (ex: de 0.5 para 0.6)
2. Verifique os logs para entender o padrão
3. Considere adicionar IPs à whitelist se necessário

### Problema: "Muitos bots passando"

**Solução:**
1. Diminua o `RECAPTCHA_THRESHOLD` (ex: de 0.5 para 0.4)
2. Verifique se o honeypot está funcionando
3. Revise os rate limits

---

## 📚 Recursos Adicionais

- [Documentação reCAPTCHA v3](https://developers.google.com/recaptcha/docs/v3)
- [Documento Completo de Segurança](./SEGURANCA_PROTECAO_BOTS.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## ✅ Checklist de Configuração

- [ ] Criar site no Google reCAPTCHA
- [ ] Adicionar chaves ao `.env`
- [ ] Testar formulário de agendamento
- [ ] Verificar logs de segurança
- [ ] Ajustar thresholds se necessário
- [ ] Configurar domínios de produção no reCAPTCHA
- [ ] Revisar rate limits para seu caso de uso

---

**Última atualização**: Janeiro 2026
