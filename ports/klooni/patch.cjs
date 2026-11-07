const fs=require('fs'),path=require('path');
const root='work/klooni-landscape';
function edit(file,fn){const p=path.join(root,file);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('android/AndroidManifest.xml',s=>s.replace('android:screenOrientation="portrait"','android:screenOrientation="landscape"').replace('android:name="dev.lonami.klooni.AndroidLauncher"','android:name="dev.lonami.klooni.AndroidLauncher" android:exported="true"').replace('    package="dev.lonami.klooni"',''));
edit('core/src/dev/lonami/klooni/game/GameLayout.java',s=>s.replace('import com.badlogic.gdx.scenes.scene2d.ui.Label;','import com.badlogic.gdx.scenes.scene2d.ui.Label;\nimport com.badlogic.gdx.utils.Align;').replace('    void update(BaseScorer scorer) {',`    private boolean landscape() { return screenWidth > screenHeight; }
    private float boardSizeLandscape() { return Math.min(screenHeight * .88f, screenWidth * .55f); }
    private float sideLeft() { return boardSizeLandscape() + screenHeight * .10f; }
    private float sideWidth() { return screenWidth - sideLeft() - screenHeight * .04f; }

    void update(BaseScorer scorer) {
        if (landscape()) {
            float x=sideLeft(), w=sideWidth(), h=screenHeight;
            float cup=h*.12f;
            scorer.cupArea.set(x+w*.5f-cup*.5f,h*.80f,cup,cup);
            scorer.currentScoreLabel.setAlignment(Align.center);
            scorer.highScoreLabel.setAlignment(Align.center);
            scorer.currentScoreLabel.setFontScale(h/1080f*.65f);
            scorer.highScoreLabel.setFontScale(h/1080f*.65f);
            scorer.currentScoreLabel.setBounds(x,h*.53f,w*.5f,h*.16f);
            scorer.highScoreLabel.setBounds(x+w*.5f,h*.53f,w*.5f,h*.16f);
            scorer.currentCaption.setBounds(x,h*.69f,w*.5f,h*.07f);
            scorer.recordCaption.setBounds(x+w*.5f,h*.69f,w*.5f,h*.07f);
            return;
        }`).replace('    void update(Board board) {',`    void update(Board board) {
        if (landscape()) {
            float size=boardSizeLandscape();
            board.cellSize=size/board.cellCount;
            board.pos.set(screenHeight*.04f,(screenHeight-size)*.5f);
            return;
        }`).replace('    void update(PieceHolder holder) {',`    void update(PieceHolder holder) {
        if (landscape()) {
            holder.area.set(sideLeft(),screenHeight*.09f,sideWidth(),screenHeight*.35f);
            return;
        }`).replace('        timeLeftLabel.setBounds(0, screenHeight - logoHeight, screenWidth, logoHeight);',`        if(landscape())timeLeftLabel.setBounds(sideLeft(),screenHeight*.44f,sideWidth(),screenHeight*.08f);
        else timeLeftLabel.setBounds(0, screenHeight - logoHeight, screenWidth, logoHeight);`));
edit('core/src/dev/lonami/klooni/game/BaseScorer.java',s=>s.replace('    final Label highScoreLabel;','    final Label highScoreLabel;\n    final Label currentCaption, recordCaption;').replace('        layout.update(this);',`        Label.LabelStyle captionStyle=new Label.LabelStyle(game.skin.getFont("font_small"),com.badlogic.gdx.graphics.Color.GRAY);
        currentCaption=new Label("Poeng",captionStyle);
        recordCaption=new Label("Rekord",captionStyle);
        currentCaption.setAlignment(Align.center);recordCaption.setAlignment(Align.center);
        currentCaption.setFontScale(.75f);recordCaption.setFontScale(.75f);
        layout.update(this);`).replace('        highScoreLabel.draw(batch, 1f);',`        highScoreLabel.draw(batch, 1f);
        if(com.badlogic.gdx.Gdx.graphics.getWidth()>com.badlogic.gdx.Gdx.graphics.getHeight()){
            currentCaption.draw(batch,1f);recordCaption.draw(batch,1f);
        }`));
edit('android/src/dev/lonami/klooni/AndroidLauncher.java',s=>s.replace('        initialize(new Klooni(shareChallenge), config);',`        initialize(new Klooni(shareChallenge), config);
        android.widget.LinearLayout controls=new android.widget.LinearLayout(this);
        android.widget.Button pause=new android.widget.Button(this);pause.setText("Pause");
        pause.setOnClickListener(v->com.badlogic.gdx.Gdx.app.postRunnable(()->{
            com.badlogic.gdx.InputProcessor input=com.badlogic.gdx.Gdx.input.getInputProcessor();
            if(input!=null)input.keyUp(com.badlogic.gdx.Input.Keys.P);
        }));
        android.widget.Button home=new android.widget.Button(this);home.setText("Til oversikten");
        home.setOnClickListener(v->{
            android.content.Intent intent=new android.content.Intent();
            intent.setClassName("com.wesbos.homehq.webview74.skolelinje","com.wesbos.homehq.MainActivity");
            try{startActivity(intent);}catch(android.content.ActivityNotFoundException e){finish();}
        });
        controls.addView(pause);controls.addView(home);
        android.widget.FrameLayout.LayoutParams params=new android.widget.FrameLayout.LayoutParams(-2,-2,android.view.Gravity.TOP|android.view.Gravity.RIGHT);
        int margin=(int)(12*getResources().getDisplayMetrics().density);params.topMargin=margin;params.rightMargin=margin;
        addContentView(controls,params);`));
fs.writeFileSync(path.join(root,'settings.gradle'),`pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }
rootProject.name='KlooniLandscape'
include 'core','android'
`);
fs.writeFileSync(path.join(root,'build.gradle'),`plugins { id 'com.android.application' version '8.6.1' apply false }
allprojects { repositories { google(); mavenCentral() } }
`);
fs.writeFileSync(path.join(root,'core/build.gradle'),`plugins { id 'java-library' }
java { sourceCompatibility=JavaVersion.VERSION_1_8; targetCompatibility=JavaVersion.VERSION_1_8 }
sourceSets.main.java.srcDirs=['src']
dependencies { api 'com.badlogicgames.gdx:gdx:1.9.10' }
`);
fs.writeFileSync(path.join(root,'android/build.gradle'),`plugins { id 'com.android.application' }
configurations { natives }
android {
 namespace 'dev.lonami.klooni'
 compileSdk 34
 defaultConfig { applicationId 'no.skylit.klooni'; minSdk 23; targetSdk 29; versionCode 861; versionName '0.8.6-landscape' }
 sourceSets { main { manifest.srcFile 'AndroidManifest.xml'; java.srcDirs=['src']; res.srcDirs=['res']; assets.srcDirs=['assets']; jniLibs.srcDirs=['libs'] } }
 compileOptions { sourceCompatibility JavaVersion.VERSION_1_8; targetCompatibility JavaVersion.VERSION_1_8 }
 packagingOptions { resources { excludes += ['META-INF/robovm/ios/robovm.xml'] } }
}
dependencies {
 implementation project(':core')
 implementation 'com.badlogicgames.gdx:gdx-backend-android:1.9.10'
 natives 'com.badlogicgames.gdx:gdx-platform:1.9.10:natives-armeabi-v7a'
 natives 'com.badlogicgames.gdx:gdx-platform:1.9.10:natives-arm64-v8a'
}
tasks.register('copyNatives') {
 doLast { configurations.natives.files.each { jar ->
  def abi=jar.name.contains('arm64-v8a')?'arm64-v8a':'armeabi-v7a'
  copy { from zipTree(jar); into "libs/\$abi"; include '*.so' }
 } }
}
tasks.named('preBuild').configure { dependsOn 'copyNatives' }
`);
edit('android/res/values/strings.xml',s=>s.replace('1010! Klooni','Klooni liggende'));
console.log('Patched landscape layout');

