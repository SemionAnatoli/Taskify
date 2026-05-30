# Taskify Android

Нативная Android-версия Taskify с локальным хранением задач на телефоне.

## Что внутри

- Java + Android SDK без React/Next/Prisma.
- Локальная SQLite-БД `taskify.db` внутри приватного хранилища приложения.
- Задачи сохраняются между перезапусками приложения и обновлениями APK.
- Для работы не нужен интернет и не нужен сервер.
- Выполненные задачи уходят в раздел `Архив`.

Важно: Android удалит локальную БД, если вручную удалить приложение или очистить данные приложения в настройках.

## Как собрать APK

На компьютере должны быть установлены:

1. Android Studio.
2. Android SDK Platform 35.
3. JDK, который идёт вместе с Android Studio.

После установки откройте папку `android-taskify` в Android Studio и нажмите:

`Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`

APK появится в:

`android-taskify/app/build/outputs/apk/debug/app-debug.apk`

## Локальная сборка через консоль

Когда Android Studio установит Gradle/JDK/SDK:

```powershell
cd C:\Users\Семен\Desktop\Taskify\android-taskify
gradle assembleDebug
```

Если Android Studio предложит обновить Android Gradle Plugin или compileSdk, можно согласиться.
