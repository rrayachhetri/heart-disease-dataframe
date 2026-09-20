@echo off
setlocal

set ROOT_DIR=%~dp0
set PYTHON_EXE=%ROOT_DIR%.venv\Scripts\python.exe

if not exist "%PYTHON_EXE%" (
  echo [ERROR] Python venv not found at %PYTHON_EXE%
  echo Create it first: python -m venv .venv ^&^& .\.venv\Scripts\activate ^&^& pip install -r requirements-dev.txt
  exit /b 1
)

echo [1/2] Running backend API tests (pytest)...
pushd "%ROOT_DIR%"
"%PYTHON_EXE%" -m pytest
if errorlevel 1 (
  popd
  echo [FAIL] Backend tests failed.
  exit /b 1
)
popd

echo [2/2] Running frontend UI tests (vitest)...
pushd "%ROOT_DIR%ui"
call npm run test
if errorlevel 1 (
  popd
  echo [FAIL] Frontend tests failed.
  exit /b 1
)
popd

echo [PASS] All backend and frontend tests passed.
exit /b 0
