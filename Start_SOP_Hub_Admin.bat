@echo off
REM ============================================================
REM  Start_SOP_Hub_Admin.bat  —  ADMIN / EDITOR LAUNCHER
REM  OC Assessor Mapping Division SOP Hub
REM ============================================================
REM
REM  IMPORTANT: Run THIS file, NOT OC_SOP_Hub.exe directly.
REM
REM  If you open OC_SOP_Hub.exe from the Q-drive directly,
REM  Windows locks the file and IT cannot push updates while
REM  you have it running.
REM
REM  This launcher copies the EXE to your local machine and
REM  runs the local copy with EDITOR MODE enabled.
REM
REM  EDITOR MODE enables:
REM    - Scenario Card Admin  (/scenario-cards/admin)
REM    - Approve / Needs Review / Delete actions
REM
REM ============================================================

cd /d "%~dp0"

echo.
echo  OC Assessor SOP Hub — Starting (ADMIN MODE)...
echo.

REM -- Stop any local instance already running
taskkill /F /IM OC_SOP_Hub.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul

REM -- Create local runtime folder
if not exist "%LOCALAPPDATA%\OC_SOP_Hub"          mkdir "%LOCALAPPDATA%\OC_SOP_Hub"
if not exist "%LOCALAPPDATA%\OC_SOP_Hub\instance" mkdir "%LOCALAPPDATA%\OC_SOP_Hub\instance"

REM -- Verify the Q-drive EXE is accessible
if not exist "%~dp0OC_SOP_Hub.exe" (
    echo  ERROR: OC_SOP_Hub.exe not found in:
    echo    %~dp0
    echo  Check that the Q-drive is connected.
    pause
    exit /b 1
)

REM -- Copy latest EXE from Q-drive to local machine (always update)
echo  Copying latest EXE to local machine...
copy /Y "%~dp0OC_SOP_Hub.exe" "%LOCALAPPDATA%\OC_SOP_Hub\OC_SOP_Hub.exe" >nul
if errorlevel 1 (
    echo  ERROR: Could not copy OC_SOP_Hub.exe.
    pause
    exit /b 1
)

REM -- Copy database from Q-drive only if local copy is missing or Q-drive is newer.
REM    The local database is NEVER copied back to Q-drive.
if exist "%~dp0instance\sop.db" (
    xcopy /D /Y "%~dp0instance\sop.db" "%LOCALAPPDATA%\OC_SOP_Hub\instance\" >nul
)

REM -- Shared Q-drive data directory (pending question queue lives here)
set "SOP_SHARED_DATA_DIR=Q:\Custom App Files\OC Assessor SOP Hub Test\shared_data"

REM -- Admin/editor mode: Scenario Card Admin and editor actions enabled
set QA_EDITOR_MODE=1

REM -- Launch local copy of the EXE
echo  Launching SOP Hub (admin/editor mode)...
start "OC SOP Hub Admin" "%LOCALAPPDATA%\OC_SOP_Hub\OC_SOP_Hub.exe"

REM -- Open browser after the server has had time to start
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:5050/scenario-cards/admin"

echo  Done. Browser opening to Scenario Card Admin.
echo.
