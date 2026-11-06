package com.wesbos.homehq;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONArray;
import org.json.JSONObject;

final class RuterDepartures {
  private static final String ENDPOINT = "https://api.entur.io/journey-planner/v3/graphql";
  private static final String QUERY = "{ stopPlace(id: \"NSR:StopPlace:4479\") { "
      + "estimatedCalls(timeRange: 14400, numberOfDepartures: 20) { forBoarding realtime "
      + "expectedDepartureTime aimedDepartureTime destinationDisplay { frontText } "
      + "serviceJourney { journeyPattern { line { id publicCode transportMode } } } } } }";

  static String fetch() {
    HttpURLConnection connection = null;
    try {
      connection = (HttpURLConnection) new URL(ENDPOINT).openConnection();
      connection.setInstanceFollowRedirects(false);
      connection.setConnectTimeout(8000);
      connection.setReadTimeout(8000);
      connection.setRequestMethod("POST");
      connection.setRequestProperty("Content-Type", "application/json");
      connection.setRequestProperty("ET-Client-Name", "mdahlslett-skylit");
      connection.setDoOutput(true);
      byte[] body = new JSONObject().put("query", QUERY).toString().getBytes(StandardCharsets.UTF_8);
      try (OutputStream output = connection.getOutputStream()) { output.write(body); }
      if (connection.getResponseCode() != 200) return "null";
      try (InputStream input = connection.getInputStream();
           ByteArrayOutputStream buffer = new ByteArrayOutputStream()) {
        byte[] chunk = new byte[4096];
        int length;
        while ((length = input.read(chunk)) != -1) {
          if (buffer.size() + length > 128 * 1024) return "null";
          buffer.write(chunk, 0, length);
        }
        return parse(new JSONObject(new String(buffer.toByteArray(), StandardCharsets.UTF_8))).toString();
      }
    } catch (Exception failure) {
      return "null";
    } finally {
      if (connection != null) connection.disconnect();
    }
  }

  static JSONArray parse(JSONObject response) throws Exception {
    JSONArray calls = response.getJSONObject("data").getJSONObject("stopPlace").getJSONArray("estimatedCalls");
    JSONArray result = new JSONArray();
    for (int i = 0; i < calls.length(); i++) {
      JSONObject call = calls.getJSONObject(i);
      if (!call.optBoolean("forBoarding")) continue;
      JSONObject line = call.getJSONObject("serviceJourney").getJSONObject("journeyPattern").getJSONObject("line");
      if (!"bus".equals(line.optString("transportMode")) || !line.optString("id").startsWith("RUT:")) continue;
      JSONObject display = call.optJSONObject("destinationDisplay");
      String time = call.optString("expectedDepartureTime", "");
      if (time.isEmpty()) time = call.optString("aimedDepartureTime", "");
      if (time.isEmpty()) continue;
      result.put(new JSONObject().put("time", time).put("line", line.optString("publicCode"))
          .put("destination", display == null ? "" : display.optString("frontText"))
          .put("realtime", call.optBoolean("realtime")));
    }
    return result;
  }
}
