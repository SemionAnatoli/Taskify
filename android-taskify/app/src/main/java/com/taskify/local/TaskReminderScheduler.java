package com.taskify.local;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

final class TaskReminderScheduler {
    static final String CHANNEL_ID = "task_deadlines";
    static final String EXTRA_TASK_ID = "task_id";
    static final String EXTRA_DATE_ONLY_SUMMARY = "date_only_summary";

    private static final long REMIND_BEFORE_MS = 60L * 60L * 1000L;
    private static final long MIN_DELAY_MS = 5_000L;
    private static final int DATE_ONLY_SUMMARY_REQUEST = 80_800;

    private TaskReminderScheduler() {}

    static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Сроки задач",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("Напоминания о сроках и утренняя сводка задач");
        manager.createNotificationChannel(channel);
    }

    static void schedule(Context context, Task task) {
        cancel(context, task.id);
        if (task.isDone() || task.dueDate == null || task.dueTimeMinutes == null) return;

        long dueAt = task.dueDate + task.dueTimeMinutes * 60_000L;
        long now = System.currentTimeMillis();
        if (dueAt <= now) return;

        long triggerAt = dueAt - REMIND_BEFORE_MS;
        if (triggerAt <= now) triggerAt = now + MIN_DELAY_MS;

        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        alarmManager.setWindow(
            AlarmManager.RTC_WAKEUP,
            triggerAt,
            10L * 60L * 1000L,
            pendingIntent(context, task.id)
        );
    }

    static void cancel(Context context, String taskId) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;
        alarmManager.cancel(pendingIntent(context, taskId));
    }

    static void scheduleDateOnlySummary(Context context) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager == null) return;

        long triggerAt = nextEightInMorning();
        alarmManager.setWindow(
            AlarmManager.RTC_WAKEUP,
            triggerAt,
            15L * 60L * 1000L,
            summaryPendingIntent(context)
        );
    }

    private static PendingIntent pendingIntent(Context context, String taskId) {
        Intent intent = new Intent(context, TaskReminderReceiver.class);
        intent.putExtra(EXTRA_TASK_ID, taskId);
        return PendingIntent.getBroadcast(
            context,
            taskId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static PendingIntent summaryPendingIntent(Context context) {
        Intent intent = new Intent(context, TaskReminderReceiver.class);
        intent.putExtra(EXTRA_DATE_ONLY_SUMMARY, true);
        return PendingIntent.getBroadcast(
            context,
            DATE_ONLY_SUMMARY_REQUEST,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static long nextEightInMorning() {
        java.util.Calendar calendar = java.util.Calendar.getInstance();
        long now = System.currentTimeMillis();
        calendar.setTimeInMillis(now);
        calendar.set(java.util.Calendar.HOUR_OF_DAY, 8);
        calendar.set(java.util.Calendar.MINUTE, 0);
        calendar.set(java.util.Calendar.SECOND, 0);
        calendar.set(java.util.Calendar.MILLISECOND, 0);
        if (calendar.getTimeInMillis() <= now) {
            calendar.add(java.util.Calendar.DAY_OF_YEAR, 1);
        }
        return calendar.getTimeInMillis();
    }
}
