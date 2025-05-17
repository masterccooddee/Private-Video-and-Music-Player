@echo off
cd Redis
start "Redis" start.bat
cd ../MultiMediaPlayer
call npm install
call npm run build 
xcopy .\dist\*.* ..\MultiMediaPlayer\public /E /Y 
if not exist "..\MultiMediaPlayer\public\icons" mkdir "..\MultiMediaPlayer\public\icons"
xcopy .\icons ..\MultiMediaPlayer\public\icons /E /Y
cd ..\MultiMediaPlayer\Server
start "Server" /max node server.js
echo Server started
pause
