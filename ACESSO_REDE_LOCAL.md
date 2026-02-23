# Acesso ao CannabiLizi pela rede local

Para que colegas acessem o sistema pelo IP da sua máquina (ex.: `http://10.0.0.115:3000`) sem ver erro 404, siga estes passos.

## 1. Permitir origem no Next.js (já configurado)

No `next.config.js` foi adicionado `allowedDevOrigins` com o IP `10.0.0.115`. Se o IP da sua máquina for outro, edite e coloque o IP correto:

```js
allowedDevOrigins: [
  'localhost',
  '127.0.0.1',
  '10.0.0.115',  // troque pelo IP da sua máquina na rede
],
```

Para descobrir seu IP no Windows: `ipconfig` (procure por "Endereço IPv4" no adaptador ativo).

## 2. Iniciar o servidor escutando em todas as interfaces

O Next.js em dev já escuta em todas as interfaces por padrão. Se precisar forçar:

```bash
npm run dev -- -H 0.0.0.0 -p 3000
```

Ou no `package.json`:

```json
"dev": "next dev -H 0.0.0.0"
```

## 3. NEXTAUTH_URL para login pela rede

Para **login e callbacks** funcionarem quando alguém acessa por `http://10.0.0.115:3000`, o NextAuth precisa saber essa URL.

**Opção A – Só você usa pela rede:**  
Mantenha no `.env`:

```env
NEXTAUTH_URL=http://localhost:3000
```

Quem acessar por `10.0.0.115:3000` pode ver a home, mas ao fazer login pode ser redirecionado para `localhost` (que no PC do colega não é o seu servidor). Nesse caso, os colegas podem usar o sistema sem login (telas públicas) ou você pode criar um segundo `.env.local` só quando for testar pela rede (veja opção B).

**Opção B – Colegas vão logar pela rede:**  
Quando for abrir para a equipe, use no `.env` (ou `.env.local`) o IP da máquina:

```env
NEXTAUTH_URL=http://10.0.0.115:3000
```

Reinicie o servidor após alterar. Assim, login, callbacks e cookies funcionam para quem acessa por `http://10.0.0.115:3000`.

**Resumo:**  
- Só corrigir 404 na home: `allowedDevOrigins` + servidor em `0.0.0.0` (já coberto acima).  
- Login pela rede funcionando: defina `NEXTAUTH_URL=http://10.0.0.115:3000` (ou o IP correto) e reinicie o dev.

## 4. Firewall do Windows

Se os colegas não conseguirem nem conectar, libere a porta 3000:

1. Painel de Controle → Sistema e Segurança → Firewall do Windows → Configurações avançadas.
2. Regras de Entrada → Nova Regra → Porta → TCP → 3000 → Permitir.

Ou em um PowerShell **como Administrador**:

```powershell
New-NetFirewallRule -DisplayName "Next.js dev 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

## 5. Teste

- No seu PC: `http://localhost:3000` e `http://10.0.0.115:3000`.
- No PC do colega: `http://10.0.0.115:3000`.

A home deve abrir sem 404. Se precisar que o login funcione pela rede, use a opção B do passo 3.
