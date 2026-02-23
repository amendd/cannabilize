# Configurar cannabilize.com.br (Registro.br) para a VPS

O domínio está no **Registro.br** mas hoje aponta para **outros DNS**. Para o site da CannabiLize abrir em **cannabilize.com.br** na sua VPS (IP **5.189.168.66**), você precisa que os **registros DNS** apontem para esse IP.

Há duas formas de fazer isso.

---

## Opção 1: Usar o DNS do próprio Registro.br (recomendado)

Você passa a gerenciar o DNS do domínio no painel do Registro.br e cria os registros A para a VPS.

### Passo 1: Delegar o domínio para o DNS do Registro.br

1. Acesse **[registro.br](https://registro.br)** e faça login.
2. Em **Domínios**, clique no domínio **cannabilize.com.br**.
3. Na parte de **DNS** / **Servidores DNS**, clique em **Alterar servidores DNS** (ou equivalente).
4. Defina os **servidores DNS do Registro.br**:
   - **Servidor 1:** `a.dns.br`
   - **Servidor 2:** `b.dns.br`
   - **Servidor 3:** `c.dns.br`
5. Salve. A alteração pode levar alguns minutos.

### Passo 2: Ativar o modo avançado (zona DNS)

1. Ainda no domínio **cannabilize.com.br**, procure **DNS** → **Configurar endereçamento** (ou **Editar zona**).
2. Ative o **Modo avançado** e confirme.
3. Aguarde alguns minutos (em geral até ~5) e atualize a página até a zona DNS aparecer para edição.

### Passo 3: Criar os registros A para a VPS

No **Modo avançado**, adicione duas entradas:

| Nome | Tipo | Valor / Endereço IPv4 |
|------|------|------------------------|
| *(vazio ou @)* | **A** | **5.189.168.66** |
| **www** | **A** | **5.189.168.66** |

- **Nome vazio (ou @):** faz **cannabilize.com.br** apontar para a VPS.
- **Nome www:** faz **www.cannabilize.com.br** apontar para a VPS.

Salve as alterações.

### Passo 4: Aguardar propagação

- Propagação típica: de alguns minutos até 24–48 horas (em geral bem menos).
- Para testar: `ping cannabilize.com.br` e `ping www.cannabilize.com.br` devem responder **5.189.168.66**.

Depois que o DNS estiver apontando para o IP, na VPS você configura o Nginx + SSL seguindo o **[NGINX_SSL_VPS.md](NGINX_SSL_VPS.md)** (Opção B).

---

## Opção 2: Manter o DNS atual (outro provedor)

Se o domínio continuar delegado para **outros servidores DNS** (ex.: hospedagem, Cloudflare, outro provedor), os registros A devem ser configurados **nesse provedor**, não no Registro.br.

### O que fazer

1. Descubra **onde o DNS está hoje**: no Registro.br, na tela do domínio, veja em **Servidores DNS** quais nomes estão cadastrados (ex.: `ns1.hospedagem.com`, `ns2.cloudflare.com`).
2. Acesse o **painel desse provedor** (hospedagem, Cloudflare, etc.).
3. Na **zona DNS** do domínio **cannabilize.com.br**, crie ou edite:
   - **Registro A** do **domínio raiz** (cannabilize.com.br) → **5.189.168.66**
   - **Registro A** de **www** (www.cannabilize.com.br) → **5.189.168.66**  
     (ou CNAME de **www** para **cannabilize.com.br**, se o provedor preferir)
4. Salve e aguarde a propagação (minutos a algumas horas).

O Registro.br só guarda **para qual DNS o domínio está delegado**. Quem responde pelos A é sempre o serviço cujos servidores estão cadastrados lá.

---

## Resumo

| Situação | Onde configurar |
|----------|------------------|
| DNS do **Registro.br** (a.dns.br, b.dns.br, c.dns.br) | Registro.br → Domínio → Configurar endereçamento (Modo avançado) → Registros A |
| DNS de **outro provedor** | Painel desse provedor (hospedagem, Cloudflare, etc.) → Zona DNS do domínio → Registros A |

Em ambos os casos, o objetivo é:

- **cannabilize.com.br** → A → **5.189.168.66**
- **www.cannabilize.com.br** → A → **5.189.168.66**

Depois disso, na VPS: Nginx com **cannabilize.conf** + Certbot conforme o guia **NGINX_SSL_VPS.md**.
