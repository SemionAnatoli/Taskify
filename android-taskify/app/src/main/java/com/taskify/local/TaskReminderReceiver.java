package com.taskify.local;

import android.Manifest;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

public final class TaskReminderReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent.getBooleanExtra(TaskReminderScheduler.EXTRA_DATE_ONLY_SUMMARY, false)) {
            showDateOnlySummary(context);
            TaskReminderScheduler.scheduleDateOnlySummary(context);
            return;
        }

        String taskId = intent.getStringExtra(TaskReminderScheduler.EXTRA_TASK_ID);
        if (taskId == null) return;

        TaskReminderScheduler.ensureChannel(context);

        TaskDbHelper db = new TaskDbHelper(context);
        Task task = db.getTask(taskId);
        if (task == null || task.isDone() || task.dueDate == null || task.dueTimeMinutes == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
            context,
            task.id.hashCode(),
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        android.app.Notification notification = new android.app.Notification.Builder(context, TaskReminderScheduler.CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Скоро срок задачи")
            .setContentText(task.title)
            .setContentIntent(contentIntent)
            .setAutoCancel(true)
            .build();

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(task.id.hashCode(), notification);
        }
    }

    private void showDateOnlySummary(Context context) {
        TaskReminderScheduler.ensureChannel(context);

        if (!canPostNotifications(context)) return;

        TaskDbHelper db = new TaskDbHelper(context);
        List<Task> dueToday = new ArrayList<>();
        long today = startOfToday();
        for (Task task : db.getTasks("", "", "")) {
            if (!task.isDone() && task.dueDate != null && task.dueTimeMinutes == null && task.dueDate == today) {
                dueToday.add(task);
            }
        }
        if (dueToday.isEmpty()) return;

        Intent openIntent = new Intent(context, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
            context,
            80800,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String text = summaryText(dueToday);
        android.app.Notification.Builder builder = new android.app.Notification.Builder(context, TaskReminderScheduler.CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Сегодня задач: " + dueToday.size())
            .setContentText(text)
            .setContentIntent(contentIntent)
            .setAutoCancel(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
            builder.setStyle(new android.app.Notification.BigTextStyle().bigText(text));
        }

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(80800, builder.build());
        }
    }

    private boolean canPostNotifications(Context context) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private String summaryText(List<Task> tasks) {
        StringBuilder builder = new StringBuilder();
        int limit = Math.min(tasks.size(), 4);
        for (int i = 0; i < limit; i++) {
            if (i > 0) builder.append("; ");
            builder.append(tasks.get(i).title);
        }
        if (tasks.size() > limit) {
            builder.append("; еще ").append(tasks.size() - limit);
        }
        return builder.toString();
    }

    private long startOfToday() {
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
    }
}
