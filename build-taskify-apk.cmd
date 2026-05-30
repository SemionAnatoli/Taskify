@echo off
setlocal

set "ROOT=%~dp0"
set "TOOLS=%ROOT%.android-build-tools"
set "JAVA_HOME=%TOOLS%\jdk\jdk-17.0.19+10"
set "ANDROID_HOME=%TOOLS%\android-sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools;%PATH%"
set "GRADLE=%TOOLS%\gradle\gradle-8.10.2\bin\gradle.bat"

cd /d "%ROOT%android-taskify" || (
  echo Cannot find android-taskify project.
  pause
  exit /b 1
)

call "%GRADLE%" --no-daemon assembleDebug
if errorlevel 1 (
  echo.
  echo APK build failed.
  pause
  exit /b 1
)

echo.
echo APK is ready:
echo %ROOT%android-taskify\app\build\outputs\apk\debug\app-debug.apk
pause
