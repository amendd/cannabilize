# Erro: Cannot find module './router-server'

## Causa

Esse erro costuma aparecer ao rodar **Next.js 14** com **Node.js 24**. O Next 14 foi testado com Node 18 e 20; no Node 24 a resolução interna de módulos pode falhar.

## Solução: usar Node 18 ou 20 LTS

1. **Se você usa NVM (Node Version Manager)**  
   - Windows: [nvm-windows](https://github.com/coreybutler/nvm-windows)  
   - No projeto já existe `.nvmrc` com `20`. No terminal:
     ```bash
     nvm install 20
     nvm use 20
     npm install
     npm run dev
     ```

2. **Se não usa NVM**  
   - Instale Node **20 LTS** em: https://nodejs.org/  
   - Escolha a versão **LTS (20.x)**.  
   - Feche e abra o terminal, vá na pasta do projeto e rode:
     ```bash
     npm install
     npm run dev
     ```

Depois de usar Node 20 (ou 18), o erro do `router-server` deve sumir e o `framer-motion` continuará funcionando após o `npm install`.
