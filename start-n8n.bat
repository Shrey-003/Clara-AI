@echo off
echo Starting n8n locally via npx...
echo.

:: Load environment variables from .env
if exist .env (
    for /f "usebackq tokens=1,* delims==" %%a in (.env) do (
        set "%%a=%%b"
    )
)

:: Set required environment variables for n8n locally
set N8N_BASIC_AUTH_ACTIVE=true
set N8N_BASIC_AUTH_USER=clara
set N8N_BASIC_AUTH_PASSWORD=clara2024
set GENERIC_TIMEZONE=America/New_York
set N8N_SECURE_COOKIE=false

:: Start n8n
cmd /c npx -y n8n@latest
