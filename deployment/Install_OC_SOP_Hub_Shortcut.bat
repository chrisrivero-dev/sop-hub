@echo off
setlocal

set "APP_NAME=OC SOP Hub"
set "MASTER_DIR=%~dp0"
set "LOCAL_DIR=%LOCALAPPDATA%\OC_SOP_Hub"
set "LOCAL_INSTANCE_DIR=%LOCAL_DIR%\instance"
set "LOCAL_LAUNCHER=%LOCAL_DIR%\Start_SOP_Hub.bat"
set "DESKTOP_SHORTCUT=%USERPROFILE%\Desktop\OC SOP Hub.lnk"

if not exist "%LOCAL_DIR%" mkdir "%LOCAL_DIR%"
if not exist "%LOCAL_INSTANCE_DIR%" mkdir "%LOCAL_INSTANCE_DIR%"

echo Creating local SOP Hub launcher...

> "%LOCAL_LAUNCHER%" echo @echo off
>> "%LOCAL_LAUNCHER%" echo setlocal
>> "%LOCAL_LAUNCHER%" echo.
>> "%LOCAL_LAUNCHER%" echo set "MASTER_DIR=%MASTER_DIR%"
>> "%LOCAL_LAUNCHER%" echo set "LOCAL_DIR=%%LOCALAPPDATA%%\OC_SOP_Hub"
>> "%LOCAL_LAUNCHER%" echo set "LOCAL_INSTANCE_DIR=%%LOCAL_DIR%%\instance"
>> "%LOCAL_LAUNCHER%" echo.
>> "%LOCAL_LAUNCHER%" echo set "MASTER_EXE=%%MASTER_DIR%%OC_SOP_Hub.exe"
>> "%LOCAL_LAUNCHER%" echo set "LOCAL_EXE=%%LOCAL_DIR%%\OC_SOP_Hub.exe"
>> "%LOCAL_LAUNCHER%" echo.
>> "%LOCAL_LAUNCHER%" echo set "MASTER_DB=%%MASTER_DIR%%instance\sop.db"
>> "%LOCAL_LAUNCHER%" echo set "LOCAL_DB=%%LOCAL_INSTANCE_DIR%%\sop.db"
>> "%LOCAL_LAUNCHER%" echo.
>> "%LOCAL_LAUNCHER%" echo set "APP_URL=http://127.0.0.1:5050/ask-mapping-question"
>> "%LOCAL_LAUNCHER%" echo.
>> "%LOCAL_LAUNCHER%" echo if not exist "%%LOCAL_DIR%%" mkdir "%%LOCAL_DIR%%"
>> "%LOCAL_LAUNCHER%" echo if not exist "%%LOCAL_INSTANCE_DIR%%" mkdir "%%LOCAL_INSTANCE_DIR%%"
>> "%LOCAL_LAUNCHER%" echo.
>> "%LOCAL_LAUNCHER%" echo taskkill /F /IM OC_SOP_Hub.exe ^>nul 2^>^&1
>> "%LOCAL_LAUNCHER%" echo.
>> "%LOCAL_LAUNCHER%" echo copy /Y "%%MASTER_EXE%%" "%%LOCAL_EXE%%" ^>nul
>> "%LOCAL_LAUNCHER%" echo.
>> "%LOCAL_LAUNCHER%" echo if not exist "%%LOCAL_DB%%" ^(
>> "%LOCAL_LAUNCHER%" echo     copy /Y "%%MASTER_DB%%" "%%LOCAL_DB%%" ^>nul
>> "%LOCAL_LAUNCHER%" echo ^) else ^(
>> "%LOCAL_LAUNCHER%" echo     robocopy "%%MASTER_DIR%%instance" "%%LOCAL_INSTANCE_DIR%%" "sop.db" /XO ^>nul
>> "%LOCAL_LAUNCHER%" echo ^)
>> "%LOCAL_LAUNCHER%" echo.
>> "%LOCAL_LAUNCHER%" echo start "" /MIN "%%LOCAL_EXE%%"
>> "%LOCAL_LAUNCHER%" echo.
>> "%LOCAL_LAUNCHER%" echo powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline = (Get-Date).AddSeconds(30); while ((Get-Date) -lt $deadline) { try { $client = New-Object Net.Sockets.TcpClient; $result = $client.BeginConnect('127.0.0.1', 5050, $null, $null); if ($result.AsyncWaitHandle.WaitOne(250)) { $client.EndConnect($result); $client.Close(); exit 0 }; $client.Close() } catch {}; Start-Sleep -Milliseconds 250 }; exit 1" ^>nul 2^>^&1
>> "%LOCAL_LAUNCHER%" echo.
>> "%LOCAL_LAUNCHER%" echo start "" "%%APP_URL%%"
>> "%LOCAL_LAUNCHER%" echo.
>> "%LOCAL_LAUNCHER%" echo endlocal
>> "%LOCAL_LAUNCHER%" echo exit /b

echo Creating desktop shortcut...

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
"$WshShell = New-Object -ComObject WScript.Shell; ^
$Shortcut = $WshShell.CreateShortcut('%DESKTOP_SHORTCUT%'); ^
$Shortcut.TargetPath = '%LOCAL_LAUNCHER%'; ^
$Shortcut.WorkingDirectory = '%LOCAL_DIR%'; ^
$Shortcut.IconLocation = '%LOCAL_DIR%\OC_SOP_Hub.exe,0'; ^
$Shortcut.Save()"

echo.
echo OC SOP Hub shortcut created successfully.
echo.
echo Use the desktop shortcut named "OC SOP Hub" from now on.
echo Do NOT run OC_SOP_Hub.exe directly from the Q-drive.
echo.

timeout /t 3 /nobreak >nul

endlocal
exit /b