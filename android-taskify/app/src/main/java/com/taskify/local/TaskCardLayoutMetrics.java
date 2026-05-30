package com.taskify.local;

final class TaskCardLayoutMetrics {
    static final int ACTION_ICON_SIZE_DP = 30;
    static final int ACTION_RAIL_WIDTH_DP = 32;
    static final int ACTION_ICON_GAP_DP = 6;
    static final int ACTION_RAIL_VERTICAL_INSET_DP = 3;
    static final int BODY_VERTICAL_PADDING_DP = 8;
    static final int ACTION_RAIL_MIN_HEIGHT_DP = ACTION_ICON_SIZE_DP * 2
        + ACTION_ICON_GAP_DP
        + ACTION_RAIL_VERTICAL_INSET_DP * 2;
    static final int TASK_BODY_MIN_HEIGHT_DP = ACTION_RAIL_MIN_HEIGHT_DP
        + BODY_VERTICAL_PADDING_DP * 2;

    private TaskCardLayoutMetrics() {
    }
}
