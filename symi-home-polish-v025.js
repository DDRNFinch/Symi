(()=>{
  'use strict';
  let queued=false;
  const word=()=> 'Sym<span class="app-brand-i">i</span>';
  function patch(){
    queued=false;
    const panel=document.getElementById('samosFacePanel');
    if(panel){
      const copy=panel.querySelector('.staff-face-copy');
      if(copy){
        const expected=`<strong>${word()}</strong><span>Tap me to get started</span>`;
        if(copy.innerHTML!==expected)copy.innerHTML=expected;
      }
      [...panel.querySelectorAll('.staff-face-copy')].slice(1).forEach(el=>el.remove());
    }
    const greeting=document.querySelector('#samosOverlay .evia-greeting');
    if(greeting&&greeting.innerHTML!==word())greeting.innerHTML=word();
  }
  function schedule(){if(queued)return;queued=true;queueMicrotask(patch)}
  function start(){patch();new MutationObserver(records=>{if(records.some(r=>r.type==='childList'||r.type==='characterData'))schedule()}).observe(document.body,{childList:true,subtree:true,characterData:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.SymiHomePolish=Object.freeze({version:'0.25',patch});
})();
