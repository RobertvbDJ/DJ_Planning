@echo off
title Kalibratie & Onderhoud Planner - Opstarten...
color 0b

echo =================================================================
echo        OPSTARTEN: KALIBRATIE, ONDERHOUD & STORINGSPLANNER
echo =================================================================
echo.

set "PORTABLE_DIR=%~dp0node-portable"
set "NODE_ZIP=%~dp0node-portable.zip"

:: 1. Check if global Node.js exists
node -v >nul 2>&1
if %errorlevel% equ 0 (
    echo [INFO] Globale Node.js installatie gedetecteerd.
    set "NODE_EXE=node"
    set "NPM_CMD=npm"
    goto :dependencies
)

:: 2. Check if portable Node.js already exists in folder
if exist "%PORTABLE_DIR%\node.exe" (
    echo [INFO] Lokale (portable) Node.js gedetecteerd in node-portable.
    set "NODE_EXE=%PORTABLE_DIR%\node.exe"
    set "NPM_CMD=%PORTABLE_DIR%\npm.cmd"
    set "PATH=%PORTABLE_DIR%;%PATH%"
    goto :dependencies
)

:: 3. If neither exists, offer to download portable Node.js automatically (No Admin required!)
echo [WAARSCHUWING] Geen Node.js installatie gevonden op deze computer.
echo Omdat je mogelijk geen admin-rechten hebt, kunnen we automatisch een 
echo draagbare (portable) versie van Node.js downloaden en in deze map plaatsen.
echo Dit vereist GEEN installatie of administratorrechten.
echo.
set /p download_choice=Wilt u de draagbare Node.js nu automatisch downloaden? (J/N): 

if /i "%download_choice%" neq "j" (
    echo.
    echo [FOUT] Node.js is vereist om deze applicatie te kunnen draaien.
    echo Sluit dit venster, installeer Node.js handmatig of kies 'J' bij de volgende start.
    pause
    exit /b
)

echo.
echo [INFO] Draagbare Node.js wordt gedownload (ca. 30MB, eenmalig)...
echo Dit kan een minuut duren, een moment geduld...
echo.

:: PowerShell script to download and extract Node.js portable
powershell -Command ^
    "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; " ^
    "echo 'Bezig met downloaden...'; " ^
    "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.12.2/node-v20.12.2-win-x64.zip' -OutFile '%NODE_ZIP%'; " ^
    "echo 'Bezig met uitpakken...'; " ^
    "Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%~dp0temp_node'; " ^
    "Move-Item -Path '%~dp0temp_node\node-v20.12.2-win-x64' -Destination '%PORTABLE_DIR%'; " ^
    "Remove-Item -Path '%~dp0temp_node' -Recurse; " ^
    "Remove-Item -Path '%NODE_ZIP%';"

if not exist "%PORTABLE_DIR%\node.exe" (
    echo.
    echo [FOUT] Het downloaden of uitpakken is mislukt. 
    echo Controleer je internetverbinding of download Node.js handmatig via https://nodejs.org
    pause
    exit /b
)

echo [OK] Draagbare Node.js is succesvol geïnstalleerd in 'node-portable'!
set "NODE_EXE=%PORTABLE_DIR%\node.exe"
set "NPM_CMD=%PORTABLE_DIR%\npm.cmd"
set "PATH=%PORTABLE_DIR%;%PATH%"
echo.

:dependencies
:: Step 1: Install server dependencies
if not exist node_modules (
    echo [INFO] Server bibliotheken worden geïnstalleerd (eenmalig)...
    call "%NPM_CMD%" install
) else (
    echo [INFO] Server bibliotheken zijn reeds geïnstalleerd.
)

:: Step 2: Install client dependencies & Build
cd client
if not exist node_modules (
    echo [INFO] Frontend bibliotheken worden geïnstalleerd (eenmalig)...
    call "%NPM_CMD%" install
) else (
    echo [INFO] Frontend bibliotheken zijn reeds geïnstalleerd.
)

if not exist dist (
    echo [INFO] Frontend wordt gecompileerd voor productie (eenmalig)...
    call "%NPM_CMD%" run build
) else (
    echo [INFO] Eerdere frontend-compilatie gevonden. 
    echo Wilt u de frontend opnieuw compileren? (J/N)
    set /p rebuild=keuze: 
    if /i "%rebuild%"=="j" (
        echo [INFO] Frontend opnieuw compileren...
        call "%NPM_CMD%" run build
      )
)
cd ..

echo.
echo =================================================================
echo [OK] Systeem staat klaar! Server start nu op...
echo.
echo 👥 Delen op het netwerk:
echo    Open de browser op deze computer via: http://localhost:5000
echo    Voor collega's in hetzelfde netwerk: gebruik het IP-adres van deze PC.
echo.
echo    U kunt de server stoppen door dit venster te sluiten.
echo =================================================================
echo.

start http://localhost:5000
call "%NODE_EXE%" server.js
pause
