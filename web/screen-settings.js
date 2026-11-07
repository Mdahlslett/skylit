'use strict';
(() => {
  const app = SkylitApp, native = window.Skylit, panel = app.settingsSurface.panels.get('general');
  const key = 'skylit.screen';
  const defaults = {auto:true,day:80,night:20,manual:65};
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem(key)) || {}; } catch (_) {}
  const values = {};
  for (const name of ['day','night','manual']) {
    const value = Number(stored[name]);
    values[name] = Number.isFinite(value) && value >= 5 && value <= 100 ? value : defaults[name];
  }
  values.auto = typeof stored.auto === 'boolean' ? stored.auto : defaults.auto;
  const card = document.createElement('article');
  card.className = 'card screen-settings';
  const heading = document.createElement('h3');
  heading.textContent = 'Lysstyrke';
  const description = document.createElement('p');
  description.className = 'small subtle';
  description.textContent = 'Juster lyset i Skylit. Automatisk styring følger soloppgang og solnedgang ved valgt sted.';
  const modeLabel = document.createElement('label');
  const mode = document.createElement('input');
  mode.type = 'checkbox';
  mode.checked = values.auto;
  modeLabel.append(mode, document.createTextNode(' Automatisk etter solen'));
  const status = document.createElement('p');
  status.className = 'small subtle';
  status.setAttribute('role','status');
  card.append(heading, description, modeLabel);
  const controls = new Map();
  for (const [name, title] of [['day','Lysstyrke på dagtid'],['night','Lysstyrke om natten'],['manual','Fast lysstyrke']]) {
    const label = document.createElement('label');
    label.textContent = title + ' ';
    const output = document.createElement('output');
    const slider = document.createElement('input');
    slider.id = 'screen-brightness-' + name;
    label.htmlFor = slider.id;
    slider.type = 'range';
    slider.min = '5'; slider.max = '100'; slider.step = '5';
    slider.value = String(values[name]);
    slider.setAttribute('aria-label', title);
    label.append(output);
    const row = document.createElement('div');
    row.append(label, slider);
    card.append(row);
    controls.set(name,{row,output,slider});
    slider.oninput = () => update(name, Number(slider.value));
  }
  card.append(status);
  panel.prepend(card);
  function persist(next) {
    try { localStorage.setItem(key,JSON.stringify(next)); } catch (_) {
      app.notify('Kunne ikke lagre lysstyrken.');
      return false;
    }
    Object.assign(values,next);
    return true;
  }
  function update(name,value) {
    persist({...values,[name]:value});
    render();
  }
  mode.onchange = () => update('auto', mode.checked);
  function apply() {
    const solar = SkylitAppearance.resolve('auto', app.screenLocation(),new Date());
    const night = solar.mode === 'dark';
    const percent = values.auto ? (night ? values.night : values.day) : values.manual;
    if(native && native.slideshowBrightness) native.slideshowBrightness(percent / 100);
    status.textContent = values.auto ? (night ? 'Natt' : 'Dag') + ' · ' + percent + ' %' : 'Fast lysstyrke · ' + percent + ' %';
    return {automatic:values.auto,night,percent};
  }
  function render() {
    mode.checked = values.auto;
    for(const [name,control] of controls){
      control.slider.value=String(values[name]);
      control.output.textContent=values[name]+' %';
      control.row.hidden=name==='manual'?values.auto:!values.auto;
    }
    apply();
  }
  window.SkylitScreen={apply};
  window.addEventListener('skylit-preferences',apply);
  window.addEventListener('skylit-tab',apply);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply();});
  setInterval(apply,30000);
  render();

  const calendarPanel=app.settingsSurface.panels.get('calendars');
  const sync=document.createElement('button');
  sync.id='open-davx';
  sync.type='button';
  sync.className='ui-button secondary';
  sync.textContent='Åpne DAVx⁵ for synkronisering';
  sync.onclick=()=>{if(native&&native.openDavx)native.openDavx();else app.notify('Åpnes på Android-rammen.');};
  calendarPanel.querySelector('h2').after(sync);
})();
