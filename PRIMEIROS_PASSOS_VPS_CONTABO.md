# Primeiros passos: VPS Contabo já assinada

Você assinou a VPS na Contabo. Siga nesta ordem.

---

## Passo 0: Pegar IP e senha de acesso

1. Acesse o **painel da Contabo** (onde você fez a assinatura).
2. Abra o **VPS** que você criou.
3. Anote:
   - **IP do servidor** (ex.: `123.45.67.89`)
   - **Senha root** (geralmente enviada por e-mail ou exibida no painel após a criação). Se não tiver, use “Reset password” / “Redefinir senha” no painel.

A Contabo costuma enviar um e-mail com IP, usuário (geralmente `root`) e senha. Confira a caixa de entrada e spam.

---

## Passo 1: Conectar na VPS pelo SSH

No **Windows** você pode usar:
- **PowerShell** (já vem no Windows), ou
- **Windows Terminal**, ou
- **PuTTY** (se preferir interface gráfica: [putty.org](https://www.putty.org))

No PowerShell (ou CMD), troque `SEU_IP` pelo IP que você anotou:

```powershell
ssh root@SEU_IP
```

Exemplo: se o IP for `123.45.67.89`:

```powershell
ssh root@123.45.67.89
```

- Na primeira vez vai perguntar se confia no servidor — digite **yes** e Enter.
- Depois pede a **senha** (a do e-mail/painel). Ao digitar a senha, **nada aparece** na tela (nem asteriscos); é normal. Digite e dê Enter.

Se aparecer um prompt tipo `root@vps123:~#`, você está **dentro da VPS**. Os comandos a seguir são todos **dentro do servidor** (após conectar).

---

## Passo 2: Atualizar o sistema (dentro da VPS)

Ainda conectado via SSH, rode:

```bash
apt update && apt upgrade -y
```

Pode levar alguns minutos. Quando terminar, o sistema estará atualizado.

---

## Passo 3: Seguir o guia completo de deploy

A partir daqui, use o guia **GUIA_DEPLOY_VPS.md** na ordem:

| Ordem | O que fazer (resumo) |
|-------|----------------------|
| 3 | Instalar Node.js 20 |
| 4 | Instalar e configurar PostgreSQL (criar usuário e banco) |
| 5 | Instalar Nginx e PM2 |
| 6 | Clonar o repositório do projeto, trocar Prisma para PostgreSQL, criar `.env`, rodar migrações e `npm run build` |
| 7 | Rodar a app com PM2 |
| 8 | Configurar Nginx (reverse proxy) |
| 9 | Configurar SSL (HTTPS) com Let's Encrypt — **só depois de apontar o domínio para o IP** |
| 10 | Configurar os cron jobs (lembretes) |

Abra o arquivo **GUIA_DEPLOY_VPS.md** no projeto e siga cada seção. Se o repositório estiver no GitHub privado, na etapa de clonar você pode precisar de um **token de acesso** ou **chave SSH** no servidor; o guia fala em “troque pela URL do seu repositório”.

---

## Resumo rápido

1. **Painel Contabo** → anotar **IP** e **senha root**.
2. No seu PC: **`ssh root@SEU_IP`** → digitar senha quando pedir.
3. Dentro da VPS: **`apt update && apt upgrade -y`**.
4. Continuar com **GUIA_DEPLOY_VPS.md** a partir da seção “3. Instalar Node.js 20”.

Se travar em algum passo (por exemplo: “não consigo conectar SSH” ou “erro ao clonar”), diga em qual passo e qual mensagem aparece que eu te ajudo a resolver.
