package com.taskify.local;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;

import org.junit.Test;

import java.util.Calendar;

public final class QuickTaskParserTest {
    private final long baseMillis = baseMillis();

    @Test
    public void parsesTomorrowTimeAndHighPriority() {
        QuickTaskParser.Result result = QuickTaskParser.parse("позвонить врачу завтра 15:00 высокий", baseMillis);

        assertEquals("позвонить врачу", result.title);
        assertEquals("high", result.priority);
        assertEquals(startOfDayOffset(1), result.dueDate.longValue());
        assertEquals(15 * 60, result.dueTimeMinutes.intValue());
    }

    @Test
    public void parsesDayAfterTomorrowAndLowPriority() {
        QuickTaskParser.Result result = QuickTaskParser.parse("разобрать заметки послезавтра низкий", baseMillis);

        assertEquals("разобрать заметки", result.title);
        assertEquals("low", result.priority);
        assertEquals(startOfDayOffset(2), result.dueDate.longValue());
        assertNull(result.dueTimeMinutes);
    }

    @Test
    public void parsesTodayTimeWithPrepositionAndImportantPriority() {
        QuickTaskParser.Result result = QuickTaskParser.parse("созвон сегодня к 9:05 важный", baseMillis);

        assertEquals("созвон", result.title);
        assertEquals("high", result.priority);
        assertEquals(startOfDayOffset(0), result.dueDate.longValue());
        assertEquals(9 * 60 + 5, result.dueTimeMinutes.intValue());
    }

    @Test
    public void fallsBackToMediumPriorityAndNoDate() {
        QuickTaskParser.Result result = QuickTaskParser.parse("купить продукты", baseMillis);

        assertEquals("купить продукты", result.title);
        assertEquals("medium", result.priority);
        assertNull(result.dueDate);
        assertNull(result.dueTimeMinutes);
    }

    @Test
    public void emptyTextCreatesDefaultTitle() {
        QuickTaskParser.Result result = QuickTaskParser.parse("   ", baseMillis);

        assertEquals("Новая задача", result.title);
        assertEquals("medium", result.priority);
        assertNull(result.dueDate);
        assertNull(result.dueTimeMinutes);
    }

    private static long baseMillis() {
        Calendar calendar = Calendar.getInstance();
        calendar.set(2026, Calendar.MAY, 30, 13, 20, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        return calendar.getTimeInMillis();
    }

    private long startOfDayOffset(int days) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(baseMillis);
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        calendar.add(Calendar.DAY_OF_YEAR, days);
        return calendar.getTimeInMillis();
    }
}
