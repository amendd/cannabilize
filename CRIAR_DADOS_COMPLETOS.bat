@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   CRIAR DADOS COMPLETOS NO BANCO
echo ========================================
echo.
echo Este script vai criar:
echo - Usuarios (admin, medico, paciente)
echo - Disponibilidade do medico (Segunda a Sexta, 9h-18h)
echo - Medicamentos
echo - Patologias
echo - Posts do blog
echo - Eventos
echo.
echo Aguarde...
echo.

npx tsx criar-dados-completos.ts

echo.
echo Pressione qualquer tecla para fechar...
pause >nul
