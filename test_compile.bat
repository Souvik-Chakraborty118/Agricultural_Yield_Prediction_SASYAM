@echo off
cd /d "%~dp0"
if not exist out mkdir out
echo Compiling SASYAM Java server...
javac -encoding UTF-8 -d out src\main\java\com\sasyam\app\SasyamServer.java
if errorlevel 1 (
  echo Compilation failed!
  pause
  exit /b 1
)
echo Compilation successful!
pause
