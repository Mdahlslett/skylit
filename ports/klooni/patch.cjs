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


const themeFile=path.join(root,'android/assets/themes/default.theme');
const theme=JSON.parse(fs.readFileSync(themeFile,'utf8'));
theme.name='Skylit';
theme.colors={
 background:'eee8ddff',foreground:'39332dff',
 buttons:['d9c9b5ff','d8c18eff','b9c6bbff','cfb4a7ff'],
 empty_cell:'e0d8ccff',
 cells:['aab4c4ff','b8c5a2ff','a6c4b7ff','d9c28eff','cba587ff','c5a6adff','bd9388ff','a4b69cff','a3bdc5ff'],
 current_score:'795944ff',high_score:'596e60ff',bonus:'534a40ff',band:'ded3c3ff',text:'39332dff'
};
fs.writeFileSync(themeFile,JSON.stringify(theme,null,2));
edit('android/build.gradle',s=>s.replace("applicationId 'no.skylit.klooni'","applicationId 'no.skylit.klooni.dashboard'"));
edit('core/src/dev/lonami/klooni/game/GameLayout.java',s=>s.replaceAll('h/1080f*.65f','h/1080f*.9f'));
edit('core/src/dev/lonami/klooni/game/BaseScorer.java',s=>s.replace('com.badlogic.gdx.graphics.Color.GRAY','com.badlogic.gdx.graphics.Color.valueOf("756b5e")'));
edit('core/src/dev/lonami/klooni/actors/Band.java',s=>s.replace('"pause menu"','"Pause"'));
edit('android/src/dev/lonami/klooni/AndroidLauncher.java',s=>s.replace('com.wesbos.homehq.webview74.skolelinje','com.wesbos.homehq.webview74.spill').replace('        controls.addView(pause);controls.addView(home);',`
        for(android.widget.Button control:new android.widget.Button[]{pause,home}){
            control.setAllCaps(false);control.setTextSize(17);
            control.setTextColor(android.graphics.Color.rgb(57,51,45));
            control.setTypeface(android.graphics.Typeface.create("sans-serif",android.graphics.Typeface.NORMAL));
            android.graphics.drawable.GradientDrawable background=new android.graphics.drawable.GradientDrawable();
            background.setColor(android.graphics.Color.rgb(224,215,201));background.setCornerRadius(12*getResources().getDisplayMetrics().density);
            background.setStroke(1,android.graphics.Color.rgb(203,192,176));control.setBackground(background);
            control.setElevation(0);
            int inset=(int)(16*getResources().getDisplayMetrics().density);
            control.setPadding(inset,inset/2,inset,inset/2);
            android.widget.LinearLayout.LayoutParams item=new android.widget.LinearLayout.LayoutParams(-2,(int)(48*getResources().getDisplayMetrics().density));
            item.leftMargin=(int)(8*getResources().getDisplayMetrics().density);
            controls.addView(control,item);
        }`));

edit('core/src/dev/lonami/klooni/game/PieceHolder.java',s=>{
 const start=s.indexOf('            if (Klooni.onDesktop)');
 const end=s.indexOf('            if (Klooni.shouldSnapToGrid())',start);
 if(start<0||end<0)throw Error('Drag implementation changed');
 s=s.slice(0,start)+'            // Keep the full-size piece centered directly under the touch point.\n            mouse.sub(piece.cellCols*pickedCellSize*.5f,piece.cellRows*pickedCellSize*.5f);\n'+s.slice(end);
 return s.replace('piece.pos.lerp(mouse, DRAG_SPEED);','piece.pos.set(mouse);').replace('piece.cellSize = Interpolation.linear.apply(piece.cellSize, pickedCellSize, DRAG_SPEED);','piece.cellSize = pickedCellSize;').replace('            put = enabled && board.putScreenPiece(pieces[heldPiece]);','            update();\n            put = enabled && board.putScreenPiece(pieces[heldPiece]);');
});
edit('core/src/dev/lonami/klooni/Klooni.java',s=>s.replace('return !prefs.getBoolean("muteSound", false);','return false; // Quiet family-frame edition.'));
edit('android/src/dev/lonami/klooni/AndroidLauncher.java',s=>s.replace('control.setAllCaps(false);','control.setSoundEffectsEnabled(false);control.setAllCaps(false);'));

edit('core/src/dev/lonami/klooni/screens/MainMenuScreen.java',s=>{
 const start=s.indexOf('        // Play button');
 const end=s.indexOf('\n    }',start);
 return s.slice(0,start)+`
        com.badlogic.gdx.scenes.scene2d.ui.Label record=new com.badlogic.gdx.scenes.scene2d.ui.Label(
            "Rekord "+Klooni.getMaxScore(),new com.badlogic.gdx.scenes.scene2d.ui.Label.LabelStyle(game.skin.getFont("font_small"),Klooni.theme.highScore));
        table.add(record).padBottom(40).row();
        com.badlogic.gdx.scenes.scene2d.ui.ImageButton.ImageButtonStyle base=Klooni.theme.getStyle(0);
        com.badlogic.gdx.scenes.scene2d.ui.TextButton.TextButtonStyle style=new com.badlogic.gdx.scenes.scene2d.ui.TextButton.TextButtonStyle();
        style.up=base.up;style.down=base.down;style.font=game.skin.getFont("font_small");style.fontColor=Klooni.theme.textColor;
        com.badlogic.gdx.scenes.scene2d.ui.TextButton playButton=new com.badlogic.gdx.scenes.scene2d.ui.TextButton("Spill",style);
        playButton.addListener(new ChangeListener(){public void changed(ChangeEvent event,Actor actor){
            MainMenuScreen.this.game.transitionTo(new GameScreen(MainMenuScreen.this.game,GameScreen.GAME_MODE_SCORE));
        }});
        table.add(playButton).width(Gdx.graphics.getWidth()*.28f).height(Gdx.graphics.getHeight()*.16f);
`+s.slice(end);
});
edit('core/src/dev/lonami/klooni/screens/PauseMenuStage.java',s=>{
 s=s.replace('        table.add(homeButton).space(16);','').replace('        table.add(customButton).space(16);','').replace('        table.row();','');
 const start=s.indexOf('    void showGameOver(');
 const end=s.indexOf('\n    boolean isShown()',start);
 return s.slice(0,start)+`
    void showGameOver(final String gameOverReason, final boolean timeMode) {
        playButton.setVisible(false);
        band.setMessage("Spillet er slutt");
        show();
    }
`+s.slice(end);
});
edit('android/src/dev/lonami/klooni/AndroidLauncher.java',s=>{
 s=s.replace('com.wesbos.homehq.webview74.spill','com.wesbos.homehq.webview74.spilllys');
 s=s.replace('        initialize(new Klooni(shareChallenge), config);','        applyFrameBrightness(getIntent());\n        initialize(new Klooni(shareChallenge), config);');
 const end=s.lastIndexOf('\n}');
 return s.slice(0,end)+`
    private final android.content.BroadcastReceiver frameLight=new android.content.BroadcastReceiver(){
        @Override public void onReceive(android.content.Context context,android.content.Intent intent){applyFrameBrightness(intent);}
    };
    private boolean lightRegistered;
    private void applyFrameBrightness(android.content.Intent intent){
        android.content.SharedPreferences light=getSharedPreferences("frame-light",MODE_PRIVATE);
        float value=intent!=null&&intent.hasExtra("skylit.brightness")?intent.getFloatExtra("skylit.brightness",-1):light.getFloat("brightness",-1);
        if(Float.isNaN(value)||!(value==-1||value>=.05f&&value<=1))return;
        light.edit().putFloat("brightness",value).apply();
        android.view.WindowManager.LayoutParams attributes=getWindow().getAttributes();
        attributes.screenBrightness=value;getWindow().setAttributes(attributes);
    }
    @Override protected void onNewIntent(android.content.Intent intent){super.onNewIntent(intent);setIntent(intent);applyFrameBrightness(intent);}
    @Override protected void onStart(){
        super.onStart();
        if(!lightRegistered){registerReceiver(frameLight,new android.content.IntentFilter("no.skylit.klooni.BRIGHTNESS"));lightRegistered=true;}
    }
    @Override protected void onStop(){if(lightRegistered){unregisterReceiver(frameLight);lightRegistered=false;}super.onStop();}
`+s.slice(end);
});

const nightTheme=JSON.parse(fs.readFileSync(path.join(root,'android/assets/themes/default.theme'),'utf8'));
nightTheme.name='Skylit natt';
nightTheme.colors={
 background:'241f1cff',foreground:'f2e7d5ff',buttons:['554437ff','514b3aff','3e5145ff','59463fff'],
 empty_cell:'3e3630ff',
 cells:['7c899eff','8e9c78ff','799d8bff','b49b68ff','ac8566ff','a3818aff','a77568ff','7f946fff','73949eff'],
 current_score:'e7b487ff',high_score:'b6bc93ff',bonus:'e2d3bdff',band:'332d28ff',text:'f2e7d5ff'
};
fs.writeFileSync(path.join(root,'android/assets/themes/skylit-night.theme'),JSON.stringify(nightTheme,null,2));
edit('core/src/dev/lonami/klooni/Klooni.java',s=>s.replace('    public static Theme theme;','    public static Theme theme;\n    public static boolean frameNight;').replace('prefs.getString("themeName", "default")','(frameNight ? "skylit-night" : "default")'));
edit('core/src/dev/lonami/klooni/game/BaseScorer.java',s=>s.replace('            currentCaption.draw(batch,1f);recordCaption.draw(batch,1f);','            currentCaption.setColor(Klooni.theme.textColor);recordCaption.setColor(Klooni.theme.textColor);\n            currentCaption.draw(batch,1f);recordCaption.draw(batch,1f);'));
edit('core/src/dev/lonami/klooni/screens/MainMenuScreen.java',s=>{
 s=s.replace('    private final Stage stage;','    private final Stage stage;\n    private com.badlogic.gdx.scenes.scene2d.ui.TextButton framePlay;\n    private com.badlogic.gdx.scenes.scene2d.ui.Label frameRecord;');
 s=s.replace('        table.add(record).padBottom(40).row();','        frameRecord=record;table.add(record).padBottom(40).row();');
 s=s.replace('        table.add(playButton).width','        framePlay=playButton;table.add(playButton).width');
 return s.replace('        stage.draw();',`
        com.badlogic.gdx.scenes.scene2d.ui.ImageButton.ImageButtonStyle current=Klooni.theme.getStyle(0);
        framePlay.getStyle().up=current.up;framePlay.getStyle().down=current.down;framePlay.getStyle().fontColor=Klooni.theme.textColor;
        frameRecord.setColor(Klooni.theme.highScore);
        stage.draw();`);
});
edit('android/src/dev/lonami/klooni/AndroidLauncher.java',s=>{
 s=s.replace('        initialize(new Klooni(shareChallenge), config);','        frameGame=new Klooni(shareChallenge);initialize(frameGame, config);');
 s=s.replace('android.widget.LinearLayout controls=new android.widget.LinearLayout(this);','android.widget.LinearLayout controls=new android.widget.LinearLayout(this);frameControls=controls;');
 s=s.replace('        addContentView(controls,params);','        addContentView(controls,params);styleFrameControls(Klooni.frameNight);');
 s=s.replace('    private boolean lightRegistered;','    private boolean lightRegistered;\n    private Klooni frameGame;\n    private android.widget.LinearLayout frameControls;');
 s=s.replace('        light.edit().putFloat("brightness",value).apply();',`
        boolean night=intent!=null&&intent.hasExtra("skylit.night")?intent.getBooleanExtra("skylit.night",false):light.getBoolean("night",false);
        boolean changed=Klooni.frameNight!=night;Klooni.frameNight=night;
        light.edit().putFloat("brightness",value).putBoolean("night",night).apply();
        styleFrameControls(night);
        if(changed&&frameGame!=null&&com.badlogic.gdx.Gdx.app!=null)com.badlogic.gdx.Gdx.app.postRunnable(()->{
            if(Klooni.theme!=null)Klooni.theme.update(night?"skylit-night":"default");
        });`);
 const end=s.lastIndexOf('\n}');
 return s.slice(0,end)+`
    private void styleFrameControls(boolean night){
        if(frameControls==null)return;
        for(int i=0;i<frameControls.getChildCount();i++){
            android.widget.Button button=(android.widget.Button)frameControls.getChildAt(i);
            button.setTextColor(android.graphics.Color.parseColor(night?"#f2e7d5":"#39332d"));
            android.graphics.drawable.GradientDrawable background=new android.graphics.drawable.GradientDrawable();
            background.setColor(android.graphics.Color.parseColor(night?"#332d28":"#e0d7c9"));
            background.setCornerRadius(12*getResources().getDisplayMetrics().density);
            background.setStroke(1,android.graphics.Color.parseColor(night?"#51463b":"#cbc0b0"));
            button.setBackground(background);
        }
    }
`+s.slice(end);
});

edit('core/src/dev/lonami/klooni/screens/MainMenuScreen.java',s=>s.replace('new com.badlogic.gdx.scenes.scene2d.ui.Label.LabelStyle(game.skin.getFont("font_small"),Klooni.theme.highScore)','new com.badlogic.gdx.scenes.scene2d.ui.Label.LabelStyle(game.skin.getFont("font_small"),com.badlogic.gdx.graphics.Color.WHITE)'));
edit('core/src/dev/lonami/klooni/game/BaseScorer.java',s=>s.replace('com.badlogic.gdx.graphics.Color.valueOf("756b5e")','com.badlogic.gdx.graphics.Color.WHITE'));

edit('core/src/dev/lonami/klooni/screens/MainMenuScreen.java',s=>s.replaceAll('Klooni.getMaxScore()','Klooni.getMaxTimeScore()').replaceAll('GameScreen.GAME_MODE_SCORE','GameScreen.GAME_MODE_TIME'));
edit('core/src/dev/lonami/klooni/game/TimeScorer.java',s=>s.replace('return "time is up";','return "Tiden er ute";').replace('timeLeftLabel.setText(Integer.toString(timeLeft));','timeLeftLabel.setText("Tid igjen  "+(timeLeft/60)+":"+(timeLeft%60<10?"0":"")+(timeLeft%60));'));
edit('core/src/dev/lonami/klooni/game/GameLayout.java',s=>s.replace('        if(landscape())timeLeftLabel.setBounds','        timeLeftLabel.setFontScale(.7f);\n        if(landscape())timeLeftLabel.setBounds'));
edit('core/src/dev/lonami/klooni/screens/GameScreen.java',s=>s.replace('    public void pause() {\n        save();\n    }','    public void pause() {\n        if(!pauseMenu.isShown()&&!gameOverDone)showPauseMenu();else save();\n    }'));
edit('core/src/dev/lonami/klooni/screens/PauseMenuStage.java',s=>s.replace('band.setMessage("Spillet er slutt");','band.setMessage(timeMode?"Tiden er ute":"Spillet er slutt");'));

edit('core/src/dev/lonami/klooni/game/TimeScorer.java',s=>s.replace('labelStyle.font = game.skin.getFont("font");','labelStyle.font = game.skin.getFont("font_small");'));
edit('core/src/dev/lonami/klooni/game/GameLayout.java',s=>s.replace('timeLeftLabel.setFontScale(.7f);','timeLeftLabel.setFontScale(1.4f);'));
edit('core/src/dev/lonami/klooni/actors/Band.java',s=>s.replace('labelStyle.font = game.skin.getFont("font");','labelStyle.font = game.skin.getFont("font_small");').replace('scoreLabel.setAlignment(Align.center);','scoreLabel.setAlignment(Align.center);scoreLabel.setFontScale(2);').replace('infoLabel.setAlignment(Align.center);','infoLabel.setAlignment(Align.center);infoLabel.setFontScale(2);'));
