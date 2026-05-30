# Taskify Mobile UI Fast Create Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the selected Taskify Android UI update, quick Russian task creation, and dark theme toggle while preserving the existing on-phone task database.

**Architecture:** Add a pure Java `QuickTaskParser` with local unit tests for natural text parsing. Keep task persistence unchanged in `TaskDbHelper`; add theme state in `SharedPreferences` and update `MainActivity` rendering methods to use active theme colors and the selected card layout.

**Tech Stack:** Native Android Java, SQLite, SharedPreferences, Gradle Android plugin, JUnit 4 for local parser tests.

---

## File Structure

- Create `android-taskify/app/src/main/java/com/taskify/local/QuickTaskParser.java`: parses quick-create text into title, priority, due date, and due time.
- Create `android-taskify/app/src/test/java/com/taskify/local/QuickTaskParserTest.java`: local JVM tests for parser behavior.
- Modify `android-taskify/app/build.gradle`: add JUnit test dependency.
- Modify `android-taskify/app/src/main/java/com/taskify/local/MainActivity.java`: selected card UI, plus button placement C, quick-create dialog, dark theme toggle.

### Task 1: Quick Task Parser

**Files:**
- Create: `android-taskify/app/src/main/java/com/taskify/local/QuickTaskParser.java`
- Create: `android-taskify/app/src/test/java/com/taskify/local/QuickTaskParserTest.java`
- Modify: `android-taskify/app/build.gradle`

- [ ] **Step 1: Write failing parser tests**

Create tests for:

```java
QuickTaskParser.Result result = QuickTaskParser.parse("позвонить врачу завтра 15:00 высокий", baseMillis);
assertEquals("позвонить врачу", result.title);
assertEquals("high", result.priority);
assertEquals(15 * 60, result.dueTimeMinutes.intValue());
```

Also test `послезавтра низкий`, `сегодня к 9:05 важный`, and fallback empty/default behavior.

- [ ] **Step 2: Run tests and verify they fail**

Run: `.\.android-build-tools\gradle\gradle-8.10.2\bin\gradle.bat --no-daemon :app:testDebugUnitTest` from `android-taskify`.

- [ ] **Step 3: Implement `QuickTaskParser`**

Use lowercase token matching, regex time extraction, and `Calendar` date arithmetic. Return `medium` priority when no priority is found.

- [ ] **Step 4: Run tests and verify they pass**

Run the same Gradle unit-test command.

### Task 2: Selected Mobile UI

**Files:**
- Modify: `android-taskify/app/src/main/java/com/taskify/local/MainActivity.java`

- [ ] **Step 1: Move add action above the list**

Render a compact plus icon in a row above task cards and remove the bottom add button.

- [ ] **Step 2: Update task card visuals**

Use clipped rounded-card background, card elevation/translationZ where available, green check circle, icon-only delete button, and icon-only edit button.

- [ ] **Step 3: Preserve existing edit and archive behavior**

Edit icon opens the existing full task dialog. Delete still asks for confirmation before deletion.

### Task 3: Quick Create UI

**Files:**
- Modify: `android-taskify/app/src/main/java/com/taskify/local/MainActivity.java`

- [ ] **Step 1: Add quick-create dialog**

Plus button opens a one-field dialog with example text.

- [ ] **Step 2: Create task from parser result**

Call `QuickTaskParser.parse(...)`, create the task with parsed fields, schedule reminders through existing `TaskReminderScheduler.schedule(...)`, and reload.

### Task 4: Dark Theme Toggle

**Files:**
- Modify: `android-taskify/app/src/main/java/com/taskify/local/MainActivity.java`

- [ ] **Step 1: Add theme state**

Read and write `SharedPreferences` key `dark_theme_enabled`.

- [ ] **Step 2: Add top-right toggle**

Add an icon-only sun/moon button in the top-right area and rebuild layout when toggled.

- [ ] **Step 3: Apply palettes**

Route backgrounds, text, chips, dialogs, and task cards through helper methods that use the active palette.

### Task 5: Build APK

**Files:**
- Output: `android-taskify/app/build/outputs/apk/debug/app-debug.apk`

- [ ] **Step 1: Run unit tests**

Run: `.\.android-build-tools\gradle\gradle-8.10.2\bin\gradle.bat --no-daemon :app:testDebugUnitTest`

- [ ] **Step 2: Build debug APK**

Run: `.\build-taskify-apk.cmd` or equivalent Gradle command.

- [ ] **Step 3: Confirm APK path**

Confirm `android-taskify/app/build/outputs/apk/debug/app-debug.apk` exists and is freshly updated.
