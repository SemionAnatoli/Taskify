package com.taskify.local;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

final class TaskDbHelper extends SQLiteOpenHelper {
    private static final String DB_NAME = "taskify.db";
    private static final int DB_VERSION = 2;

    TaskDbHelper(Context context) {
        super(context, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(
            "CREATE TABLE tasks (" +
                "id TEXT PRIMARY KEY, " +
                "title TEXT NOT NULL, " +
                "description TEXT, " +
                "category TEXT, " +
                "priority TEXT NOT NULL DEFAULT 'medium', " +
                "status TEXT NOT NULL DEFAULT 'pending', " +
                "due_date INTEGER, " +
                "due_time_minutes INTEGER, " +
                "created_at INTEGER NOT NULL, " +
                "updated_at INTEGER NOT NULL" +
            ")"
        );
        db.execSQL("CREATE INDEX idx_tasks_status ON tasks(status)");
        db.execSQL("CREATE INDEX idx_tasks_priority ON tasks(priority)");
        db.execSQL("CREATE INDEX idx_tasks_due_date ON tasks(due_date)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        if (oldVersion < 2) {
            db.execSQL("ALTER TABLE tasks ADD COLUMN due_time_minutes INTEGER");
        }
    }

    List<Task> getTasks(String status, String priority, String search) {
        List<String> where = new ArrayList<>();
        List<String> args = new ArrayList<>();

        if (status != null && !status.isEmpty()) {
            where.add("status = ?");
            args.add(status);
        }

        if (priority != null && !priority.isEmpty()) {
            where.add("priority = ?");
            args.add(priority);
        }

        if (search != null && !search.trim().isEmpty()) {
            where.add("(LOWER(title) LIKE ? OR LOWER(COALESCE(description, '')) LIKE ?)");
            String value = "%" + search.trim().toLowerCase() + "%";
            args.add(value);
            args.add(value);
        }

        String selection = where.isEmpty() ? null : String.join(" AND ", where);
        String[] selectionArgs = args.isEmpty() ? null : args.toArray(new String[0]);

        try (Cursor cursor = getReadableDatabase().query(
            "tasks",
            null,
            selection,
            selectionArgs,
            null,
            null,
            "created_at DESC"
        )) {
            List<Task> tasks = new ArrayList<>();
            while (cursor.moveToNext()) {
                tasks.add(readTask(cursor));
            }
            return tasks;
        }
    }

    Task getTask(String id) {
        try (Cursor cursor = getReadableDatabase().query(
            "tasks",
            null,
            "id = ?",
            new String[] { id },
            null,
            null,
            null
        )) {
            return cursor.moveToFirst() ? readTask(cursor) : null;
        }
    }

    Task createTask(String title, String description, String category, String priority, String status, Long dueDate, Integer dueTimeMinutes) {
        long now = System.currentTimeMillis();
        Task task = new Task();
        task.id = UUID.randomUUID().toString();
        task.title = cleanTitle(title);
        task.description = cleanOptional(description);
        task.category = cleanOptional(category);
        task.priority = normalizePriority(priority);
        task.status = normalizeStatus(status);
        task.dueDate = dueDate;
        task.dueTimeMinutes = dueTimeMinutes;
        task.createdAt = now;
        task.updatedAt = now;

        getWritableDatabase().insertOrThrow("tasks", null, toValues(task));
        return task;
    }

    void updateTask(Task task) {
        task.title = cleanTitle(task.title);
        task.description = cleanOptional(task.description);
        task.category = cleanOptional(task.category);
        task.priority = normalizePriority(task.priority);
        task.status = normalizeStatus(task.status);
        task.updatedAt = System.currentTimeMillis();

        getWritableDatabase().update("tasks", toValues(task), "id = ?", new String[] { task.id });
    }

    void deleteTask(String id) {
        getWritableDatabase().delete("tasks", "id = ?", new String[] { id });
    }

    private ContentValues toValues(Task task) {
        ContentValues values = new ContentValues();
        values.put("id", task.id);
        values.put("title", task.title);
        values.put("description", task.description);
        values.put("category", task.category);
        values.put("priority", task.priority);
        values.put("status", task.status);
        if (task.dueDate == null) {
            values.putNull("due_date");
        } else {
            values.put("due_date", task.dueDate);
        }
        if (task.dueTimeMinutes == null) {
            values.putNull("due_time_minutes");
        } else {
            values.put("due_time_minutes", task.dueTimeMinutes);
        }
        values.put("created_at", task.createdAt);
        values.put("updated_at", task.updatedAt);
        return values;
    }

    private Task readTask(Cursor cursor) {
        Task task = new Task();
        task.id = cursor.getString(cursor.getColumnIndexOrThrow("id"));
        task.title = cursor.getString(cursor.getColumnIndexOrThrow("title"));
        task.description = cursor.getString(cursor.getColumnIndexOrThrow("description"));
        task.category = cursor.getString(cursor.getColumnIndexOrThrow("category"));
        task.priority = cursor.getString(cursor.getColumnIndexOrThrow("priority"));
        task.status = cursor.getString(cursor.getColumnIndexOrThrow("status"));

        int dueIndex = cursor.getColumnIndexOrThrow("due_date");
        task.dueDate = cursor.isNull(dueIndex) ? null : cursor.getLong(dueIndex);
        int dueTimeIndex = cursor.getColumnIndex("due_time_minutes");
        task.dueTimeMinutes = dueTimeIndex < 0 || cursor.isNull(dueTimeIndex) ? null : cursor.getInt(dueTimeIndex);
        task.createdAt = cursor.getLong(cursor.getColumnIndexOrThrow("created_at"));
        task.updatedAt = cursor.getLong(cursor.getColumnIndexOrThrow("updated_at"));
        return task;
    }

    private static String cleanTitle(String title) {
        String value = title == null ? "" : title.trim();
        return value.isEmpty() ? "Новая задача" : value;
    }

    private static String cleanOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String normalizePriority(String value) {
        if ("low".equals(value) || "medium".equals(value) || "high".equals(value)) return value;
        return "medium";
    }

    private static String normalizeStatus(String value) {
        if ("pending".equals(value) || "in_progress".equals(value) || "done".equals(value)) return value;
        return "pending";
    }
}
