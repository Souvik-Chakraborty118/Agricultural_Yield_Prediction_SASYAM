@echo off
setlocal
cd /d "%~dp0"

if "%SASYAM_MODEL_DIR%"=="" set "SASYAM_MODEL_DIR=C:\Users\Souvik\Yield_Time_Frame_App"
set "SASYAM_VENV_DIR=%~dp0.venv"

echo Checking Python for SASYAM...

set "BASE_PY="
py -3 --version >nul 2>nul
if not errorlevel 1 set "BASE_PY=py -3"

if "%BASE_PY%"=="" (
  python --version >nul 2>nul
  if not errorlevel 1 set "BASE_PY=python"
)

if "%BASE_PY%"=="" (
  echo.
  echo Python 3.11+ was not found.
  echo Install Python from https://www.python.org/downloads/ and tick "Add python.exe to PATH".
  echo Then run setup_python.bat again.
  pause
  exit /b 1
)

echo Creating/recreating virtual environment:
echo   %SASYAM_VENV_DIR%
%BASE_PY% -m venv "%SASYAM_VENV_DIR%"
if errorlevel 1 (
  echo Failed to create virtual environment.
  pause
  exit /b 1
)

set "SASYAM_PYTHON=%SASYAM_VENV_DIR%\Scripts\python.exe"
"%SASYAM_PYTHON%" -m pip install --upgrade pip
"%SASYAM_PYTHON%" -m pip install -r requirements-runtime.txt

echo.
echo Python setup complete.
echo Runtime:
echo   %SASYAM_PYTHON%
pause
