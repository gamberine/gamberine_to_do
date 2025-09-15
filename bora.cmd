@echo off
REM --- encerra possíveis Node travados ---
taskkill /F /IM node.exe 2>nul

REM --- vai para a pasta do script (raiz do projeto) ---
cd /d "%~dp0"

REM --- limpa caches do Vite que travam no Windows ---
rmdir /s /q "node_modules\.vite" 2>nul
for /D %%D in ("node_modules\.vite*") do rmdir /s /q "%%~fD" 2>nul
if exist "node_modules\.cache\vite" rmdir /s /q "node_modules\.cache\vite"

REM --- sobe o dev server forçando rebuild (sem start para usar terminal do VS Code) ---
npm run dev -- --force

REM --- abre no Edge (ajuste a porta se precisar) ---
start "" msedge "http://localhost:5173"
