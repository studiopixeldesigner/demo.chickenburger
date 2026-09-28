@echo off
title Demo Chicken Burger
cd /d "%~dp0"
echo Demarrage de la demo Chicken Burger...
echo Le site va s'ouvrir dans ton navigateur : http://localhost:3001
echo Pour arreter la demo, ferme cette fenetre.
start "" cmd /c "timeout /t 8 >nul & start http://localhost:3001"
call npm run dev -- -p 3001