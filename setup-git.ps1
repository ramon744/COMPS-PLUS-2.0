Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    CONFIGURANDO GIT PARA COMPS PLUS 54" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "1. Verificando status do git..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "2. Inicializando repositório git..." -ForegroundColor Yellow
git init

Write-Host ""
Write-Host "3. Adicionando arquivos..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "4. Fazendo commit inicial..." -ForegroundColor Yellow
git commit -m "Initial commit - Comps Plus 54 v2.1.0 - Sistema completo de gestão de COMPS com notificações em tempo real"

Write-Host ""
Write-Host "5. Verificando repositórios remotos..." -ForegroundColor Yellow
git remote -v

Write-Host ""
Write-Host "6. Configurando branch principal..." -ForegroundColor Yellow
git branch -M main

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "    PRÓXIMOS PASSOS:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "1. Crie um repositório no GitHub chamado 'comps-plus-54'" -ForegroundColor White
Write-Host "2. Execute: git remote add origin https://github.com/SEU-USUARIO/comps-plus-54.git" -ForegroundColor White
Write-Host "3. Execute: git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "Substitua 'SEU-USUARIO' pelo seu username do GitHub" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Green

Read-Host "Pressione Enter para continuar"
