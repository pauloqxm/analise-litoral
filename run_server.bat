@echo off
setlocal

set "PYTHON_EXE=C:\Users\paulo\AppData\Local\Programs\Python\Python313\python.exe"

if not exist "%PYTHON_EXE%" (
  where python >nul 2>&1
  if errorlevel 1 (
    echo [ERRO] Python nao encontrado.
    echo Ajuste PYTHON_EXE em run_server.bat ou adicione python ao PATH.
    pause
    exit /b 1
  )
  set "PYTHON_EXE=python"
)

cd /d "%~dp0"

echo Instalando/atualizando dependencias...
"%PYTHON_EXE%" -m pip install -r "backend\requirements.txt"
if errorlevel 1 (
  echo [ERRO] Falha ao instalar dependencias.
  pause
  exit /b 1
)

echo.
echo Iniciando servidor em http://127.0.0.1:8001 ...
echo Aba principal: http://127.0.0.1:8001/mapa?aba=analise_leste
echo.
"%PYTHON_EXE%" -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload

endlocal
