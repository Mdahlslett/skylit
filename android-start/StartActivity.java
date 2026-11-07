package no.skylit.framestart;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public final class StartActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout screen = new LinearLayout(this);
        screen.setOrientation(LinearLayout.VERTICAL);
        screen.setGravity(Gravity.CENTER);
        screen.setPadding(dp(24), dp(24), dp(24), dp(24));
        screen.setBackgroundColor(0xff24201d);

        TextView heading = new TextView(this);
        heading.setText("Velg app");
        heading.setTextColor(Color.WHITE);
        heading.setTextSize(34);
        heading.setGravity(Gravity.CENTER);
        screen.addView(heading);

        LinearLayout choices = new LinearLayout(this);
        LinearLayout.LayoutParams row = new LinearLayout.LayoutParams(dp(520), dp(88));
        row.topMargin = dp(22);
        screen.addView(choices, row);
        addChoice(choices, "Skylit", "com.wesbos.homehq.webview74.maanedsruter", "com.wesbos.homehq.MainActivity");
        addChoice(choices, "Frameo", "net.frameo.frame", "net.frameo.frame.ui.activities.AWaitForDeferredInitCompleted");
        setContentView(screen);
    }

    private void addChoice(LinearLayout row, String label, String packageName, String activity) {
        Button button = new Button(this);
        button.setText(label);
        button.setAllCaps(false);
        button.setTextSize(24);
        LinearLayout.LayoutParams size = new LinearLayout.LayoutParams(0, -1, 1);
        size.setMargins(dp(6), 0, dp(6), 0);
        row.addView(button, size);
        button.setOnClickListener(view -> {
            Intent intent = Intent.makeMainActivity(new ComponentName(packageName, activity));
            try {
                startActivity(intent);
            } catch (ActivityNotFoundException e) {
                Toast.makeText(this, label + " er ikke tilgjengelig.", Toast.LENGTH_LONG).show();
            }
        });
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
