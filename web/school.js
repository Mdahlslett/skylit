'use strict';
(() => {
  const app=SkylitApp,native=window.Skylit;
  const children=['Matilda','Ninni','Louie'];
  const node=(tag,cls,text)=>{
    const element=document.createElement(tag);
    if(cls)element.className=cls;
    if(text!==undefined)element.textContent=text;
    return element;
  };
  const button=(text,action,cls='ui-button secondary')=>{
    const element=node('button',cls,text);element.type='button';element.onclick=action;return element;
  };
  const section=node('section','page school-page');
  section.id='school';
  const heading=node('div','school-heading');
  heading.append(node('h1',null,'Skoleplaner'));
  const upload=button('Last opp PDF fra mobil',startUpload);
  heading.append(upload);
  const tabs=node('div','school-tabs');
  tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Velg barn');
  const documents=node('div','school-documents');
  documents.setAttribute('aria-label','PDF-er');
  const controls=node('div','school-controls');
  const previous=button('‹',()=>changePage(-1));
  previous.setAttribute('aria-label','Forrige side');
  const pageLabel=node('span');
  const next=button('›',()=>changePage(1));
  next.setAttribute('aria-label','Neste side');
  const fit=button('Hele siden',()=>{fitPage=true;zoom=1;showPage();});
  const larger=button('+',()=>{fitPage=false;zoom=Math.min(2,zoom+.25);showPage();});
  larger.setAttribute('aria-label','Forstørr PDF');
  const smaller=button('−',()=>{fitPage=false;zoom=Math.max(.5,zoom-.25);showPage();});
  smaller.setAttribute('aria-label','Forminsk PDF');
  const width=button('Sidebredde',()=>{fitPage=false;zoom=1;showPage();});
  const remove=button('Fjern PDF',removeDocument,'ui-button quiet');
  controls.append(previous,pageLabel,next,smaller,larger,fit,width,remove);
  const viewer=node('div','school-viewer');
  viewer.tabIndex=0;viewer.setAttribute('aria-label','PDF-visning');
  const image=node('img','school-pdf-page');
  image.alt='';image.draggable=false;
  const empty=node('p','subtle','Ingen skoleplaner ennå. Last opp en PDF fra mobilen.');
  viewer.append(image,empty);
  const panel=node('aside','school-upload-panel');
  panel.hidden=true;
  section.append(heading,tabs,documents,controls,viewer,panel);
  const calendar=document.getElementById('calendar');
  calendar.after(section);
  const menu=button('',()=>app.go('school'),'ui-button nav');
  menu.dataset.tab='school';
  const icon=node('span');icon.dataset.icon='school';icon.innerHTML=app.icon('school');
  menu.append(icon,document.createTextNode('Skoleplaner'));
  document.querySelector('[data-tab=calendar]').after(menu);
  let child='Matilda',items=[],selected='',page=0,zoom=1,fitPage=false,uploadOpen=false,signature='',imageKey='';
  try{const saved=localStorage.getItem('skylit.school.child');if(children.includes(saved))child=saved;}catch(_){}
  const tabButtons=new Map();
  children.forEach(name=>{
    const tab=button(name,()=>selectChild(name));
    tab.id='school-tab-'+name;
    tab.setAttribute('role','tab');
    tab.setAttribute('aria-controls','school-content');
    tabs.append(tab);tabButtons.set(name,tab);
  });
  viewer.id='school-content';
  viewer.setAttribute('role','tabpanel');
  function stopUpload(){
    if(native&&native.photoManagementStatus){
      const state=JSON.parse(native.photoManagementStatus());
      if(state.schoolChild)native.photoManagementStop();
    }
    uploadOpen=false;panel.hidden=true;signature='';
  }
  function selectChild(name){
    if(child!==name){stopUpload();child=name;selected='';page=0;imageKey='';}
    try{localStorage.setItem('skylit.school.child',child);}catch(_){}
    refresh();
  }
  function refresh(){
    if(!native||!native.schoolPlanList){empty.textContent='PDF-visning er tilgjengelig på rammen.';return;}
    const state=JSON.parse(native.schoolPlanList(child));
    const nextItems=Array.isArray(state.documents)?state.documents:[];
    const changed=JSON.stringify(items)!==JSON.stringify(nextItems);
    items=nextItems;
    if(!items.some(item=>item.id===selected)){selected=items[0]?.id||'';page=0;}
    for(const [name,tab] of tabButtons){
      const active=name===child;tab.setAttribute('aria-selected',String(active));
      tab.classList.toggle('active',active);
      tab.tabIndex=active?0:-1;
    }
    viewer.setAttribute('aria-labelledby','school-tab-'+child);
    if(changed||documents.dataset.child!==child){
      documents.dataset.child=child;documents.replaceChildren();
      for(const item of items){
        const choice=button(item.title,()=>{selected=item.id;page=0;imageKey='';refresh();});
        choice.dataset.document=item.id;documents.append(choice);
      }
    }
    documents.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.document===selected)));
    showPage();
  }
  tabs.onkeydown=event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    const current=children.indexOf(child);
    const index=event.key==='Home'?0:event.key==='End'?2:(current+(event.key==='ArrowRight'?1:2))%3;
    selectChild(children[index]);tabButtons.get(child).focus();
  };
  function showPage(){
    const document=items.find(item=>item.id===selected);
    controls.hidden=!document;image.hidden=!document;empty.hidden=!!document;
    if(!document){image.removeAttribute('src');imageKey='';return;}
    page=Math.min(page,document.pages-1);
    previous.disabled=page<=0;next.disabled=page>=document.pages-1;
    pageLabel.textContent='Side '+(page+1)+' av '+document.pages;
    const available=Math.max(240,viewer.clientWidth-24);
    const height=Math.max(160,viewer.clientHeight-24);
    const displayWidth=fitPage?Math.min(available,height*document.width/document.height):available*zoom;
    image.style.width=displayWidth+'px';
    image.style.height='auto';
    image.alt=document.title+' · side '+(page+1);
    const pixels=Math.min(2000,Math.round(displayWidth*(window.devicePixelRatio||1)));
    const key=child+':'+selected+':'+page+':'+pixels;
    if(key!==imageKey){
      imageKey=key;
      image.src='https://appassets.androidplatform.net/school-page?child='+encodeURIComponent(child)+'&id='+selected+'&page='+page+'&width='+pixels;
      viewer.scrollTop=0;viewer.scrollLeft=0;
    }
  }
  image.onerror=()=>{empty.hidden=false;empty.textContent='Kunne ikke vise PDF-siden. Velg dokumentet på nytt.';};
  image.onload=()=>{empty.hidden=true;};
  function changePage(offset){page+=offset;imageKey='';showPage();}
  function removeDocument(){
    const item=items.find(item=>item.id===selected);
    if(!item||!confirm('Fjerne «'+item.title+'» fra '+child+'?'))return;
    if(!native.schoolPlanRemove(child,selected)){app.notify('Kunne ikke fjerne PDF-en.');return;}
    imageKey='';refresh();
  }
  function startUpload(){
    if(!native||!native.schoolPlanStartUpload){app.notify('Opplasting åpnes på rammen.');return;}
    if(!native.schoolPlanStartUpload(child)){app.notify('Kunne ikke starte opplasting. Sjekk Wi-Fi.');return;}
    uploadOpen=true;panel.hidden=false;signature='';paintUpload();
  }
  function paintUpload(){
    if(!uploadOpen)return;
    const state=JSON.parse(native.photoManagementStatus());
    if(!state.active||state.schoolChild!==child){
      panel.replaceChildren(node('p',null,'Forbindelsen er avsluttet. Lag en ny QR-kode.'));
      panel.append(button('Ny QR-kode',startUpload),button('Lukk',stopUpload));
      return;
    }
    const key=JSON.stringify(state);
    if(key===signature)return;
    signature=key;panel.replaceChildren(node('h2',null,'Last opp til '+child));
    if(state.request){
      panel.append(node('p',null,'Stemmer dette nummeret med mobilen?'),node('strong','school-pair-number',(state.number||'').replace(/(...)(...)/,'$1 $2')));
      panel.append(button('Godkjenn',()=>{native.photoManagementDecide(state.request,true);signature='';paintUpload();}),button('Avvis',()=>{native.photoManagementDecide(state.request,false);signature='';paintUpload();}));
    }else if(state.paired){
      panel.append(node('p',null,'Mobilen er tilkoblet. Velg PDF-ene på mobilen.'));
    }else if(state.invite){
      panel.append(node('p',null,'Skann med mobilen på samme Wi-Fi. Godkjenn forbindelsen på rammen.'));
      const qr=SkylitPhonePairing.canvas(state.invite,document);
      qr.setAttribute('aria-label','QR-kode for PDF-opplasting til '+child);
      panel.append(qr);
    }
    panel.append(button('Avslutt opplasting',stopUpload,'ui-button quiet'));
  }
  window.addEventListener('skylit-tab',event=>{
    if(event.detail==='school')refresh();
    else if(uploadOpen)stopUpload();
  });
  window.addEventListener('skylit-library-native',()=>{if(app.status().tab==='school')refresh();});
  new ResizeObserver(()=>{if(app.status().tab==='school')showPage();}).observe(viewer);
  setInterval(()=>{if(app.status().tab==='school'){refresh();paintUpload();}},1000);
  refresh();
})();
