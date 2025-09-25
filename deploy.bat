@echo off
echo Iniciando deploy na Vercel...
echo.

echo Verificando se o build existe...
if not exist "dist" (
    echo Build nao encontrado, executando build...
    npm run build
)

echo.
echo Fazendo deploy na Vercel...
npx vercel --prod --yes

echo.
echo Deploy concluido!
pause
