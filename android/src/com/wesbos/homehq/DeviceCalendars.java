package com.wesbos.homehq;

import android.content.ContentResolver;
import android.content.ContentUris;
import android.database.Cursor;
import android.net.Uri;
import android.provider.CalendarContract.Calendars;
import android.provider.CalendarContract.Instances;
import java.util.ArrayList;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Read-only view of DAVx5 and ICSx5 synchronized calendars. */
final class DeviceCalendars {
  private static final String ACCOUNT_TYPE = "bitfire.at.davdroid";
  private static final String[] COLORS = {"#547d91", "#9a513b", "#687354", "#916980", "#ad7937"};

  static JSONArray sources(ContentResolver resolver) throws JSONException {
    JSONArray sources = new JSONArray();
    String[] columns = {Calendars._ID, Calendars.CALENDAR_DISPLAY_NAME};
    try (Cursor rows = resolver.query(Calendars.CONTENT_URI, columns,
        Calendars.ACCOUNT_TYPE + " IN (?,?)", new String[]{ACCOUNT_TYPE, "at.bitfire.icsdroid"}, Calendars._ID + " ASC")) {
      while (rows != null && rows.moveToNext()) {
        long id = rows.getLong(0);
        String name = rows.getString(1);
        sources.put(new JSONObject().put("id", "davx:" + id)
            .put("name", name == null || name.trim().isEmpty() ? "Calendar" : name)
            .put("color", COLORS[sources.length() % COLORS.length]).put("device", true));
      }
    }
    return sources;
  }

  static JSONArray events(ContentResolver resolver, long begin, long end) throws JSONException {
    if (begin < 0 || end <= begin || end - begin > 80L * 86400000L) {
      throw new IllegalArgumentException("Invalid calendar range");
    }
    JSONArray calendars = sources(resolver);
    JSONArray events = new JSONArray();
    if (calendars.length() == 0) return events;

    ArrayList<String> ids = new ArrayList<>();
    ArrayList<String> parameters = new ArrayList<>();
    for (int i = 0; i < calendars.length(); i++) {
      ids.add(calendars.getJSONObject(i).getString("id").substring(5));
      parameters.add("?");
    }
    Uri.Builder uri = Instances.CONTENT_URI.buildUpon();
    ContentUris.appendId(uri, begin);
    ContentUris.appendId(uri, end);
    String[] columns = {Instances.CALENDAR_ID, Instances.EVENT_ID, Instances.BEGIN,
        Instances.END, Instances.ALL_DAY, Instances.TITLE, Instances.EVENT_LOCATION};
    try (Cursor rows = resolver.query(uri.build(), columns,
        Instances.CALENDAR_ID + " IN (" + android.text.TextUtils.join(",", parameters) + ")",
        ids.toArray(new String[0]), Instances.BEGIN + " ASC")) {
      while (rows != null && rows.moveToNext()) {
        long start = rows.getLong(2);
        events.put(new JSONObject().put("source", "davx:" + rows.getLong(0))
            .put("key", rows.getLong(1) + ":" + start).put("start", start)
            .put("end", rows.getLong(3)).put("allDay", rows.getInt(4) != 0)
            .put("title", text(rows.getString(5), "Untitled event", 500))
            .put("location", text(rows.getString(6), "", 1000))
            .put("description", "").put("organizer", ""));
      }
    }
    return events;
  }

  private static String text(String value, String fallback, int limit) {
    return value == null || value.isEmpty() ? fallback : value.substring(0, Math.min(value.length(), limit));
  }
}
