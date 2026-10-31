@echo off
setlocal
chcp 65001 >nul

set "ROOT_DIR=%~dp0.."
cd /d "%ROOT_DIR%"

:menu
cls
echo ===============================================
echo Kentafrost Content Tools Menu
echo ===============================================
echo.
echo [1] Content status (content:status)
echo [2] Generate blog (blog:generate)
echo [3] Generate blog ^(verbose^) (blog:generate:verbose)
echo [4] Check blog sources (blog:check)
echo [5] Exit
echo.
set /p CHOICE=Select an option ^(1-5^):

if "%CHOICE%"=="1" goto run_content_status
if "%CHOICE%"=="2" goto run_blog_generate
if "%CHOICE%"=="3" goto run_blog_generate_verbose
if "%CHOICE%"=="4" goto run_blog_check
if "%CHOICE%"=="5" goto end

echo.
echo [WARN] Enter a number from 1 to 5.
timeout /t 2 >nul
goto menu

:run_content_status
call npm run content:status
goto wait_and_back

:run_blog_generate
call npm run blog:generate
goto wait_and_back

:run_blog_generate_verbose
call npm run blog:generate:verbose
goto wait_and_back

:run_blog_check
call npm run blog:check
goto wait_and_back

:wait_and_back
echo.
pause
goto menu

:end
echo.
echo Bye.
endlocal
exit /b 0
