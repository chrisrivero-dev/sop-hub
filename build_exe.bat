@echo off
echo ================================================
echo  OC SOP Hub - EXE Build
echo ================================================
echo.

echo Cleaning old build artifacts...
if exist build rmdir /s /q build
if exist dist  rmdir /s /q dist
echo Done.
echo.

echo Running PyInstaller from spec file...
pyinstaller --noconfirm OC_SOP_Hub.spec

echo.
echo ================================================
if exist dist\OC_SOP_Hub.exe (
    echo  BUILD SUCCEEDED
    echo  EXE: dist\OC_SOP_Hub.exe
) else (
    echo  BUILD FAILED - check output above
)
echo ================================================
pause