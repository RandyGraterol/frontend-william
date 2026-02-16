@echo off
echo Iniciando servidor de desarrollo...
echo.
echo Abriendo navegador en 3 segundos...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8080"
npm run dev
pause
