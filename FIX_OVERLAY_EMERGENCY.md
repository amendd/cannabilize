# 🚨 Solução de Emergência: Overlay Travado

Se você está vendo a tela escurecida e não consegue clicar em nada, siga estes passos:

## Solução Rápida (Console do Navegador)

1. **Abra o Console do Navegador:**
   - Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux)
   - Ou `Cmd+Option+I` (Mac)

2. **Cole e execute este código:**

```javascript
// Remover todos os overlays travados
document.querySelectorAll('[class*="fixed"][class*="inset-0"]').forEach(el => {
  if (el.classList.contains('bg-black') || el.classList.contains('bg-opacity') || 
      el.style.backgroundColor.includes('rgba(0, 0, 0')) {
    el.remove();
  }
});

// Limpar estilos do body
document.body.style.overflow = '';
document.body.style.pointerEvents = '';

// Limpar qualquer modal invisível
document.querySelectorAll('[role="dialog"], [aria-modal="true"]').forEach(modal => {
  if (!modal.querySelector('h1, h2, h3, p, button')) {
    modal.remove();
  }
});

console.log('✅ Overlay removido!');
```

3. **Pressione Enter** para executar

4. **Recarregue a página** se necessário: `Ctrl+R` ou `F5`

---

## Solução Alternativa (URL)

Acesse esta URL diretamente no navegador:

```
http://localhost:3001/admin/fix-overlay
```

Esta página irá automaticamente:
- Remover overlays travados
- Limpar estados de modal
- Redirecionar você de volta ao dashboard

---

## Prevenção

O problema foi corrigido no código. Se persistir:

1. **Limpe o cache do navegador:**
   - `Ctrl+Shift+Delete` (Windows/Linux)
   - `Cmd+Shift+Delete` (Mac)

2. **Recarregue a página com cache limpo:**
   - `Ctrl+Shift+R` (Windows/Linux)
   - `Cmd+Shift+R` (Mac)

3. **Verifique se há extensões do navegador** interferindo (desative temporariamente)

---

## Causa do Problema

O overlay estava sendo renderizado pelo sidebar mobile do AdminLayout, mas não estava sendo fechado corretamente em alguns casos. A correção garante que:

- O overlay só aparece em telas mobile
- Fecha automaticamente ao redimensionar para desktop
- Fecha com a tecla ESC
- Não fica travado após navegação
