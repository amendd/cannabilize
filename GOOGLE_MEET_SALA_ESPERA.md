# Google Meet: evitar "Aguarde um organizador"

Quando médico ou paciente entram no link do Meet e aparece **"Aguarde até que um organizador da reunião adicione você à chamada"**, é porque o **tipo de acesso** daquela reunião não está em **"Abrir"**.

---

## Por que mudar em uma reunião não adiantou?

A configuração em **"Controles do organizador"** (Tipo de acesso: Abrir / Confiável / Restrito) vale **só para aquela reunião**.  

O Cannabilize **cria cada reunião pela API** do Google Calendar. Cada nova consulta gera um **evento novo** no Meet, e esse evento usa o **padrão da conta** (em muitas contas Gmail o padrão é **"Confiável"**, não "Abrir"). Por isso:

- Mudar **uma** reunião que você criou manualmente no Meet para "Abrir" **não** altera as reuniões que o sistema cria sozinho.
- A **API do Google Calendar não permite** definir "Abrir" ao criar o evento; o Google usa o padrão da conta.

Ou seja: **não existe como “ativar de uma vez” para todas as reuniões futuras** só pela conta Gmail. O que dá para fazer é o **workaround** abaixo para **cada** reunião gerada pelo Cannabilize.

---

## Workaround: abrir o link e mudar para "Abrir" (por reunião)

Como a API não define "Abrir", alguém precisa abrir o link da reunião e mudar o tipo de acesso **nessa** reunião:

1. O **médico** (ou alguém com a conta usada nas credenciais do Meet no Admin) **abre o link do Meet** da consulta (o mesmo que o paciente vai usar).
2. Na tela do Meet, no **canto inferior direito**, clica em **"Controles do organizador"**.
3. Em **"Tipo de acesso à reunião"**, seleciona **"Abrir"**  
   - *"Ninguém precisa pedir para participar. Qualquer pessoa pode ligar para a reunião."*
4. Fecha o painel. A partir daí, o **paciente** pode entrar pelo mesmo link **sem** ver "Aguarde um organizador".

Ou seja: **para cada consulta**, quem inicia a reunião abre o link primeiro, coloca em "Abrir", e depois o paciente entra. Não precisa criar reunião de teste no Meet; o que importa é abrir o **link que o Cannabilize gerou** e mudar **essa** reunião para "Abrir".

---

## Onde fica no Meet (lembrete)

- **Controles do organizador** → canto inferior direito da chamada.
- **Tipo de acesso à reunião** → **"Abrir"** = qualquer pessoa com o link entra direto.

---

## Se usar Google Workspace (empresa/escola)

No **Admin do Workspace**, o administrador pode definir um **padrão** para todas as reuniões da organização:

1. [Admin Console](https://admin.google.com) → **Apps** → **Google Workspace** → **Google Meet**.
2. **Configurações de vídeo do Meet** (ou equivalente).
3. Procurar opção do tipo **"Permitir que todos entrem na reunião sem pedir ao organizador"** / acesso aberto por padrão.
4. Salvar. Assim, reuniões criadas pela API podem já nascer com esse comportamento (dependendo da política do Workspace).

Para **conta Gmail pessoal**, não há esse “padrão global”; por isso o workaround acima (abrir o link e mudar para "Abrir" por reunião) é o caminho indicado.
