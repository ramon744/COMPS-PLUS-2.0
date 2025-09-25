@echo off
echo ========================================
echo    DEPLOY VIA GIT PUSH - VERCEL
echo ========================================
echo.

echo 1. Verificando status do Git...
git status
echo.

echo 2. Adicionando arquivos...
git add .
echo.

echo 3. Fazendo commit...
git commit -m "feat: Sistema completo com PDF publico e limpeza automatica apos 24h - Pronto para producao"
echo.

echo 4. Fazendo push para GitHub...
git push origin main
echo.

echo ========================================
echo    DEPLOY CONCLUIDO!
echo ========================================
echo.
echo O Vercel detectara automaticamente o push
echo e fara o deploy automaticamente.
echo.
echo Acesse: https://vercel.com/dashboard
echo para acompanhar o progresso do deploy.
echo.
pause
