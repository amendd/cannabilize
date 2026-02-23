# Acesso via seu domínio com banco local

Este guia permite que o site rode **localmente** (banco SQLite na sua máquina) e seja acessado pela internet usando **seu domínio**. Nada vai para produção: o app e o banco continuam no seu PC.

**Requisito:** o computador precisa estar ligado e o servidor rodando (`npm run dev`). Quando desligar, o site deixa de ser acessível.

---

## Visão geral

1. **Cloudflare Tunnel** – Um programa na sua máquina cria um “túnel” entre a internet e o seu `localhost:3000`.
2. **Seu domínio** – Você aponta um subdomínio (ex.: `app.seudominio.com.br`) para esse túnel no painel da Cloudflare.
3. **Ajuste no .env** – Você define `NEXTAUTH_URL` (e opcionalmente `NEXT_PUBLIC_APP_URL`) com a URL pública para o login funcionar.

---

## Passo 1: Instalar o cloudflared

O **cloudflared** é o cliente que cria o túnel.

### Windows

**Opção A – Winget (recomendado):**
```powershell
winget install Cloudflare.cloudflared
```

**Opção B – Download manual:**
1. Acesse: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Baixe o pacote para Windows (ex.: `cloudflared-windows-amd64.exe`).
3. Renomeie para `cloudflared.exe` e coloque numa pasta que esteja no PATH, ou use o caminho completo ao rodar o comando.

Depois da instalação, abra um **novo** terminal e confira:
```powershell
cloudflared --version
```

---

## Passo 2: Teste rápido (sem domínio)

Para testar se o túnel funciona:

1. No seu projeto, inicie o site:
   ```powershell
   npm run dev
   ```
2. Em **outro** terminal, rode:
   ```powershell
   cloudflared tunnel --url http://localhost:3000
   ```
3. O terminal vai mostrar uma URL tipo:
   ```text
   https://xxxxx-xxxx-xxxx.trycloudflare.com
   ```
4. Abra essa URL no navegador. Você deve ver o site. Qualquer pessoa com o link também consegue acessar.

Para usar **seu domínio**, siga os passos abaixo.

---

## Passo 3: Colocar o domínio na Cloudflare

Para usar seu domínio no túnel, o domínio precisa estar **gerenciado pela Cloudflare** (DNS na Cloudflare).

### 3.1 Se o domínio ainda não está na Cloudflare

1. Crie uma conta em [dash.cloudflare.com](https://dash.cloudflare.com) (grátis).
2. Clique em **Add a site** e digite seu domínio (ex.: `seudominio.com.br`).
3. Escolha o plano **Free**.
4. A Cloudflare vai mostrar os **nameservers** que você deve configurar onde comprou o domínio (Registro.br, GoDaddy, Hostinger, etc.).
5. No painel do **registro do domínio**, altere os nameservers para os que a Cloudflare indicou (ex.: `ns1.cloudflare.com`, `ns2.cloudflare.com`).
6. Aguarde a ativação (minutos a algumas horas). No painel da Cloudflare o status do site ficará “Active”.

### 3.2 Se o domínio já está na Cloudflare

Não precisa fazer nada neste passo; siga para o Passo 4.

---

## Passo 4: Criar um túnel nomeado e usar seu domínio

Agora você cria um túnel “fixo” e associa um subdomínio (ex.: `app.seudominio.com.br`) a ele.

### 4.1 Fazer login no cloudflared

No terminal:

```powershell
cloudflared tunnel login
```

Uma janela do navegador deve abrir. Faça login na Cloudflare e autorize o acesso. Isso gera um arquivo de credenciais no seu usuário (ex.: `C:\Users\Gabriel\.cloudflared\credentials.json`).

### 4.2 Criar o túnel

```powershell
cloudflared tunnel create clickcannabis
```

(Substitua `clickcannabis` por outro nome se quiser.) Anote o **UUID** do túnel que aparecer (ex.: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

### 4.3 Configurar a rota (subdomínio → localhost)

Crie o arquivo de configuração do túnel.

**No Windows**, o arquivo fica em:  
`C:\Users\Gabriel\.cloudflared\config.yml`  
(ajuste `Gabriel` se seu usuário for outro).

Crie a pasta `.cloudflared` dentro do seu usuário se não existir, e crie o arquivo `config.yml` com o conteúdo abaixo (troque pelos seus dados):

```yaml
tunnel: <UUID-DO-TUNNEL>
credentials-file: C:\Users\Gabriel\.cloudflared\xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json

ingress:
  - hostname: app.seudominio.com.br
    service: http://localhost:3000
  - service: http_status:404
```

**Substitua:**
- `<UUID-DO-TUNNEL>` pelo UUID que apareceu no passo 4.2 (ex.: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).
- O caminho do `credentials-file`: na pasta `C:\Users\Gabriel\.cloudflared\` existe um arquivo `.json` com o nome do UUID do túnel. Use o nome completo desse arquivo (ex.: `a1b2c3d4-e5f6-7890-abcd-ef1234567890.json`).
- `app.seudominio.com.br` pelo subdomínio que você quer usar (pode ser `app`, `site`, `demo`, etc.).

A última linha (`service: http_status:404`) é obrigatória: ela trata qualquer outro hostname que não seja o que você definiu.

### 4.4 Registrar a rota DNS na Cloudflare

A Cloudflare precisa saber que `app.seudominio.com.br` aponta para o seu túnel. Rode:

```powershell
cloudflared tunnel route dns clickcannabis app.seudominio.com.br
```

(Use o mesmo nome do túnel e o mesmo hostname do `config.yml`.)

Isso cria automaticamente um registro **CNAME** no DNS da Cloudflare para `app.seudominio.com.br` apontando para o túnel.

### 4.5 Iniciar o túnel

1. Deixe o site rodando em um terminal:
   ```powershell
   npm run dev
   ```
2. Em outro terminal:
   ```powershell
   cloudflared tunnel run clickcannabis
   ```
3. Quando aparecer algo como “Registered tunnel connection”, o túnel está ativo.
4. Acesse no navegador: `https://app.seudominio.com.br` (ou o hostname que você escolheu).

O HTTPS é fornecido pela Cloudflare; não é preciso configurar certificado na sua máquina.

---

## Passo 5: Ajustar o .env para o login funcionar

O NextAuth usa `NEXTAUTH_URL` para montar os links de login e callback. Se continuar `http://localhost:3000`, o login ao acessar pelo domínio pode falhar.

No seu `.env` (só na sua máquina), defina a URL **pública**:

```env
# Use a URL pelo qual as pessoas acessam o site (domínio do túnel)
NEXTAUTH_URL=https://app.seudominio.com.br
```

Se o projeto usar `NEXT_PUBLIC_APP_URL` ou `NEXT_PUBLIC_BASE_URL`, coloque a mesma URL:

```env
NEXT_PUBLIC_APP_URL=https://app.seudominio.com.br
NEXT_PUBLIC_BASE_URL=https://app.seudominio.com.br
```

Reinicie o servidor (`npm run dev`) após alterar o `.env`.

---

## Resumo do dia a dia

1. **Terminal 1:** `npm run dev` (site local + banco local).
2. **Terminal 2:** `cloudflared tunnel run clickcannabis` (túnel ativo).
3. Acesso: `https://app.seudominio.com.br` (ou o subdomínio que você configurou).

Quando fechar o túnel ou o servidor, o site deixa de responder por essa URL. O banco continua local; nada é enviado para produção.

---

## Solução de problemas (cloudflared)

### Erro: "Failed to initialize DNS local resolver" / "lookup region 1.v2.argotunnel.com: i/o timeout"

O cloudflared não consegue alcançar os servidores da Cloudflare. Tente na ordem:

1. **Limpar o cache DNS do Windows** (para o novo DNS passar a valer):
   ```powershell
   ipconfig /flushdns
   ```
   Feche todos os terminais, abra um novo e rode de novo: `cloudflared tunnel --url http://localhost:3000`.

2. **Firewall / antivírus:** permita o `cloudflared.exe` no firewall do Windows e verifique se o antivírus não está bloqueando. Teste temporariamente desativar o antivírus só para ver se o túnel conecta.

3. **Rede:** se estiver em VPN, desconecte e teste. Em rede corporativa ou de faculdade, o tráfego para a Cloudflare pode estar bloqueado; teste pelo **celular em modo hotspot** para ver se é a rede.

4. **Alternativa – ngrok:** se o cloudflared continuar falhando, use o ngrok para expor o site (veja a seção "Alternativa: ngrok" abaixo). Depois que o domínio estiver na Cloudflare, você pode tentar o túnel nomeado de novo em outra rede ou após atualizar o cloudflared.

### Alternativa: ngrok

O ngrok também expõe o localhost na internet. Não usa seu domínio na versão grátis, mas serve para testar o acesso externo.

1. Crie conta em [ngrok.com](https://ngrok.com) (grátis).
2. Baixe o cliente em [ngrok.com/download](https://ngrok.com/download) e extraia (ex.: `C:\ngrok\ngrok.exe`).
3. No painel do ngrok, copie seu **authtoken** e configure:
   ```powershell
   C:\ngrok\ngrok.exe config add-authtoken SEU_TOKEN
   ```
4. Com o site rodando (`npm run dev`), em outro terminal:
   ```powershell
   C:\ngrok\ngrok.exe http 3000
   ```
5. Use a URL que aparecer (ex.: `https://abc123.ngrok.io`) no navegador. O site local fica acessível por essa URL.

Para usar **seu domínio** com túnel, o cloudflared costuma ser a opção gratuita; se ele não funcionar na sua rede, use o ngrok para testes e tente o cloudflared em outra rede ou mais tarde.

---

## Observações

- **Segurança:** Qualquer pessoa que souber a URL pode acessar. Use senhas fortes e evite expor dados sensíveis em ambiente de teste.
- **Uso contínuo:** Para deixar o túnel rodando em segundo plano (sem manter o terminal aberto), você pode configurar o `cloudflared` como serviço no Windows (opcional; a documentação da Cloudflare tem o passo a passo).
- **Domínio raiz (`seudominio.com.br`):** É possível apontar o domínio raiz para o túnel; na Cloudflare isso costuma ser feito com CNAME flattening ou registro A. Para começar, usar um subdomínio (`app.seudominio.com.br`) é mais simples.

Se disser onde você registrou o domínio (Registro.br, GoDaddy, etc.), dá para detalhar só a parte de trocar os nameservers para a Cloudflare.
