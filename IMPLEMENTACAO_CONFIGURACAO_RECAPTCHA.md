# ✅ Implementação: Configuração de reCAPTCHA no Dashboard Admin

## 🎯 Objetivo

Criar uma interface no dashboard do admin para configurar, ativar e desativar o reCAPTCHA sem necessidade de editar variáveis de ambiente.

---

## ✅ O que foi implementado

### 1. **API de Configuração** ✅

**Arquivo:** `app/api/admin/security/recaptcha/route.ts`

- **GET**: Busca configurações do reCAPTCHA do banco de dados
- **POST**: Salva/atualiza configurações
- **PUT**: Testa a configuração com um token

**Recursos:**
- Validação de permissões (apenas ADMIN)
- Validação de dados (threshold entre 0.0 e 1.0)
- Secret key não é retornada completa (apenas `***` por segurança)
- Suporte para ativar/desativar

### 2. **Página de Configuração** ✅

**Arquivo:** `app/admin/seguranca/page.tsx`

Interface completa com:
- ✅ Toggle para ativar/desativar reCAPTCHA
- ✅ Campos para Site Key e Secret Key
- ✅ Slider para configurar Threshold (0.0 a 1.0)
- ✅ Indicador visual de status (ativado/desativado)
- ✅ Botão de teste
- ✅ Instruções de como obter as chaves
- ✅ Exibição/ocultação da Secret Key
- ✅ Validações em tempo real

### 3. **Sistema de Configuração Dinâmica** ✅

**Arquivo:** `lib/security/recaptcha-config.ts`

- Busca configurações do banco de dados (tabela `SystemConfig`)
- Cache de 5 minutos para performance
- Fallback para variáveis de ambiente se não houver no banco
- Função para limpar cache após atualizações

### 4. **Integração com Sistema Existente** ✅

**Arquivos atualizados:**
- `lib/security/recaptcha.ts` - Usa configurações do banco
- `lib/security/validate-form-submission.ts` - Verifica se está habilitado
- `app/providers.tsx` - Busca site key do servidor
- `components/consultation/AppointmentForm.tsx` - Busca site key dinamicamente

### 5. **Menu e Navegação** ✅

**Arquivos atualizados:**
- `components/layout/AdminLayout.tsx` - Adicionado link "Segurança" no menu
- `app/admin/page.tsx` - Adicionado card de acesso rápido

---

## 📊 Estrutura de Dados

As configurações são armazenadas na tabela `SystemConfig`:

| Key | Descrição | Exemplo |
|-----|-----------|---------|
| `recaptcha_enabled` | Se está ativado | `"true"` ou `"false"` |
| `recaptcha_site_key` | Chave pública | `"6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"` |
| `recaptcha_secret_key` | Chave privada | `"6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"` |
| `recaptcha_threshold` | Score mínimo | `"0.5"` |

---

## 🚀 Como Usar

### 1. Acessar a Página

1. Faça login como ADMIN
2. Acesse: `/admin/seguranca`
3. Ou clique em "Segurança" no menu lateral

### 2. Configurar reCAPTCHA

1. **Obter Chaves:**
   - Acesse: https://www.google.com/recaptcha/admin/create
   - Crie um site do tipo **reCAPTCHA v3**
   - Adicione seus domínios
   - Copie Site Key e Secret Key

2. **Configurar no Sistema:**
   - Ative o toggle "Ativar reCAPTCHA v3"
   - Cole a Site Key
   - Cole a Secret Key
   - Ajuste o Threshold (recomendado: 0.5)
   - Clique em "Salvar Configurações"

3. **Testar:**
   - Clique em "Testar" para validar a configuração
   - Se tudo estiver OK, você verá uma mensagem de sucesso com o score

### 3. Ativar/Desativar

- Use o toggle no topo da página
- Ao desativar, o sistema não requer mais reCAPTCHA nos formulários
- As chaves são mantidas no banco (não são deletadas)

---

## 🔧 Funcionalidades

### ✅ Ativar/Desativar
- Toggle simples no topo da página
- Status visual claro (verde = ativo, vermelho = inativo)
- Configurações são salvas imediatamente

### ✅ Configuração de Chaves
- Site Key: Campo de texto normal
- Secret Key: Campo de senha (pode ocultar/mostrar)
- Validação: Campos obrigatórios quando ativado

### ✅ Threshold Configurável
- Slider interativo (0.0 a 1.0)
- Explicação de cada faixa de valores
- Recomendação visual

### ✅ Teste de Configuração
- Botão "Testar" executa reCAPTCHA real
- Mostra score e resultado
- Útil para validar antes de usar em produção

### ✅ Segurança
- Apenas ADMINs podem acessar
- Secret Key não é exibida completa (apenas `***`)
- Validação de permissões na API

---

## 🔄 Fluxo de Funcionamento

```
1. Admin acessa /admin/seguranca
   ↓
2. Sistema busca configurações do banco
   ↓
3. Admin configura e salva
   ↓
4. Configurações são salvas em SystemConfig
   ↓
5. Cache é limpo
   ↓
6. Próxima requisição busca do banco
   ↓
7. Formulários usam configuração do banco
```

---

## 📝 Notas Importantes

### Cache
- Configurações são cacheadas por 5 minutos
- Após salvar, o cache é limpo automaticamente
- Em caso de problemas, reinicie o servidor

### Fallback
- Se não houver configuração no banco, usa variáveis de ambiente
- Isso permite migração gradual
- Variáveis de ambiente continuam funcionando

### Segurança
- Secret Key nunca é retornada completa pela API
- Apenas indica se existe (`hasSecretKey: true/false`)
- Validação de permissões em todas as rotas

---

## 🧪 Testando

### Teste 1: Ativar reCAPTCHA
1. Acesse `/admin/seguranca`
2. Ative o toggle
3. Preencha Site Key e Secret Key
4. Salve
5. ✅ Status deve mostrar "reCAPTCHA Ativado"

### Teste 2: Desativar
1. Desative o toggle
2. Salve
3. ✅ Status deve mostrar "reCAPTCHA Desativado"
4. ✅ Formulários não devem mais requerer reCAPTCHA

### Teste 3: Testar Configuração
1. Configure chaves válidas
2. Clique em "Testar"
3. ✅ Deve mostrar score e sucesso

### Teste 4: Formulário
1. Com reCAPTCHA ativado, acesse formulário de agendamento
2. Preencha e envie
3. ✅ Deve funcionar normalmente
4. ✅ Deve validar reCAPTCHA no servidor

---

## 🐛 Solução de Problemas

### Problema: "Erro ao carregar configurações"
- Verifique se está logado como ADMIN
- Verifique conexão com banco de dados
- Verifique logs do servidor

### Problema: "Teste falhou"
- Verifique se as chaves estão corretas
- Verifique se o domínio está registrado no Google reCAPTCHA
- Verifique conexão com internet

### Problema: "Configurações não aplicam"
- Limpe o cache: reinicie o servidor
- Verifique se salvou corretamente
- Verifique logs do servidor

---

## 📚 Arquivos Criados/Modificados

### Criados:
- `app/api/admin/security/recaptcha/route.ts`
- `app/admin/seguranca/page.tsx`
- `lib/security/recaptcha-config.ts`

### Modificados:
- `lib/security/recaptcha.ts`
- `lib/security/validate-form-submission.ts`
- `app/providers.tsx`
- `components/consultation/AppointmentForm.tsx`
- `components/layout/AdminLayout.tsx`
- `app/admin/page.tsx`

---

## ✅ Checklist de Implementação

- [x] API para buscar configurações
- [x] API para salvar configurações
- [x] API para testar configuração
- [x] Página de interface
- [x] Toggle ativar/desativar
- [x] Campos de configuração
- [x] Slider de threshold
- [x] Botão de teste
- [x] Integração com sistema existente
- [x] Menu e navegação
- [x] Validações
- [x] Segurança (permissões)
- [x] Cache de configurações
- [x] Fallback para variáveis de ambiente

---

**Implementado em**: Janeiro 2026
**Versão**: 1.0
