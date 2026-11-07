'use strict';
(() => {
  const app = window.SkylitApp;
  const children = ['Matilda', 'Ninni', 'Louie'];
  const days = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag'];
  const key = 'skylit.family.v1';
  let state = {tasks: [], meals: {}, rewards: {}, paid: {}};
  try { state = Object.assign(state, JSON.parse(localStorage.getItem(key)) || {}); } catch (_) {}
  function save(patch) {
    const next = Object.assign({}, state, patch);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch (_) {
      app.notify('Kunne ikke lagre på rammen.');
      return false;
    }
    state = next;
    return true;
  }
  const date = key => new Date(key + 'T12:00:00Z');
  function shift(key, offset) {
    const value = date(key);
    value.setUTCDate(value.getUTCDate() + offset);
    return value.toISOString().slice(0, 10);
  }
  const monday = key => shift(key, -((date(key).getUTCDay() + 6) % 7));
  const today = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Oslo'}).format(new Date());
  const short = key => new Intl.DateTimeFormat('nb-NO', {timeZone:'UTC', day:'numeric', month:'short'}).format(date(key));
  const weekNumber = key => {
    const thursday = date(shift(key, 3));
    return 1 + Math.floor((thursday - Date.UTC(thursday.getUTCFullYear(), 0, 1)) / 604800000);
  };
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
  }
  function button(text, click) {
    const element = node('button', text);
    element.type = 'button';
    element.onclick = click;
    return element;
  }
  function page(id, title) {
    const section = node('section', '', 'page family-page');
    section.id = id;
    section.append(node('h1', title));
    const settings = document.querySelector('[data-tab="settings"]');
    const nav = button('', () => app.go(id));
    nav.className = 'ui-button nav family-nav';
    const icon = node('span');
    icon.dataset.icon = id;
    icon.innerHTML = app.icon(id);
    nav.append(icon, document.createTextNode(title));
    nav.dataset.tab = id;
    settings.parentNode.insertBefore(nav, settings);
    document.getElementById('calendar').parentNode.append(section);
    return section;
  }
  const shopping = page('shopping', 'Handleliste');
  const shoppingPanel = document.getElementById('shopping-add').closest('article');
  if (shoppingPanel) {
    const title = shopping.querySelector('h1');
    const header = node('div', '', 'shopping-header');
    const intro = node('div');
    const count = node('p', '', 'shopping-count');
    intro.append(title, count);
    header.append(intro, document.getElementById('shopping-undo'));
    const layout = node('div', '', 'shopping-layout');
    const completed = shoppingPanel.querySelector('details');
    const aside = node('aside', '', 'card shopping-done-card');
    aside.append(node('h2', 'I handlekurven'), node('p', 'Varene du har krysset av.', 'subtle'), completed);
    layout.append(shoppingPanel, aside);
    shopping.append(header, layout);
    const heading = shoppingPanel.querySelector('h2,h3');
    if (heading) {heading.hidden = false;heading.textContent = 'Dette trenger vi';}
    const input = document.getElementById('shopping-input');
    input.placeholder = 'Hva trenger vi?';
    input.setAttribute('aria-label', 'Legg til en vare');
    document.getElementById('shopping-add').querySelector('button').textContent = '+ Legg til';
    const clear = document.getElementById('shopping-clear');
    clear.textContent = 'Fjern avkryssede';
    clear.type = 'button';
    const undo = document.getElementById('shopping-undo');
    undo.textContent = 'Angre';
    undo.type = 'button';
    completed.open = true;
    const empty = node('div', '', 'shopping-empty');
    const symbol = node('span', '', 'shopping-empty-icon');
    symbol.innerHTML = app.icon('shopping');
    empty.append(symbol, node('h3', 'Alt klart for neste handletur'), node('p', 'Legg til det dere trenger i feltet over.'));
    shoppingPanel.append(empty);
    function updateShoppingSummary() {
      const items = app.householdState().shopping;
      const remaining = items.filter(item => !item.done).length;
      count.textContent = remaining ? remaining + (remaining === 1 ? ' vare igjen' : ' varer igjen') : 'En liten oversikt over det dere trenger';
      empty.hidden = remaining > 0;
      clear.hidden = !items.some(item => item.done);
      aside.classList.toggle('shopping-done-empty', !items.some(item => item.done));
    }
    window.addEventListener('skylit-household', updateShoppingSummary);
    updateShoppingSummary();
  }
  const chores = page('chores', 'Gjøremål');
  const meals = page('meals', 'Middagsplan');
  const games = button('', () => {
    if (window.Skylit && Skylit.openGame) Skylit.openGame();
    else app.notify('Spillet åpnes på rammen.');
  });
  games.className = 'ui-button nav family-nav';
  games.setAttribute('aria-label', 'Åpne spill');
  const gameIcon = node('span');
  gameIcon.setAttribute('aria-hidden', 'true');
  gameIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 6h10c3 0 5 11 3 12-2 1-4-3-5-3H9c-1 0-3 4-5 3-2-1 0-12 3-12Z"/><path d="M7 9v5M4.5 11.5h5"/><circle cx="16" cy="10" r=".7"/><circle cx="18" cy="13" r=".7"/></svg>';
  games.append(gameIcon, document.createTextNode('Spill'));
  document.querySelector('[data-tab="meals"]').after(games);
  let choreWeek = monday(today());
  let mealWeek = choreWeek;
  function weekBar(start, change) {
    const bar = node('div', '', 'family-week');
    const previous = button('‹', () => change(-7));
    previous.setAttribute('aria-label', 'Forrige uke');
    const next = button('›', () => change(7));
    next.setAttribute('aria-label', 'Neste uke');
    bar.append(previous, node('strong', 'Uke ' + weekNumber(start) + ' · ' + short(start) + ' – ' + short(shift(start, 6))), next);
    return bar;
  }
  const forWeek = (task, start) => task.weekly
    ? start >= monday(task.start) : task.start <= shift(start, 6) && (!task.completed || task.completed >= start);
  const doneIn = (task, start) => task.weekly ? Boolean(task.done[start]) : Boolean(task.completed && monday(task.completed) === start);
  function renderChores() {
    while (chores.children.length > 1) chores.lastElementChild.remove();
    const start = choreWeek;
    const bar = weekBar(start, offset => { choreWeek = shift(start, offset); renderChores(); });
    bar.append(button('Denne uka', () => { choreWeek = monday(today()); renderChores(); }));
    chores.append(bar);
    const columns = node('div', '', 'family-columns');
    children.forEach(child => {
      const card = node('article', '', 'family-card');
      const tasks = state.tasks.filter(task => task.child === child && forWeek(task, start));
      const finished = tasks.filter(task => doneIn(task, start)).length;
      card.append(node('h2', child), node('p', finished + ' av ' + tasks.length + ' ferdige denne uka'));
      const progress = node('progress');
      progress.max = tasks.length || 1;
      progress.value = finished;
      progress.setAttribute('aria-label', 'Ukas fremdrift for ' + child);
      card.append(progress);
      if (!tasks.length) card.append(node('p', 'Ingen oppgaver denne uka.', 'subtle'));
      tasks.forEach(task => {
        const row = node('div', '', 'family-task');
        const done = doneIn(task, start);
        const toggle = button((done ? '✓  ' : '○  ') + task.text, () => {
          const updated = Object.assign({}, task);
          if (task.weekly) updated.done = Object.assign({}, task.done, {[start]: !done});
          else updated.completed = done ? '' : start;
          if (save({tasks: state.tasks.map(item => item === task ? updated : item)})) renderChores();
        });
        toggle.setAttribute('aria-pressed', String(done));
        const remove = button('×', () => {
          if (window.confirm('Slette oppgaven «' + task.text + '»?') && save({tasks:state.tasks.filter(item => item !== task)})) renderChores();
        });
        remove.setAttribute('aria-label', 'Slett ' + task.text);
        row.append(toggle, remove);
        card.append(row);
      });
      const add = node('details', '', 'family-add');
      const form = node('form', '', 'family-form');
      const input = node('input');
      input.required = true;
      input.maxLength = 80;
      input.placeholder = 'Oppgave';
      input.setAttribute('aria-label', 'Oppgave for ' + child);
      const repeat = node('select');
      repeat.setAttribute('aria-label', 'Gjentakelse');
      ['Én gang', 'Gjentas hver uke'].forEach(label => repeat.append(node('option', label)));
      const submit = node('button', 'Lagre oppgave');
      form.onsubmit = event => {
        event.preventDefault();
        const title = input.value.trim();
        if (!title) return;
        const task = {child, text:title, start, weekly:repeat.selectedIndex > 0, done:{}, completed:''};
        if (save({tasks: state.tasks.concat(task)})) renderChores();
      };
      form.append(input, repeat, submit);
      add.append(node('summary', '+ Legg til oppgave'), form);
      card.append(add);
      const reward = node('details', '', 'family-add');
      const amount = node('input');
      amount.type = 'number';
      amount.min = '0';
      amount.step = '1';
      amount.placeholder = 'Kr per uke';
      amount.setAttribute('aria-label', 'Ukepenger i kroner for ' + child);
      amount.value = state.rewards[child] || '';
      const rewardKey = child + ':' + start;
      const paid = Boolean(state.paid[rewardKey]);
      const earned = tasks.length > 0 && finished === tasks.length;
      reward.append(node('summary', 'Ukepenger'), amount, button('Lagre beløp', () => {
        if (amount.checkValidity() && save({rewards:Object.assign({}, state.rewards, {[child]:Number(amount.value)})})) renderChores();
      }));
      if (state.rewards[child] || paid) {
        reward.append(node('p', paid ? 'Markert utbetalt' : earned ? 'Opptjent · ' + state.rewards[child] + ' kr' : state.rewards[child] + ' kr når alle oppgaver er ferdige'));
        if (paid || earned) reward.append(button(paid ? 'Angre utbetaling' : 'Marker utbetalt', () => {
          if (save({paid:Object.assign({}, state.paid, {[rewardKey]:!paid})})) renderChores();
        }));
      }
      card.append(reward);
      columns.append(card);
    });
    chores.append(columns);
  }
  function renderMeals() {
    while (meals.children.length > 1) meals.lastElementChild.remove();
    meals.append(weekBar(mealWeek, offset => { mealWeek = shift(mealWeek, offset); renderMeals(); }));
    const list = node('div', '', 'family-card');
    days.forEach((day, index) => {
      const key = shift(mealWeek, index);
      const row = node('form', '', 'family-meal');
      const label = node('label', day + ' · ' + short(key));
      const input = node('input');
      input.id = 'family-meal-' + index;
      label.htmlFor = input.id;
      input.maxLength = 100;
      input.placeholder = 'Hva skal vi ha til middag?';
      input.value = state.meals[key] || '';
      const status = node('small');
      status.setAttribute('role', 'status');
      row.onsubmit = event => {
        event.preventDefault();
        if (save({meals:Object.assign({}, state.meals, {[key]:input.value.trim()})})) status.textContent = 'Lagret';
      };
      row.append(label, input, node('button', 'Lagre'), status);
      list.append(row);
    });
    meals.append(list);
  }
  window.addEventListener('skylit-tab', event => {
    if (event.detail === 'chores') { choreWeek = monday(today()); renderChores(); }
    if (event.detail === 'meals') { mealWeek = monday(today()); renderMeals(); }
  });
})();
