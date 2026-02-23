<?php
/**
 * Configuração do gateway – URL do túnel (ngrok, Cloudflare Tunnel, etc.)
 *
 * IMPORTANTE: No plano grátis do ngrok a URL MUDA cada vez que você inicia o túnel.
 * Se aparecer "SSL_ERROR_ZERO_RETURN" ao acessar o site pelo domínio:
 * 1. No PC onde roda o Next.js, deixe o ngrok rodando (npm run dev:tunnel ou ngrok http 3000).
 * 2. Na raiz do projeto execute: .\obter-url-ngrok.ps1  (mostra a URL atual).
 * 3. Atualize TUNNEL_URL abaixo com essa URL e salve este arquivo no servidor do domínio.
 */
define('TUNNEL_URL', 'https://crushingly-genealogic-terica.ngrok-free.dev');
