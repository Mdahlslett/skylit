'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SkylitWeatherArt=api;})(typeof window!=='undefined'?window:globalThis,function(){
  function describe(code){
    if(code===0)return {label:'Klarvær',icon:'sun',scene:'clear'};
    if(code===1||code===2)return {label:'Delvis skyet',icon:'sun',scene:'partly-cloudy'};
    if(code===3)return {label:'Skyet',icon:'cloud',scene:'cloudy'};
    if(code===45||code===48)return {label:'Tåke',icon:'cloud',scene:'fog'};
    if([51,53,55,56,57,61,63,65,66,67].includes(code))return {label:'Regn',icon:'rain',scene:'rain'};
    if([71,73,75,77].includes(code))return {label:'Snø',icon:'snow',scene:'snow'};
    if([80,81,82].includes(code))return {label:'Regnbyger',icon:'rain',scene:'rain-showers'};
    if([85,86].includes(code))return {label:'Snøbyger',icon:'snow',scene:'snow-showers'};
    if([95,96,99].includes(code))return {label:'Tordenvær',icon:'rain',scene:'storm'};
    return {label:'Værdata utilgjengelig',icon:'cloud',scene:'cloudy'};
  }
  function apply(element,code,isDay){
    const condition=describe(code);
    element.dataset.weather=condition.scene;
    element.classList.toggle('night',!isDay);
  }
  return {describe,apply};
});
