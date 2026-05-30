# Taskify Mobile UI, Fast Create, And Theme Design

## Goal

Update the native Android Taskify APK so it keeps the existing local task list while improving the mobile task list UI, adding quick task creation from natural Russian text, and adding a dark theme toggle in the top-right area.

## Data Safety

- Keep `applicationId` as `com.taskify.local`.
- Keep SQLite database name `taskify.db`.
- Do not drop or recreate the `tasks` table.
- Store UI theme in `SharedPreferences`, not in the task database.
- If database changes are needed later, use additive `onUpgrade` migrations only.

## Selected UI Direction

- Use the first recommended task-card style from the mockup:
  - white/neutral task cards with a subtle lower shadow;
  - clipped/skewed corners plus rounded visual feel;
  - green outline completion circle on active tasks;
  - green filled circle with checkmark before a completed task moves to Archive;
  - icon-only delete button in the top-right of each card;
  - icon-only edit button as a sheet-with-pen in the bottom-right of each card.
- Move the create-task action above the task list using placement option C:
  - small plus button on the right side above the list;
  - no create button at the bottom of the list.

## Quick Create

When the user taps the plus button, show a compact quick-create dialog with one text field.

The parser should understand simple Russian input:

- priorities: `высокий`, `важный`, `средний`, `низкий`;
- dates: `сегодня`, `завтра`, `послезавтра`;
- time: `15:00`, `к 18:30`, `в 9:05`.

Example:

`позвонить врачу завтра 15:00 высокий`

Creates task:

- title: `позвонить врачу`;
- priority: `high`;
- due date: tomorrow;
- due time: `15:00`.

If parsing is incomplete, create the task using the remaining text as title and default missing fields.

## Dark Theme

- Add a compact icon button in the top-right area.
- Toggle between light and dark palettes.
- Save the selected theme in `SharedPreferences`.
- Rebuild the current screen after toggling.

## Existing Behavior To Preserve

- Existing tasks remain on the phone after installing the new APK over the old one.
- Existing edit dialog remains available from each task card.
- Existing one-hour-before reminder behavior remains for tasks with date and time.
- Existing archive behavior remains, with visual polish added in implementation.

## Verification

- Unit test the quick-create parser.
- Build the debug APK using the existing build flow.
- Confirm generated APK path remains `android-taskify/app/build/outputs/apk/debug/app-debug.apk`.
