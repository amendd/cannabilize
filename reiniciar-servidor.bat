@echo off
echo Parando servidor (se estiver rodando)...
taskkill /F /IM node.exe 2>nul

echo.
echo Limpando cache do Next.js...
if exist .next (
    rmdir /s /q .next
    echo Cache removido!
) else (
    echo Pasta .next nao encontrada.
)

echo.
echo Iniciando servidor...
call npm run dev

pause
