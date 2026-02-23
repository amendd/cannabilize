# Rate limit em produção

O middleware do projeto usa **rate limiting em memória** (`Map`). Isso funciona em desenvolvimento e em um único processo, mas **em produção com múltiplas instâncias** (ex.: Vercel, várias réplicas) cada instância tem seu próprio `Map`, então o limite não é global.

## Recomendação para produção

Use um store **compartilhado** para os contadores:

1. **Redis** (recomendado): armazenar chave por IP (ou por usuário) com TTL igual à janela (ex.: 15 min). Exemplo com `ioredis`:
   - `INCR rate:{ip}`
   - `EXPIRE rate:{ip} 900`
   - Comparar com `maxRequests` (ex.: 200).

2. **Serviços gerenciados**: Vercel KV (Redis), Upstash Redis ou similar, expondo uma API que o middleware ou uma rota de API chame para verificar/incrementar.

3. **Adaptar o middleware**: em vez de ler/escrever no `Map` local, chamar um endpoint interno (ex.: `/api/rate-limit/check`) que use Redis, ou usar um pacote como `@upstash/ratelimit` se estiver em ambiente serverless.

## Sessão e cache

Para reduzir carga no banco e melhorar desempenho com várias instâncias, considere também:

- **Cache de sessão do NextAuth** com Redis (adapter ou JWT com revogação em lista negra em Redis).
- Documentação oficial: [NextAuth – adapters](https://next-auth.js.org/tutorials/creating-a-database-adapter).

## Variáveis de ambiente (exemplo)

```env
# Opcional: desabilitar rate limit em memória quando usar Redis/serviço externo
RATE_LIMIT_DISABLED=false

# Redis (quando implementado)
REDIS_URL=redis://...
# ou
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

O middleware atual só aplica rate limit quando `NODE_ENV === 'production'`; em dev ele está desativado para facilitar o uso de polling e hot-reload.
