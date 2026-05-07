@echo off
echo Building OC SOP Hub EXE...
echo.

pyinstaller --noconfirm --clean --onefile --windowed --name OC_SOP_Hub --add-data "templates;templates" --add-data "static;static" app.py

echo.
echo Build finished.
pause
