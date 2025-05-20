@echo off
call npm install
call npm run build 
xcopy .\dist\*.* .\public /E /Y 
if not exist ".\public\icons" mkdir ".\public\icons"
xcopy .\icons .\public\icons /E /Y
cd .\Server
start "Server" /max node server.js
echo Server started
pause
