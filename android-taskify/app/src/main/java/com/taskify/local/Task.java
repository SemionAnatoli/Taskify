package com.taskify.local;

final class Task {
    String id;
    String title;
    String description;
    String category;
    String priority;
    String status;
    Long dueDate;
    Integer dueTimeMinutes;
    long createdAt;
    long updatedAt;

    boolean isDone() {
        return "done".equals(status);
    }

    boolean isOverdue(long now, long startOfToday) {
        if (dueDate == null || isDone()) return false;
        if (dueDate < startOfToday) return true;
        if (dueTimeMinutes == null || dueDate > startOfToday) return false;
        return dueDate + dueTimeMinutes * 60_000L < now;
    }
}
