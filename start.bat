@echo off
setlocal
title Lynaris Hub - Launcher

REM Se positionne dans le dossier du .bat (peu importe d'ou il est lance)
cd /d "%~dp0"

echo.
echo ========================================
echo   Lynaris Hub - Demarrage dev
echo ========================================
echo.

REM Verifie qu'on est bien dans un projet Node
if not exist "package.json" (
  echo [ERREUR] package.json introuvable dans %cd%
  echo Place start.bat a la racine du projet.
  pause
  exit /b 1
)

REM Verifie node_modules
if not exist "node_modules" (
  echo [INFO] node_modules absent. Installation des dependances...
  call npm install
  if errorlevel 1 (
    echo [ERREUR] npm install a echoue.
    pause
    exit /b 1
  )
)

REM Verifie .env
if not exist ".env" (
  echo [ATTENTION] Fichier .env manquant. Copie .env.example vers .env d'abord.
  pause
  exit /b 1
)

echo [1/3] Lancement du serveur Next.js sur http://localhost:3000 ...
start "Lynaris - Next.js" cmd /k "npm run dev"

echo [2/3] Attente 5s pour laisser Next demarrer...
timeout /t 5 /nobreak >nul

echo [3/3] Lancement du faux cron local (dev:cron)...
start "Lynaris - Dev Cron" cmd /k "npm run dev:cron"

echo.
echo Tout est lance. Ouverture du navigateur...
timeout /t 3 /nobreak >nul
start "" "http://localhost:3000/dashboard/automatisations"

echo.
echo ========================================
echo   Pret. 2 terminaux ouverts :
echo   - "Lynaris - Next.js"  (serveur dev)
echo   - "Lynaris - Dev Cron" (cron local)
echo ========================================
echo.
echo Ferme cette fenetre quand tu veux.
timeout /t 4 /nobreak >nul
exit
