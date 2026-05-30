package com.taskify.local;

import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

public class TaskCardLayoutMetricsTest {
    @Test
    public void actionRailHasEnoughHeightForBothIcons() {
        int requiredHeight = TaskCardLayoutMetrics.ACTION_ICON_SIZE_DP * 2
            + TaskCardLayoutMetrics.ACTION_ICON_GAP_DP
            + TaskCardLayoutMetrics.ACTION_RAIL_VERTICAL_INSET_DP * 2;

        assertEquals(requiredHeight, TaskCardLayoutMetrics.ACTION_RAIL_MIN_HEIGHT_DP);
        assertTrue(TaskCardLayoutMetrics.ACTION_RAIL_MIN_HEIGHT_DP >= 70);
    }

    @Test
    public void taskBodyReservesSafeHeightForActionRail() {
        int requiredBodyHeight = TaskCardLayoutMetrics.ACTION_RAIL_MIN_HEIGHT_DP
            + TaskCardLayoutMetrics.BODY_VERTICAL_PADDING_DP * 2;

        assertEquals(requiredBodyHeight, TaskCardLayoutMetrics.TASK_BODY_MIN_HEIGHT_DP);
        assertTrue(TaskCardLayoutMetrics.ACTION_RAIL_WIDTH_DP >= TaskCardLayoutMetrics.ACTION_ICON_SIZE_DP);
    }
}
