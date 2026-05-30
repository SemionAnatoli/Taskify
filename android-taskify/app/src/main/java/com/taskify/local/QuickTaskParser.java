package com.taskify.local;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class QuickTaskParser {
    private static final Pattern HIGH_PRIORITY = wordPattern("высокий|высокая|важный|важная|важное");
    private static final Pattern MEDIUM_PRIORITY = wordPattern("средний|средняя|обычный|обычная");
    private static final Pattern LOW_PRIORITY = wordPattern("низкий|низкая|низкое");
    private static final Pattern TODAY = wordPattern("сегодня");
    private static final Pattern TOMORROW = wordPattern("завтра");
    private static final Pattern DAY_AFTER_TOMORROW = wordPattern("послезавтра");
    private static final Pattern TIME = Pattern.compile("(^|\\s)(?:[кв]\\s+)?(\\d{1,2}):(\\d{2})(?=\\s|$)", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private QuickTaskParser() {}

    static Result parse(String input, long nowMillis) {
        String text = normalizeSpaces(input);
        List<Span> spans = new ArrayList<>();

        String priority = "medium";
        if (addFirst(spans, HIGH_PRIORITY, text)) {
            priority = "high";
        } else if (addFirst(spans, LOW_PRIORITY, text)) {
            priority = "low";
        } else if (addFirst(spans, MEDIUM_PRIORITY, text)) {
            priority = "medium";
        }

        Long dueDate = null;
        if (addFirst(spans, DAY_AFTER_TOMORROW, text)) {
            dueDate = startOfDay(nowMillis, 2);
        } else if (addFirst(spans, TOMORROW, text)) {
            dueDate = startOfDay(nowMillis, 1);
        } else if (addFirst(spans, TODAY, text)) {
            dueDate = startOfDay(nowMillis, 0);
        }

        Integer dueTimeMinutes = null;
        Matcher timeMatcher = TIME.matcher(text);
        if (timeMatcher.find()) {
            int hours = Integer.parseInt(timeMatcher.group(2));
            int minutes = Integer.parseInt(timeMatcher.group(3));
            if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                dueTimeMinutes = hours * 60 + minutes;
                spans.add(new Span(timeMatcher.start(), timeMatcher.end()));
            }
        }

        String title = removeSpans(text, spans);
        if (title.isEmpty()) title = "Новая задача";

        Result result = new Result();
        result.title = title;
        result.priority = priority;
        result.dueDate = dueDate;
        result.dueTimeMinutes = dueDate == null ? null : dueTimeMinutes;
        return result;
    }

    private static Pattern wordPattern(String alternatives) {
        return Pattern.compile("(^|\\s)(" + alternatives + ")(?=\\s|$)", Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
    }

    private static boolean addFirst(List<Span> spans, Pattern pattern, String text) {
        Matcher matcher = pattern.matcher(text);
        if (!matcher.find()) return false;
        spans.add(new Span(matcher.start(), matcher.end()));
        return true;
    }

    private static String normalizeSpaces(String input) {
        if (input == null) return "";
        return input.trim().replaceAll("\\s+", " ");
    }

    private static String removeSpans(String text, List<Span> spans) {
        StringBuilder builder = new StringBuilder(text);
        spans.sort(Comparator.comparingInt((Span span) -> span.start).reversed());
        for (Span span : spans) {
            builder.delete(span.start, span.end);
        }
        return builder.toString()
            .replaceAll("\\s+", " ")
            .replaceAll("^[,.;: ]+", "")
            .replaceAll("[,.;: ]+$", "")
            .trim();
    }

    private static long startOfDay(long millis, int dayOffset) {
        Calendar calendar = Calendar.getInstance(Locale.forLanguageTag("ru-RU"));
        calendar.setTimeInMillis(millis);
        calendar.set(Calendar.HOUR_OF_DAY, 0);
        calendar.set(Calendar.MINUTE, 0);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        calendar.add(Calendar.DAY_OF_YEAR, dayOffset);
        return calendar.getTimeInMillis();
    }

    static final class Result {
        String title;
        String priority;
        Long dueDate;
        Integer dueTimeMinutes;
    }

    private static final class Span {
        final int start;
        final int end;

        Span(int start, int end) {
            this.start = start;
            this.end = end;
        }
    }
}
