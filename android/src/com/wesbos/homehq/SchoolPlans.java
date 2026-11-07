package com.wesbos.homehq;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.pdf.PdfRenderer;
import android.os.ParcelFileDescriptor;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.security.MessageDigest;

final class SchoolPlans {
  static final int MAX_PDF = 10 * 1024 * 1024;
  private static final long MAX_STORAGE = 64L * 1024 * 1024;
  private final File directory;
  private final SharedPreferences prefs;

  SchoolPlans(Context context) {
    directory = new File(context.getFilesDir(), "school-plans");
    directory.mkdirs();
    prefs = context.getSharedPreferences("school-plans", Context.MODE_PRIVATE);
    File[] files = directory.listFiles();
    if (files != null) for (File file : files) {
      if (file.getName().endsWith(".part")) file.delete();
    }
  }

  static boolean validChild(String child) {
    return "Matilda".equals(child) || "Ninni".equals(child) || "Louie".equals(child);
  }

  private JSONArray rows(String child) {
    if (!validChild(child)) return new JSONArray();
    try { return new JSONArray(prefs.getString(child, "[]")); }
    catch (Exception e) { return new JSONArray(); }
  }

  private File file(String child, String id) throws IOException {
    if (!validChild(child) || id == null || !id.matches("[a-f0-9]{64}")) throw new IOException("Ugyldig dokument");
    return new File(directory, child + "-" + id + ".pdf");
  }

  private JSONObject find(String child, String id) throws Exception {
    JSONArray items = rows(child);
    for (int i = 0; i < items.length(); i++) {
      JSONObject item = items.getJSONObject(i);
      if (id.equals(item.optString("id"))) return item;
    }
    throw new IOException("Dokumentet finnes ikke");
  }

  synchronized JSONObject snapshot(String child) {
    JSONObject result = new JSONObject();
    try {
      result.put("child", child);
      result.put("documents", rows(child));
    } catch (Exception ignored) {}
    return result;
  }

  synchronized JSONObject importPdf(String child, byte[] bytes, String filename) {
    JSONObject result = new JSONObject();
    File temporary = null;
    File target = null;
    boolean created = false;
    try {
      if (!validChild(child)) throw new IOException("Velg et barn på rammen");
      if (bytes.length < 5 || bytes.length > MAX_PDF ||
          bytes[0] != '%' || bytes[1] != 'P' || bytes[2] != 'D' || bytes[3] != 'F' || bytes[4] != '-') {
        throw new IOException("Velg en PDF på høyst 10 MB");
      }
      StringBuilder hash = new StringBuilder();
      for (byte value : MessageDigest.getInstance("SHA-256").digest(bytes)) {
        hash.append(String.format(java.util.Locale.ROOT, "%02x", value & 255));
      }
      String id = hash.toString();
      JSONArray previous = rows(child);
      for (int i = 0; i < previous.length(); i++) {
        if (id.equals(previous.getJSONObject(i).optString("id")) && file(child, id).isFile()) {
          return result.put("ok", true).put("duplicate", true);
        }
      }
      if (previous.length() >= 10) throw new IOException("Denne fanen har ti PDF-er. Fjern en gammel plan først");
      long used = 0;
      File[] files = directory.listFiles();
      if (files != null) for (File existing : files) used += existing.length();
      if (used + bytes.length > MAX_STORAGE) throw new IOException("Lagringen er full. Fjern en gammel plan først");
      temporary = File.createTempFile("upload-", ".part", directory);
      try (FileOutputStream output = new FileOutputStream(temporary)) {
        output.write(bytes);
        output.getFD().sync();
      }
      int count;
      int width;
      int height;
      try (ParcelFileDescriptor descriptor = ParcelFileDescriptor.open(temporary, ParcelFileDescriptor.MODE_READ_ONLY);
           PdfRenderer renderer = new PdfRenderer(descriptor)) {
        count = renderer.getPageCount();
        if (count < 1 || count > 100) throw new IOException("PDF-en må ha mellom 1 og 100 sider");
        try (PdfRenderer.Page page = renderer.openPage(0)) {
          width = page.getWidth();
          height = page.getHeight();
        }
      }
      String title = filename == null ? "Ukeplan.pdf" : filename.replaceAll("[\\p{Cntrl}/\\\\]", " ").trim();
      if (title.isEmpty()) title = "Ukeplan.pdf";
      if (title.length() > 120) title = title.substring(0, 120);
      JSONObject entry = new JSONObject().put("id", id).put("title", title)
          .put("pages", count).put("width", width).put("height", height).put("uploaded", System.currentTimeMillis());
      JSONArray next = new JSONArray();
      next.put(entry);
      for (int i = 0; i < previous.length(); i++) {
        JSONObject item=previous.getJSONObject(i);
        if(!id.equals(item.optString("id")))next.put(item);
      }
      target = file(child, id);
      if (!temporary.renameTo(target)) throw new IOException("Kunne ikke lagre PDF-en");
      temporary = null;
      created = true;
      if (!prefs.edit().putString(child, next.toString()).commit()) throw new IOException("Kunne ikke lagre dokumentlisten");
      created = false;
      return result.put("ok", true).put("id", id);
    } catch (Exception e) {
      if (created && target != null) target.delete();
      try { result.put("ok", false).put("error", e instanceof IOException ? e.getMessage() : "Kunne ikke åpne PDF-en. Sjekk at den ikke er passordbeskyttet"); }
      catch (Exception ignored) {}
      return result;
    } finally {
      if (temporary != null) temporary.delete();
    }
  }

  synchronized boolean remove(String child, String id) {
    try {
      find(child, id);
      JSONArray next = new JSONArray();
      JSONArray previous = rows(child);
      for (int i = 0; i < previous.length(); i++) {
        JSONObject item = previous.getJSONObject(i);
        if (!id.equals(item.optString("id"))) next.put(item);
      }
      if (!prefs.edit().putString(child, next.toString()).commit()) return false;
      file(child, id).delete();
      return true;
    } catch (Exception e) { return false; }
  }

  synchronized byte[] render(String child, String id, int index, int requestedWidth) throws Exception {
    JSONObject document = find(child, id);
    if (index < 0 || index >= document.getInt("pages")) throw new IOException("Ugyldig side");
    try (ParcelFileDescriptor descriptor = ParcelFileDescriptor.open(file(child, id), ParcelFileDescriptor.MODE_READ_ONLY);
         PdfRenderer renderer = new PdfRenderer(descriptor);
         PdfRenderer.Page page = renderer.openPage(index)) {
      double width = Math.max(400, Math.min(2000, requestedWidth));
      double height = width * page.getHeight() / page.getWidth();
      double scale = Math.min(1, Math.sqrt(4000000 / (width * height)));
      Bitmap bitmap = Bitmap.createBitmap(Math.max(1, (int)(width * scale)), Math.max(1, (int)(height * scale)), Bitmap.Config.ARGB_8888);
      try {
        bitmap.eraseColor(Color.WHITE);
        page.render(bitmap, null, null, PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, output);
        return output.toByteArray();
      } finally { bitmap.recycle(); }
    }
  }
}
