package com.taskify.local;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorFilter;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.DatePicker;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

public final class MainActivity extends Activity {
    private static final int NOTIFICATION_PERMISSION_REQUEST = 42;
    private static final String PREFS = "taskify_prefs";
    private static final String PREF_DARK_THEME = "dark_theme_enabled";

    private static final int ACCENT = Color.rgb(124, 106, 247);
    private static final int ACCENT_DARK = Color.rgb(167, 139, 250);
    private static final int ACCENT_SOFT = Color.rgb(240, 238, 255);
    private static final int ACCENT_SOFT_DARK = Color.rgb(45, 38, 82);
    private static final int LIGHT_BG = Color.rgb(240, 242, 248);
    private static final int LIGHT_CARD = Color.WHITE;
    private static final int LIGHT_BORDER = Color.rgb(232, 234, 240);
    private static final int LIGHT_TEXT = Color.rgb(26, 27, 46);
    private static final int LIGHT_MUTED = Color.rgb(107, 114, 128);
    private static final int LIGHT_CHIP = Color.rgb(243, 244, 246);
    private static final int DARK_BG = Color.rgb(16, 20, 31);
    private static final int DARK_CARD = Color.rgb(30, 36, 52);
    private static final int DARK_BORDER = Color.rgb(55, 65, 88);
    private static final int DARK_TEXT = Color.rgb(242, 244, 248);
    private static final int DARK_MUTED = Color.rgb(165, 174, 191);
    private static final int DARK_CHIP = Color.rgb(42, 50, 70);
    private static final int STATUS_BLUE = Color.rgb(2, 132, 199);
    private static final int STATUS_BLUE_BG = Color.rgb(224, 242, 254);
    private static final int STATUS_GREEN = Color.rgb(5, 150, 105);
    private static final int STATUS_GREEN_BG = Color.rgb(209, 250, 229);
    private static final int COMPLETE_GREEN = Color.rgb(16, 185, 129);
    private static final int DANGER = Color.rgb(239, 68, 68);
    private static final int ICON_DELETE = 1;
    private static final int ICON_EDIT = 2;
    private static final int ICON_RESTORE = 3;

    private TaskDbHelper db;
    private LinearLayout root;
    private LinearLayout taskList;
    private TextView titleText;
    private TextView counterText;
    private Button tasksButton;
    private Button archiveButton;
    private boolean showArchive = false;
    private boolean darkTheme = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        db = new TaskDbHelper(this);
        darkTheme = getPreferencesStore().getBoolean(PREF_DARK_THEME, false);
        TaskReminderScheduler.ensureChannel(this);
        requestNotificationPermissionIfNeeded();
        buildLayout();
        seedDemoTasksIfNeeded();
        TaskReminderScheduler.scheduleDateOnlySummary(this);
        reloadTasks();
    }

    private void buildLayout() {
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(bgColor());

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(cardColor());
            getWindow().setNavigationBarColor(bgColor());
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            getWindow().getDecorView().setSystemUiVisibility(darkTheme ? 0 : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }

        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.VERTICAL);
        top.setPadding(dp(18), dp(38), dp(18), dp(14));
        top.setBackgroundColor(cardColor());

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);

        titleText = new TextView(this);
        titleText.setText("Taskify");
        titleText.setTextSize(24);
        titleText.setTypeface(Typeface.DEFAULT_BOLD);
        titleText.setTextColor(textColor());
        header.addView(titleText, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));

        TextView themeButton = iconButton(darkTheme ? "☀" : "☾", accentColor(), accentSoftColor(), "Сменить тему");
        themeButton.setTextSize(18);
        themeButton.setOnClickListener(v -> toggleTheme());
        header.addView(themeButton, new LinearLayout.LayoutParams(dp(36), dp(36)));
        top.addView(header);

        counterText = new TextView(this);
        counterText.setTextSize(13);
        counterText.setTextColor(mutedColor());
        counterText.setPadding(0, dp(3), 0, dp(12));
        top.addView(counterText);

        LinearLayout actions = new LinearLayout(this);
        actions.setOrientation(LinearLayout.HORIZONTAL);
        actions.setGravity(Gravity.CENTER_VERTICAL);

        tasksButton = primaryButton("Задачи");
        tasksButton.setOnClickListener(v -> {
            showArchive = false;
            reloadTasks();
        });

        archiveButton = secondaryButton("Архив");
        archiveButton.setOnClickListener(v -> {
            showArchive = true;
            reloadTasks();
        });

        actions.addView(tasksButton, new LinearLayout.LayoutParams(0, dp(40), 1));
        LinearLayout.LayoutParams archiveParams = new LinearLayout.LayoutParams(0, dp(40), 1);
        archiveParams.setMargins(dp(10), 0, 0, 0);
        actions.addView(archiveButton, archiveParams);

        top.addView(actions);
        root.addView(top);

        ScrollView scroll = new ScrollView(this);
        taskList = new LinearLayout(this);
        taskList.setOrientation(LinearLayout.VERTICAL);
        taskList.setPadding(dp(14), dp(14), dp(14), dp(24));
        scroll.addView(taskList);
        root.addView(scroll, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));

        setContentView(root);
    }

    private void toggleTheme() {
        darkTheme = !darkTheme;
        getPreferencesStore().edit().putBoolean(PREF_DARK_THEME, darkTheme).apply();
        buildLayout();
        reloadTasks();
    }

    private SharedPreferences getPreferencesStore() {
        return getSharedPreferences(PREFS, MODE_PRIVATE);
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return;
        if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) return;
        requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, NOTIFICATION_PERMISSION_REQUEST);
    }

    private void reloadTasks() {
        if (taskList == null) return;
        List<Task> all = db.getTasks("", "", "");
        List<Task> tasks = new ArrayList<>();
        long done = 0;
        for (Task task : all) {
            if (task.isDone()) {
                done++;
                if (showArchive) tasks.add(task);
            } else if (!showArchive) {
                tasks.add(task);
            }
        }

        sortVisibleTasks(tasks);
        styleModeButton(tasksButton, !showArchive);
        styleModeButton(archiveButton, showArchive);
        counterText.setText((all.size() - done) + " активных · " + done + " в архиве");

        taskList.removeAllViews();
        if (showArchive) {
            if (!tasks.isEmpty()) taskList.addView(archiveActionRow(tasks.size()));
        } else {
            taskList.addView(activeActionRow());
        }

        if (tasks.isEmpty()) {
            TextView empty = new TextView(this);
            empty.setText(showArchive ? "Архив пуст" : "Задач нет");
            empty.setGravity(Gravity.CENTER);
            empty.setTextColor(mutedColor());
            empty.setTextSize(16);
            taskList.addView(empty, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(150)));
            return;
        }

        long now = System.currentTimeMillis();
        long today = startOfToday();
        for (Task task : tasks) {
            taskList.addView(taskCard(task, now, today));
        }
    }

    private View activeActionRow() {
        LinearLayout row = listHeaderRow("Сегодня и дальше");
        TextView add = iconButton("+", Color.WHITE, accentColor(), "Новая задача");
        add.setTextSize(24);
        add.setOnClickListener(v -> showQuickTaskDialog());
        row.addView(add, new LinearLayout.LayoutParams(dp(38), dp(38)));
        return row;
    }

    private View archiveActionRow(int count) {
        LinearLayout row = listHeaderRow("Архив · " + count);
        Button clear = smallDangerButton("Удалить все");
        clear.setOnClickListener(v -> confirmDeleteAllArchive());
        row.addView(clear, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, dp(34)));
        return row;
    }

    private LinearLayout listHeaderRow(String label) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(0, 0, 0, dp(10));

        TextView title = new TextView(this);
        title.setText(label);
        title.setTextColor(mutedColor());
        title.setTextSize(12);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setAllCaps(true);
        row.addView(title, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));
        return row;
    }

    private View taskCard(Task task, long now, long startOfToday) {
        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.HORIZONTAL);
        card.setBackground(new ChamferedDrawable(cardColor(), borderColor(), dp(1), dp(12)));
        card.setClickable(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            card.setElevation(dp(5));
            card.setTranslationZ(dp(1));
        }

        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        params.setMargins(0, 0, 0, dp(10));
        card.setLayoutParams(params);

        View strip = new View(this);
        strip.setBackgroundColor(priorityColor(task.priority));
        LinearLayout.LayoutParams stripParams = new LinearLayout.LayoutParams(dp(4), ViewGroup.LayoutParams.MATCH_PARENT);
        stripParams.setMargins(0, dp(12), 0, dp(12));
        card.addView(strip, stripParams);

        LinearLayout body = new LinearLayout(this);
        body.setOrientation(LinearLayout.HORIZONTAL);
        body.setGravity(Gravity.TOP);
        body.setMinimumHeight(dp(TaskCardLayoutMetrics.TASK_BODY_MIN_HEIGHT_DP));
        body.setPadding(
            dp(10),
            dp(TaskCardLayoutMetrics.BODY_VERTICAL_PADDING_DP),
            dp(8),
            dp(TaskCardLayoutMetrics.BODY_VERTICAL_PADDING_DP)
        );

        TextView marker = new TextView(this);
        marker.setText(statusMark(task.status));
        marker.setTextSize(14);
        marker.setTypeface(Typeface.DEFAULT_BOLD);
        marker.setTextColor(statusDotText(task.status));
        marker.setGravity(Gravity.CENTER);
        marker.setBackground(oval(statusDotBg(task.status), statusDotBorder(task.status), 2));
        marker.setContentDescription(task.isDone() ? "Задача выполнена" : "Выполнить задачу");
        LinearLayout.LayoutParams markerParams = new LinearLayout.LayoutParams(dp(22), dp(22));
        markerParams.setMargins(0, dp(2), dp(10), 0);
        body.addView(marker, markerParams);

        LinearLayout textBlock = new LinearLayout(this);
        textBlock.setOrientation(LinearLayout.VERTICAL);

        TextView title = new TextView(this);
        title.setText(task.title);
        title.setTextColor(task.isDone() ? mutedColor() : textColor());
        title.setTextSize(14);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setSingleLine(false);
        textBlock.addView(title);

        if (task.description != null) {
            TextView description = new TextView(this);
            description.setText(task.description);
            description.setTextColor(mutedColor());
            description.setTextSize(12);
            description.setPadding(0, dp(3), 0, 0);
            textBlock.addView(description);
        }

        LinearLayout chips = new LinearLayout(this);
        chips.setOrientation(LinearLayout.HORIZONTAL);
        chips.setPadding(0, dp(7), 0, 0);
        chips.addView(chip(statusLabel(task.status), statusBg(task.status), statusColor(task.status)));
        chips.addView(chip(priorityLabel(task.priority), transparentPriority(task.priority), priorityColor(task.priority)));
        if (task.category != null) chips.addView(chip(task.category, bgColor(), mutedColor()));
        textBlock.addView(chips);

        if (task.dueDate != null) {
            TextView due = new TextView(this);
            due.setText(formatDue(task) + (task.isOverdue(now, startOfToday) ? " · просрочено" : ""));
            due.setTextColor(task.isOverdue(now, startOfToday) ? DANGER : mutedColor());
            due.setTextSize(11);
            due.setPadding(0, dp(6), 0, 0);
            textBlock.addView(due);
        }

        body.addView(textBlock, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));

        LinearLayout side = new LinearLayout(this);
        side.setOrientation(LinearLayout.VERTICAL);
        side.setGravity(Gravity.CENTER_HORIZONTAL);
        side.setMinimumHeight(dp(TaskCardLayoutMetrics.ACTION_RAIL_MIN_HEIGHT_DP));
        side.setPadding(
            0,
            dp(TaskCardLayoutMetrics.ACTION_RAIL_VERTICAL_INSET_DP),
            0,
            dp(TaskCardLayoutMetrics.ACTION_RAIL_VERTICAL_INSET_DP)
        );

        if (showArchive) {
            View restore = actionIconButton(ICON_RESTORE, STATUS_GREEN, Color.rgb(236, 253, 245), "Вернуть задачу");
            restore.setOnClickListener(v -> restoreTask(task));
            side.addView(restore, actionIconLayoutParams());

            View spacer = new View(this);
            side.addView(spacer, actionSpacerLayoutParams());

            View delete = actionIconButton(ICON_DELETE, DANGER, Color.rgb(255, 241, 242), "Удалить задачу");
            delete.setOnClickListener(v -> confirmDelete(task));
            side.addView(delete, actionIconLayoutParams());
        } else {
            View delete = actionIconButton(ICON_DELETE, DANGER, Color.rgb(255, 241, 242), "Удалить задачу");
            delete.setOnClickListener(v -> confirmDelete(task));
            side.addView(delete, actionIconLayoutParams());

            View spacer = new View(this);
            side.addView(spacer, actionSpacerLayoutParams());

            View edit = actionIconButton(ICON_EDIT, accentColor(), accentSoftColor(), "Изменить задачу");
            edit.setOnClickListener(v -> showTaskDialog(task));
            side.addView(edit, actionIconLayoutParams());
        }

        LinearLayout.LayoutParams sideParams = new LinearLayout.LayoutParams(
            dp(TaskCardLayoutMetrics.ACTION_RAIL_WIDTH_DP),
            ViewGroup.LayoutParams.MATCH_PARENT
        );
        sideParams.setMargins(dp(6), 0, 0, 0);
        body.addView(side, sideParams);
        card.addView(body, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1));

        if (!showArchive) {
            marker.setOnClickListener(v -> completeTaskWithAnimation(task, card, marker));
        } else {
            marker.setOnClickListener(v -> restoreTask(task));
        }

        return card;
    }

    private void completeTaskWithAnimation(Task task, View card, TextView marker) {
        marker.setText("✓");
        marker.setTextColor(Color.WHITE);
        marker.setBackground(oval(COMPLETE_GREEN, COMPLETE_GREEN, 2));
        playCompleteSound();
        card.animate()
            .alpha(0f)
            .translationX(dp(24))
            .scaleY(0.94f)
            .setStartDelay(140)
            .setDuration(360)
            .withEndAction(() -> {
                task.status = "done";
                db.updateTask(task);
                TaskReminderScheduler.cancel(this, task.id);
                TaskReminderScheduler.scheduleDateOnlySummary(this);
                reloadTasks();
            })
            .start();
    }

    private void playCompleteSound() {
        MediaPlayer player = MediaPlayer.create(this, R.raw.task_complete);
        if (player == null) return;
        player.setOnCompletionListener(MediaPlayer::release);
        player.setOnErrorListener((mediaPlayer, what, extra) -> {
            mediaPlayer.release();
            return true;
        });
        player.start();
    }

    private void restoreTask(Task task) {
        task.status = "pending";
        db.updateTask(task);
        TaskReminderScheduler.schedule(this, task);
        TaskReminderScheduler.scheduleDateOnlySummary(this);
        reloadTasks();
    }

    private void showQuickTaskDialog() {
        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(16), dp(8), dp(16), 0);

        EditText quick = input("Например: позвонить врачу завтра 15:00 высокий");
        quick.setSingleLine(false);
        quick.setMinLines(2);
        form.addView(quick);

        new AlertDialog.Builder(this)
            .setTitle("Новая задача")
            .setView(form)
            .setNegativeButton("Отмена", null)
            .setNeutralButton("Подробно", (dialog, which) -> showTaskDialog(null))
            .setPositiveButton("Создать", (dialog, which) -> {
                QuickTaskParser.Result parsed = QuickTaskParser.parse(quick.getText().toString(), System.currentTimeMillis());
                Task created = db.createTask(
                    parsed.title,
                    null,
                    null,
                    parsed.priority,
                    "pending",
                    parsed.dueDate,
                    parsed.dueTimeMinutes
                );
                TaskReminderScheduler.schedule(this, created);
                TaskReminderScheduler.scheduleDateOnlySummary(this);
                reloadTasks();
            })
            .show();
    }

    private void showTaskDialog(Task existing) {
        boolean editing = existing != null;
        LinearLayout form = new LinearLayout(this);
        form.setOrientation(LinearLayout.VERTICAL);
        form.setPadding(dp(16), dp(8), dp(16), 0);

        EditText title = input("Название");
        title.setText(editing ? existing.title : "");
        form.addView(title);

        EditText description = input("Описание");
        description.setSingleLine(false);
        description.setMinLines(2);
        description.setText(editing && existing.description != null ? existing.description : "");
        form.addView(description);

        TextView priorityLabel = new TextView(this);
        priorityLabel.setText("Приоритет");
        priorityLabel.setTextColor(mutedColor());
        priorityLabel.setTextSize(13);
        priorityLabel.setPadding(0, dp(10), 0, dp(4));
        form.addView(priorityLabel);

        Spinner priority = buildSpinner(new String[] {"Высокий", "Средний", "Низкий"});
        priority.setSelection(editing && "high".equals(existing.priority) ? 0 : editing && "low".equals(existing.priority) ? 2 : 1);
        form.addView(priority, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(46)));

        Long initialDueDate = editing ? existing.dueDate : null;
        final Long[] dueDateValue = new Long[] { initialDueDate == null ? null : startOfDay(initialDueDate) };
        final Integer[] dueTimeValue = new Integer[] {
            editing ? existing.dueTimeMinutes != null ? existing.dueTimeMinutes : timeMinutesFromMillis(initialDueDate) : null
        };

        TextView dueDate = new TextView(this);
        dueDate.setText(dueDateValue[0] == null ? "Дата: не задана" : "Дата: " + formatDateOnly(dueDateValue[0]));
        dueDate.setTextSize(15);
        dueDate.setTextColor(accentColor());
        dueDate.setPadding(0, dp(14), 0, dp(8));
        dueDate.setOnClickListener(v -> pickDate(dueDate, dueDateValue));
        form.addView(dueDate);

        TextView dueTime = new TextView(this);
        dueTime.setText(dueTimeValue[0] == null ? "Время: не задано" : "Время: " + formatTime(dueTimeValue[0]));
        dueTime.setTextSize(15);
        dueTime.setTextColor(accentColor());
        dueTime.setPadding(0, dp(4), 0, dp(12));
        dueTime.setOnClickListener(v -> pickTime(dueTime, dueDateValue, dueTimeValue));
        form.addView(dueTime);

        new AlertDialog.Builder(this)
            .setTitle(editing ? "Редактировать задачу" : "Новая задача")
            .setView(form)
            .setNegativeButton("Отмена", null)
            .setNeutralButton(editing ? "Очистить срок" : null, (dialog, which) -> {
                if (editing) {
                    existing.dueDate = null;
                    existing.dueTimeMinutes = null;
                    db.updateTask(existing);
                    TaskReminderScheduler.cancel(this, existing.id);
                    TaskReminderScheduler.scheduleDateOnlySummary(this);
                    reloadTasks();
                }
            })
            .setPositiveButton(editing ? "Сохранить" : "Создать", (dialog, which) -> {
                String selectedPriority = spinnerPriority(priority.getSelectedItemPosition());
                if (editing) {
                    existing.title = title.getText().toString();
                    existing.description = description.getText().toString();
                    existing.priority = selectedPriority;
                    existing.dueDate = dueDateValue[0];
                    existing.dueTimeMinutes = dueDateValue[0] == null ? null : dueTimeValue[0];
                    db.updateTask(existing);
                    TaskReminderScheduler.schedule(this, existing);
                } else {
                    Task created = db.createTask(
                        title.getText().toString(),
                        description.getText().toString(),
                        null,
                        selectedPriority,
                        "pending",
                        dueDateValue[0],
                        dueDateValue[0] == null ? null : dueTimeValue[0]
                    );
                    TaskReminderScheduler.schedule(this, created);
                }
                TaskReminderScheduler.scheduleDateOnlySummary(this);
                reloadTasks();
            })
            .show();
    }

    private void pickDate(TextView label, Long[] target) {
        Calendar calendar = Calendar.getInstance();
        if (target[0] != null) calendar.setTimeInMillis(target[0]);
        DatePickerDialog dialog = new DatePickerDialog(
            this,
            (DatePicker view, int year, int month, int dayOfMonth) -> {
                Calendar chosen = Calendar.getInstance();
                chosen.set(year, month, dayOfMonth, 0, 0, 0);
                chosen.set(Calendar.MILLISECOND, 0);
                target[0] = chosen.getTimeInMillis();
                label.setText("Дата: " + formatDateOnly(target[0]));
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        );
        dialog.show();
    }

    private void pickTime(TextView label, Long[] dueDateValue, Integer[] dueTimeValue) {
        if (dueDateValue[0] == null) {
            Toast.makeText(this, "Сначала выберите дату", Toast.LENGTH_SHORT).show();
            return;
        }
        Calendar chosen = Calendar.getInstance();
        if (dueTimeValue[0] != null) {
            chosen.set(Calendar.HOUR_OF_DAY, dueTimeValue[0] / 60);
            chosen.set(Calendar.MINUTE, dueTimeValue[0] % 60);
        }
        TimePickerDialog dialog = new TimePickerDialog(
            this,
            (view, hourOfDay, minute) -> {
                dueTimeValue[0] = hourOfDay * 60 + minute;
                label.setText("Время: " + formatTime(dueTimeValue[0]));
            },
            chosen.get(Calendar.HOUR_OF_DAY),
            chosen.get(Calendar.MINUTE),
            true
        );
        dialog.show();
    }

    private void confirmDelete(Task task) {
        new AlertDialog.Builder(this)
            .setTitle("Точно удалить?")
            .setMessage(task.title)
            .setNegativeButton("Нет", null)
            .setPositiveButton("Да", (dialog, which) -> {
                db.deleteTask(task.id);
                TaskReminderScheduler.cancel(this, task.id);
                TaskReminderScheduler.scheduleDateOnlySummary(this);
                reloadTasks();
            })
            .show();
    }

    private void confirmDeleteAllArchive() {
        List<Task> archived = db.getTasks("done", "", "");
        new AlertDialog.Builder(this)
            .setTitle("Точно удалить?")
            .setMessage("Удалить все задачи из архива: " + archived.size() + "?")
            .setNegativeButton("Нет", null)
            .setPositiveButton("Да", (dialog, which) -> {
                for (Task task : archived) {
                    db.deleteTask(task.id);
                    TaskReminderScheduler.cancel(this, task.id);
                }
                TaskReminderScheduler.scheduleDateOnlySummary(this);
                reloadTasks();
            })
            .show();
    }

    private void seedDemoTasksIfNeeded() {
        if (!db.getTasks("", "", "").isEmpty()) return;
        long now = System.currentTimeMillis();
        db.createTask("Подготовить демонстрацию Taskify", "Проверить создание задач, архив и удобство карточек.", "Работа", "high", "in_progress", startOfDay(now), null);
        db.createTask("Составить список дел", "Проверить быстрый перенос выполненных задач в архив.", "Работа", "high", "pending", startOfDay(now + 86400000L), 10 * 60);
        db.createTask("Отполировать интерфейс карточек", "Проверить удобство на экране смартфона.", "UI", "medium", "pending", startOfDay(now + 3 * 86400000L), null);
    }

    private EditText input(String hint) {
        EditText input = new EditText(this);
        input.setHint(hint);
        input.setSingleLine(true);
        input.setTextSize(15);
        input.setTextColor(textColor());
        input.setHintTextColor(mutedColor());
        input.setPadding(0, dp(8), 0, dp(8));
        return input;
    }

    private Spinner buildSpinner(String[] values) {
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_item, values);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        Spinner spinner = new Spinner(this);
        spinner.setAdapter(adapter);
        spinner.setBackground(rounded(cardColor(), borderColor(), 10));
        return spinner;
    }

    private Button primaryButton(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextColor(Color.WHITE);
        button.setTextSize(14);
        button.setAllCaps(false);
        button.setBackground(rounded(accentColor(), accentColor(), 9));
        return button;
    }

    private Button secondaryButton(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextColor(accentColor());
        button.setTextSize(14);
        button.setAllCaps(false);
        button.setBackground(rounded(accentSoftColor(), accentSoftColor(), 9));
        return button;
    }

    private Button smallDangerButton(String text) {
        Button button = new Button(this);
        button.setText(text);
        button.setTextColor(DANGER);
        button.setTextSize(11);
        button.setAllCaps(false);
        button.setPadding(dp(10), 0, dp(10), 0);
        button.setBackground(rounded(Color.rgb(255, 241, 242), Color.rgb(255, 241, 242), 9));
        return button;
    }

    private TextView iconButton(String text, int color, int background, String description) {
        TextView button = new TextView(this);
        button.setText(text);
        button.setTextColor(color);
        button.setGravity(Gravity.CENTER);
        button.setTypeface(Typeface.DEFAULT_BOLD);
        button.setBackground(rounded(background, background, 10));
        button.setContentDescription(description);
        button.setClickable(true);
        button.setFocusable(true);
        return button;
    }

    private View actionIconButton(int iconType, int color, int background, String description) {
        View button = new ActionIconView(this, iconType, color);
        button.setBackground(rounded(background, background, 10));
        button.setContentDescription(description);
        button.setClickable(true);
        button.setFocusable(true);
        return button;
    }

    private LinearLayout.LayoutParams actionIconLayoutParams() {
        int size = dp(TaskCardLayoutMetrics.ACTION_ICON_SIZE_DP);
        return new LinearLayout.LayoutParams(size, size);
    }

    private LinearLayout.LayoutParams actionSpacerLayoutParams() {
        return new LinearLayout.LayoutParams(
            dp(TaskCardLayoutMetrics.ACTION_RAIL_WIDTH_DP),
            dp(TaskCardLayoutMetrics.ACTION_ICON_GAP_DP),
            1
        );
    }

    private void styleModeButton(Button button, boolean active) {
        button.setTextColor(active ? Color.WHITE : accentColor());
        button.setBackground(active
            ? rounded(accentColor(), accentColor(), 9)
            : rounded(accentSoftColor(), accentSoftColor(), 9));
    }

    private TextView chip(String text, int background, int color) {
        TextView chip = new TextView(this);
        chip.setText(text);
        chip.setTextColor(color);
        chip.setTextSize(10);
        chip.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        chip.setGravity(Gravity.CENTER);
        chip.setSingleLine(true);
        chip.setPadding(dp(7), dp(3), dp(7), dp(3));
        chip.setBackground(rounded(background, background, 12));
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        params.setMargins(0, 0, dp(5), 0);
        chip.setLayoutParams(params);
        return chip;
    }

    private GradientDrawable rounded(int color, int strokeColor, int radiusDp) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setShape(GradientDrawable.RECTANGLE);
        drawable.setColor(color);
        drawable.setCornerRadius(dp(radiusDp));
        if (strokeColor != color) drawable.setStroke(dp(1), strokeColor);
        return drawable;
    }

    private GradientDrawable oval(int color, int strokeColor, int strokeDp) {
        GradientDrawable drawable = new GradientDrawable();
        drawable.setShape(GradientDrawable.OVAL);
        drawable.setColor(color);
        drawable.setStroke(dp(strokeDp), strokeColor);
        return drawable;
    }

    private void sortVisibleTasks(List<Task> tasks) {
        tasks.sort((left, right) -> {
            if (showArchive) return Long.compare(right.updatedAt, left.updatedAt);
            int priority = Integer.compare(priorityRank(left.priority), priorityRank(right.priority));
            if (priority != 0) return priority;
            int due = Long.compare(dueSortValue(left), dueSortValue(right));
            if (due != 0) return due;
            return Long.compare(right.createdAt, left.createdAt);
        });
    }

    private int priorityRank(String priority) {
        if ("high".equals(priority)) return 0;
        if ("medium".equals(priority)) return 1;
        return 2;
    }

    private long dueSortValue(Task task) {
        if (task.dueDate == null) return Long.MAX_VALUE;
        long value = task.dueDate;
        if (task.dueTimeMinutes != null) value += task.dueTimeMinutes * 60_000L;
        return value;
    }

    private int transparentPriority(String priority) {
        if ("high".equals(priority)) return darkTheme ? Color.rgb(72, 37, 42) : Color.rgb(254, 242, 242);
        if ("low".equals(priority)) return darkTheme ? Color.rgb(22, 67, 55) : Color.rgb(236, 253, 245);
        return darkTheme ? Color.rgb(74, 58, 25) : Color.rgb(255, 251, 235);
    }

    private int statusBg(String status) {
        if ("done".equals(status)) return darkTheme ? Color.rgb(22, 67, 55) : STATUS_GREEN_BG;
        if ("in_progress".equals(status)) return darkTheme ? Color.rgb(20, 57, 82) : STATUS_BLUE_BG;
        return chipColor();
    }

    private int statusColor(String status) {
        if ("done".equals(status)) return STATUS_GREEN;
        if ("in_progress".equals(status)) return STATUS_BLUE;
        return mutedColor();
    }

    private int statusDotBg(String status) {
        if ("done".equals(status)) return COMPLETE_GREEN;
        if ("in_progress".equals(status)) return Color.rgb(14, 165, 233);
        return Color.TRANSPARENT;
    }

    private int statusDotBorder(String status) {
        if ("done".equals(status)) return COMPLETE_GREEN;
        if ("in_progress".equals(status)) return Color.rgb(14, 165, 233);
        return COMPLETE_GREEN;
    }

    private int statusDotText(String status) {
        if ("pending".equals(status)) return Color.TRANSPARENT;
        return Color.WHITE;
    }

    private String statusMark(String status) {
        if ("done".equals(status)) return "✓";
        if ("in_progress".equals(status)) return "–";
        return "";
    }

    private String statusLabel(String status) {
        if ("done".equals(status)) return "Готово";
        if ("in_progress".equals(status)) return "В работе";
        return "Ожидает";
    }

    private String priorityLabel(String priority) {
        if ("high".equals(priority)) return "Высокий";
        if ("low".equals(priority)) return "Низкий";
        return "Средний";
    }

    private int priorityColor(String priority) {
        if ("high".equals(priority)) return DANGER;
        if ("low".equals(priority)) return COMPLETE_GREEN;
        return Color.rgb(245, 158, 11);
    }

    private String spinnerPriority(int position) {
        if (position == 0) return "high";
        if (position == 2) return "low";
        return "medium";
    }

    private String formatDue(Task task) {
        String date = formatDateOnly(task.dueDate);
        return task.dueTimeMinutes == null ? date : date + " · " + formatTime(task.dueTimeMinutes);
    }

    private String formatDateOnly(long millis) {
        return new SimpleDateFormat("EEE, d MMM", new Locale("ru", "RU")).format(millis);
    }

    private String formatTime(int minutes) {
        return String.format(new Locale("ru", "RU"), "%02d:%02d", minutes / 60, minutes % 60);
    }

    private long startOfDay(long millis) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(millis);
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
    }

    private Integer timeMinutesFromMillis(Long millis) {
        if (millis == null) return null;
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(millis);
        int hours = calendar.get(Calendar.HOUR_OF_DAY);
        int minutes = calendar.get(Calendar.MINUTE);
        return hours == 0 && minutes == 0 ? null : hours * 60 + minutes;
    }

    private long startOfToday() {
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
    }

    private int bgColor() {
        return darkTheme ? DARK_BG : LIGHT_BG;
    }

    private int cardColor() {
        return darkTheme ? DARK_CARD : LIGHT_CARD;
    }

    private int borderColor() {
        return darkTheme ? DARK_BORDER : LIGHT_BORDER;
    }

    private int textColor() {
        return darkTheme ? DARK_TEXT : LIGHT_TEXT;
    }

    private int mutedColor() {
        return darkTheme ? DARK_MUTED : LIGHT_MUTED;
    }

    private int chipColor() {
        return darkTheme ? DARK_CHIP : LIGHT_CHIP;
    }

    private int accentColor() {
        return darkTheme ? ACCENT_DARK : ACCENT;
    }

    private int accentSoftColor() {
        return darkTheme ? ACCENT_SOFT_DARK : ACCENT_SOFT;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private static final class ChamferedDrawable extends Drawable {
        private final Paint fillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint strokePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Path path = new Path();
        private final float strokeWidth;
        private final float cut;

        ChamferedDrawable(int fill, int stroke, float strokeWidth, float cut) {
            this.strokeWidth = strokeWidth;
            this.cut = cut;
            fillPaint.setStyle(Paint.Style.FILL);
            fillPaint.setColor(fill);
            strokePaint.setStyle(Paint.Style.STROKE);
            strokePaint.setStrokeWidth(strokeWidth);
            strokePaint.setColor(stroke);
        }

        @Override
        public void draw(Canvas canvas) {
            float left = getBounds().left + strokeWidth / 2f;
            float top = getBounds().top + strokeWidth / 2f;
            float right = getBounds().right - strokeWidth / 2f;
            float bottom = getBounds().bottom - strokeWidth / 2f;
            path.reset();
            path.moveTo(left + cut, top);
            path.lineTo(right - cut, top);
            path.lineTo(right, top + cut);
            path.lineTo(right, bottom - cut);
            path.lineTo(right - cut, bottom);
            path.lineTo(left + cut, bottom);
            path.lineTo(left, bottom - cut);
            path.lineTo(left, top + cut);
            path.close();
            canvas.drawPath(path, fillPaint);
            canvas.drawPath(path, strokePaint);
        }

        @Override
        public void setAlpha(int alpha) {
            fillPaint.setAlpha(alpha);
            strokePaint.setAlpha(alpha);
        }

        @Override
        public void setColorFilter(ColorFilter colorFilter) {
            fillPaint.setColorFilter(colorFilter);
            strokePaint.setColorFilter(colorFilter);
        }

        @Override
        public int getOpacity() {
            return PixelFormat.TRANSLUCENT;
        }
    }

    private static final class ActionIconView extends View {
        private final int iconType;
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);

        ActionIconView(Context context, int iconType, int color) {
            super(context);
            this.iconType = iconType;
            paint.setColor(color);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeCap(Paint.Cap.ROUND);
            paint.setStrokeJoin(Paint.Join.ROUND);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            float width = getWidth();
            float height = getHeight();
            float min = Math.min(width, height);
            float left = (width - min) / 2f + min * 0.25f;
            float top = (height - min) / 2f + min * 0.25f;
            float right = width - (width - min) / 2f - min * 0.25f;
            float bottom = height - (height - min) / 2f - min * 0.25f;
            paint.setStrokeWidth(Math.max(2f, min * 0.07f));

            if (iconType == ICON_DELETE) {
                drawDelete(canvas, left, top, right, bottom);
            } else if (iconType == ICON_EDIT) {
                drawEdit(canvas, left, top, right, bottom);
            } else {
                drawRestore(canvas, left, top, right, bottom);
            }
        }

        private void drawDelete(Canvas canvas, float left, float top, float right, float bottom) {
            float w = right - left;
            float h = bottom - top;
            canvas.drawLine(left - w * 0.08f, top + h * 0.2f, right + w * 0.08f, top + h * 0.2f, paint);
            canvas.drawLine(left + w * 0.28f, top, right - w * 0.28f, top, paint);
            canvas.drawLine(left + w * 0.38f, top, left + w * 0.38f, top + h * 0.2f, paint);
            canvas.drawLine(right - w * 0.38f, top, right - w * 0.38f, top + h * 0.2f, paint);
            canvas.drawLine(left + w * 0.08f, top + h * 0.2f, left + w * 0.18f, bottom, paint);
            canvas.drawLine(right - w * 0.08f, top + h * 0.2f, right - w * 0.18f, bottom, paint);
            canvas.drawLine(left + w * 0.18f, bottom, right - w * 0.18f, bottom, paint);
            canvas.drawLine(left + w * 0.42f, top + h * 0.43f, left + w * 0.42f, bottom - h * 0.18f, paint);
            canvas.drawLine(right - w * 0.42f, top + h * 0.43f, right - w * 0.42f, bottom - h * 0.18f, paint);
        }

        private void drawEdit(Canvas canvas, float left, float top, float right, float bottom) {
            float w = right - left;
            float h = bottom - top;
            Path page = new Path();
            page.moveTo(left + w * 0.08f, top);
            page.lineTo(right - w * 0.22f, top);
            page.lineTo(right, top + h * 0.22f);
            page.lineTo(right, bottom);
            page.lineTo(left + w * 0.08f, bottom);
            page.close();
            canvas.drawPath(page, paint);
            canvas.drawLine(right - w * 0.22f, top, right - w * 0.22f, top + h * 0.22f, paint);
            canvas.drawLine(right - w * 0.22f, top + h * 0.22f, right, top + h * 0.22f, paint);
            canvas.drawLine(left + w * 0.35f, bottom - h * 0.15f, right + w * 0.04f, top + h * 0.46f, paint);
            canvas.drawLine(right + w * 0.04f, top + h * 0.46f, right - w * 0.1f, top + h * 0.32f, paint);
            canvas.drawLine(left + w * 0.35f, bottom - h * 0.15f, left + w * 0.22f, bottom - h * 0.02f, paint);
        }

        private void drawRestore(Canvas canvas, float left, float top, float right, float bottom) {
            float w = right - left;
            float h = bottom - top;
            canvas.drawLine(left, top + h * 0.45f, left + w * 0.35f, top + h * 0.12f, paint);
            canvas.drawLine(left, top + h * 0.45f, left + w * 0.35f, top + h * 0.78f, paint);
            Path curve = new Path();
            curve.moveTo(left + w * 0.05f, top + h * 0.45f);
            curve.cubicTo(left + w * 0.55f, top + h * 0.42f, right, top + h * 0.55f, right - w * 0.18f, bottom);
            canvas.drawPath(curve, paint);
        }
    }
}
