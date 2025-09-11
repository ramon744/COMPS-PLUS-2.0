@echo off
echo ========================================
echo    CONFIGURANDO GIT PARA COMPS PLUS 54
echo ========================================

echo.
echo 1. Verificando status do git...
git status

echo.
echo 2. Inicializando repositório git...
git init

echo.
echo 3. Adicionando arquivos...
git add .

echo.
echo 4. Fazendo commit inicial...
git commit -m "Initial commit - Comps Plus 54 v2.1.0 - Sistema completo de gestão de COMPS com notificações em tempo real"

echo.
echo 5. Verificando repositórios remotos...
git remote -v

echo.
echo 6. Configurando branch principal...
git branch -M main

echo.
echo ========================================
echo    PRÓXIMOS PASSOS:
echo ========================================
echo 1. Crie um repositório no GitHub chamado 'comps-plus-54'
echo 2. Execute: git remote add origin https://github.com/SEU-USUARIO/comps-plus-54.git
echo 3. Execute: git push -u origin main
echo.
echo Substitua 'SEU-USUARIO' pelo seu username do GitHub
echo ========================================

pause
