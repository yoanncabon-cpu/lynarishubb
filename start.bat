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

REM Verifie .env — si absent, copie depuis .env.example
if not exist ".env" (
  if exist ".env.example" (
    echo [INFO] .env absent. Copie de .env.example -^> .env ...
    copy /Y ".env.example" ".env" >nul
    echo.
    echo ========================================
    echo   .env vient d'etre cree depuis .env.example
    echo ========================================
    echo.
    echo Tu dois maintenant remplir tes vraies cles d'API dans .env :
    echo   - SUPABASE (URL + anon key + service role key + DATABASE_URL)
    echo   - ANTHROPIC_API_KEY
    echo   - OPENAI_API_KEY
    echo   - GOOGLE_CLIENT_ID / SECRET
    echo   - STRIPE_SECRET_KEY / WEBHOOK_SECRET
    echo   - GMAIL_USER / GMAIL_APP_PASSWORD
    echo   - INTEGRATIONS_ENCRYPTION_KEY (genere via: openssl rand -base64 32)
    echo   - etc. (voir tous les placeholders dans le fichier)
    echo.
    echo Recupere les valeurs depuis ton vault (1Password / Bitwarden / Google Keep).
    echo.
    echo Ouverture de .env dans Notepad...
    start "" notepad ".env"
    echo.
    echo Quand tu as fini de remplir, relance start.bat.
    pause
    exit /b 0
  ) else (
    echo [ERREUR] .env ET .env.example sont absents.
    echo Le repo n'est pas complet. Re-clone depuis GitHub.
    pause
    exit /b 1
  )
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
