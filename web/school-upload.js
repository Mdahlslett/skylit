'use strict';
(() => {
  const $=id=>document.getElementById(id);
  let ended=false,busy=false,poll=0;
  const status=text=>{$('status').textContent=text;};
  async function request(path,options){
    const response=await fetch(path,Object.assign({credentials:'same-origin',cache:'no-store'},options));
    let data={};try{data=await response.json();}catch(_){}
    if(!response.ok)throw Error(data.error||'Forbindelsen er utløpt. Skann en ny QR-kode på rammen.');
    return data;
  }
  function render(data){
    $('heading').textContent='Skoleplaner · '+data.child;
    $('child').textContent=data.child;
    $('pair').hidden=true;$('upload').hidden=false;
    $('documents').textContent='';
    for(const file of data.documents){
      const item=document.createElement('li');item.textContent=file.title+' · '+file.pages+' sider';$('documents').append(item);
    }
  }
  async function refresh(){render(await request('/school-state'));}
  async function wait(){
    const state=await request('/pair-state');
    if(state.state==='paired'){
      await refresh();status('Tilkoblet. PDF-ene lagres på rammen.');
      poll=setInterval(()=>{if(!busy)refresh().catch(stop);},10000);
      return;
    }
    $('number').textContent=(state.number||'').replace(/(...)(...)/,'$1 $2');
    status('Venter på godkjenning på rammen.');
    poll=setTimeout(()=>wait().catch(stop),1000);
  }
  function stop(error){
    if(ended)return;
    ended=true;clearInterval(poll);clearTimeout(poll);
    $('upload').hidden=true;$('pair').hidden=true;
    status(error.message||'Forbindelsen er avsluttet. Skann en ny QR-kode.');
  }
  async function connect(){
    const ticket=new URLSearchParams(location.hash.slice(1)).get('pair');
    if(location.hash)history.replaceState(null,'',location.pathname);
    if(ticket){
      if(!/^[a-f0-9]{64}$/.test(ticket))throw Error('Ugyldig QR-kode.');
      await request('/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticket})});
    }
    await wait();
  }
  $('send').onclick=async()=>{
    const files=Array.from($('files').files||[]);
    if(!files.length){status('Velg en PDF først.');return;}
    busy=true;$('send').disabled=true;$('files').disabled=true;
    try{
      for(let i=0;i<files.length;i++){
        const file=files[i];
        if(file.size>10*1024*1024)throw Error(file.name+' er større enn 10 MB.');
        if(!/\.pdf$/i.test(file.name))throw Error('Velg PDF-filer.');
        status('Laster opp '+(i+1)+' av '+files.length+' …');
        await request('/upload-pdf',{method:'POST',headers:{'Content-Type':'application/pdf','X-Skylit-Filename':encodeURIComponent(file.name)},body:file});
        await refresh();
      }
      $('files').value='';status('PDF-ene er lastet opp og klare på rammen.');
    }catch(error){status(error.message||'Kunne ikke laste opp PDF-en.');}
    finally{busy=false;$('send').disabled=ended;$('files').disabled=ended;}
  };
  connect().catch(stop);
})();
