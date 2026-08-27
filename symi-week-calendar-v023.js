(() => {
  'use strict';

  const BUILD='0.23.0';
  const STATE_KEY='samos.classroom.data';
  const BOOKING_KEY='symi.calendar.bookings.v1';
  const DAY_RANGE=90;
  const WEEKDAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const pad=n=>String(n).padStart(2,'0');
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const dateKey=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const fromKey=key=>{const [y,m,d]=String(key).split('-').map(Number);return new Date(y,(m||1)-1,d||1,12,0,0,0)};
  const addDays=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);x.setDate(x.getDate()+n);return x};
  const prettyDate=key=>fromKey(key).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const uid=()=>`booking-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const clean=(v,n=160)=>String(v??'').trim().slice(0,n);
  const sessionCache=new Map();

  function readState(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')||{}}catch(_){return {}}}
  function readBookings(){try{const x=JSON.parse(localStorage.getItem(BOOKING_KEY)||'[]');return Array.isArray(x)?x:[]}catch(_){return []}}
  function writeBookings(rows){localStorage.setItem(BOOKING_KEY,JSON.stringify(rows))}
  function startOfWeek(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
  function weekDistance(a,b){return Math.round((startOfWeek(b)-startOfWeek(a))/(7*86400000))}
  function monthDistance(a,b){return (b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth())}
  function recurrence(c){const r=c?.recurrence||{};return {type:r.type==='monthly'?'monthly':'weekly',interval:Math.max(1,Number(r.interval)||1)}}
  function scheduleRows(c){return (Array.isArray(c?.schedule)?c.schedule:[]).slice().sort((a,b)=>{const ai=a.dayOfMonth||WEEKDAYS.indexOf(a.day),bi=b.dayOfMonth||WEEKDAYS.indexOf(b.day);return ai-bi||String(a.start||'').localeCompare(String(b.start||''))})}
  function inRange(c,key){return (!c.startDate||key>=c.startDate)&&(!c.endDate||key<=c.endDate)}

  function slotOccurs(c,slot,key){
    if(!inRange(c,key))return false;
    const d=fromKey(key),r=recurrence(c),start=c.startDate?fromKey(c.startDate):null;
    if(slot.dayOfMonth){
      if(d.getDate()!==Number(slot.dayOfMonth))return false;
      if(!start)return true;
      const diff=monthDistance(start,d);return diff>=0&&diff%r.interval===0;
    }
    if(WEEKDAYS[d.getDay()]!==slot.day)return false;
    if(!start)return true;
    const diff=weekDistance(start,d);return diff>=0&&diff%r.interval===0;
  }

  function sessionNumberFor(c,key,targetSlot){
    if(!c.startDate)return 0;
    const cacheKey=`${c.id}|${key}|${targetSlot.dayOfMonth||targetSlot.day}|${targetSlot.start||''}`;
    if(sessionCache.has(cacheKey))return sessionCache.get(cacheKey);
    let count=0,d=fromKey(c.startDate),end=fromKey(key),guard=0;
    while(d<=end&&guard<1500){
      const k=dateKey(d);
      for(const slot of scheduleRows(c)){
        if(!slotOccurs(c,slot,k))continue;
        count++;
        const sameDay=k===key;
        const sameSlot=String(slot.dayOfMonth||slot.day)===String(targetSlot.dayOfMonth||targetSlot.day)&&String(slot.start||'')===String(targetSlot.start||'');
        if(sameDay&&sameSlot){sessionCache.set(cacheKey,count);return count}
      }
      d=addDays(d,1);guard++;
    }
    sessionCache.set(cacheKey,count);return count;
  }

  function lessonFor(state,c,sessionNumber){
    if(!c.courseId||!sessionNumber)return null;
    const course=(state.courses||[]).find(x=>x.id===c.courseId)||null;
    const lessons=(state.resources||[]).filter(r=>r.type==='lesson-plan'&&r.courseId===c.courseId);
    let lesson=lessons.find(r=>Number(r.sessionNumber)===Number(sessionNumber))||null;
    if(!lesson&&course?.lessonPlanIds?.[sessionNumber-1])lesson=(state.resources||[]).find(r=>r.id===course.lessonPlanIds[sessionNumber-1])||null;
    return lesson;
  }

  function classEvents(key,state=readState()){
    const rows=[];
    for(const c of (state.teachingClasses||[])){
      for(const slot of scheduleRows(c)){
        if(!slotOccurs(c,slot,key))continue;
        const n=sessionNumberFor(c,key,slot),lesson=lessonFor(state,c,n);
        rows.push({id:`class-${c.id}-${key}-${slot.start||''}`,source:'class',type:'class',date:key,time:slot.start||'',title:c.name||'Class',note:[slot.end?`${slot.start||''}–${slot.end}`:'',c.room?`Room ${c.room}`:'',lesson?`Lesson ${n}: ${lesson.title}`:(n?`Session ${n}`:'')].filter(Boolean).join(' · '),lessonId:lesson?.id||'',removable:false});
      }
    }
    return rows;
  }

  function eventsFor(key){
    const state=readState();
    const rows=classEvents(key,state);
    readBookings().filter(x=>x.date===key).forEach(x=>rows.push({...x,source:'booking',removable:true}));
    return rows.sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99'))||String(a.title||'').localeCompare(String(b.title||'')));
  }

  function dayHtml(d){
    const key=dateKey(d),today=key===dateKey(new Date()),count=eventsFor(key).length,weekday=d.toLocaleDateString('en-GB',{weekday:'short'}).toUpperCase(),month=d.toLocaleDateString('en-GB',{month:'short'}).toUpperCase();
    return `<button type="button" class="scal-day${today?' is-today':''}" data-scal-date="${key}" ${today?'aria-current="date"':''} aria-label="${esc(prettyDate(key))}${count?`, ${count} item${count===1?'':'s'}`:''}"><span>${weekday}</span><strong>${d.getDate()}</strong><small>${today?'TODAY':month}</small><i>${count?`${'<b></b>'.repeat(Math.min(3,count))}${count>3?`<em>${count}</em>`:''}`:''}</i></button>`;
  }

  function calendarHtml(){const today=new Date(),days=[];for(let i=-DAY_RANGE;i<=DAY_RANGE;i++)days.push(dayHtml(addDays(today,i)));return `<section class="scal-shell" aria-label="Symi weekday calendar"><div class="scal-head"><span>Teaching calendar</span><button type="button" data-scal-today>Today</button></div><div class="scal-strip" id="symiCalendarStrip">${days.join('')}</div></section>`}
  function mount(){const arches=document.querySelector('.vh-arches');if(!arches)return false;const holder=document.createElement('div');holder.className='scal-home-holder';holder.innerHTML=calendarHtml();arches.replaceWith(holder);requestAnimationFrame(scrollToday);return true}
  function refresh(){const strip=document.getElementById('symiCalendarStrip');if(!strip)return;const selected=strip.querySelector('.scal-day.is-selected')?.dataset.scalDate||'',today=new Date(),days=[];sessionCache.clear();for(let i=-DAY_RANGE;i<=DAY_RANGE;i++)days.push(dayHtml(addDays(today,i)));strip.innerHTML=days.join('');if(selected)strip.querySelector(`[data-scal-date="${selected}"]`)?.classList.add('is-selected')}
  function scrollToday(){document.querySelector('.scal-day[aria-current="date"]')?.scrollIntoView({behavior:'instant',block:'nearest',inline:'center'})}

  function layer(){let el=document.getElementById('symiCalendarLayer');if(!el){el=document.createElement('section');el.id='symiCalendarLayer';el.className='scal-layer';el.hidden=true;document.body.appendChild(el)}return el}
  function closeLayer(){const el=layer();el.hidden=true;el.innerHTML=''}
  function typeLabel(type){return ({class:'Class / session',lesson:'Lesson',meeting:'Meeting',other:'Booking'})[type]||'Booking'}
  function eventRow(e){return `<article class="scal-event"><span data-type="${esc(e.type||'other')}"></span><div><small>${esc([e.time,typeLabel(e.type)].filter(Boolean).join(' · '))}</small><strong>${esc(e.title||typeLabel(e.type))}</strong>${e.note?`<p>${esc(e.note)}</p>`:''}</div>${e.removable?`<button type="button" data-scal-delete="${esc(e.id)}">×</button>`:''}</article>`}

  function openDay(key,formOpen=false){
    document.querySelectorAll('.scal-day').forEach(b=>b.classList.toggle('is-selected',b.dataset.scalDate===key));
    const state=readState(),events=eventsFor(key),classes=state.teachingClasses||[],lessons=(state.resources||[]).filter(r=>r.type==='lesson-plan');
    const el=layer();el.hidden=false;
    el.innerHTML=`<div class="scal-scrim" data-scal-close></div><div class="scal-sheet" role="dialog" aria-modal="true"><header><div><small>SYMI CALENDAR</small><h2>${esc(prettyDate(key))}</h2></div><button type="button" data-scal-close>×</button></header><div class="scal-events">${events.length?events.map(eventRow).join(''):'<div class="scal-empty">Nothing planned for this day.</div>'}</div><button class="scal-add" type="button" data-scal-add="${key}">+ Add booking</button>${formOpen?`<form class="scal-form" data-scal-form data-date="${key}"><div class="scal-grid"><label><span>Type</span><select name="type"><option value="class">Class / session</option><option value="lesson">Lesson</option><option value="meeting">Meeting</option><option value="other">Other</option></select></label><label><span>Time</span><input name="time" type="time" value="09:00"></label></div><label><span>Class (optional)</span><select name="classId"><option value="">No class</option>${classes.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select></label><label><span>Lesson plan (optional)</span><select name="lessonId"><option value="">No lesson</option>${lessons.map(l=>`<option value="${esc(l.id)}">${esc(l.title)}</option>`).join('')}</select></label><label><span>Title / note (optional)</span><input name="title" maxlength="120" placeholder="Add a short note"></label><button type="submit">Save booking</button></form>`:''}</div>`;
  }

  function saveBooking(form){
    const state=readState(),fd=new FormData(form),type=clean(fd.get('type'),24)||'other',classId=clean(fd.get('classId'),100),lessonId=clean(fd.get('lessonId'),100),c=(state.teachingClasses||[]).find(x=>x.id===classId),l=(state.resources||[]).find(x=>x.id===lessonId),typed=clean(fd.get('title'),120);
    const title=typed||(type==='lesson'&&l?.title?l.title:type==='class'&&c?.name?c.name:typeLabel(type));
    const note=[c&&type!=='class'?c.name:'',l&&type!=='lesson'?l.title:''].filter(Boolean).join(' · ');
    const item={id:uid(),date:clean(form.dataset.date,20),time:clean(fd.get('time'),10),type,classId,lessonId,title,note,createdAt:Date.now()};
    const rows=readBookings();rows.push(item);writeBookings(rows);refresh();openDay(item.date,false);
  }
  function removeBooking(id){const rows=readBookings(),item=rows.find(x=>x.id===id);if(!item)return;writeBookings(rows.filter(x=>x.id!==id));refresh();openDay(item.date,false)}

  document.addEventListener('click',e=>{
    const day=e.target.closest?.('[data-scal-date]');if(day){e.preventDefault();openDay(day.dataset.scalDate);return}
    if(e.target.closest?.('[data-scal-today]')){e.preventDefault();scrollToday();return}
    const add=e.target.closest?.('[data-scal-add]');if(add){e.preventDefault();openDay(add.dataset.scalAdd,true);return}
    const del=e.target.closest?.('[data-scal-delete]');if(del){e.preventDefault();removeBooking(del.dataset.scalDelete);return}
    if(e.target.closest?.('[data-scal-close]')){e.preventDefault();closeLayer()}
  },true);
  document.addEventListener('submit',e=>{const form=e.target.closest?.('[data-scal-form]');if(!form)return;e.preventDefault();saveBooking(form)},true);

  function start(){mount();const observer=new MutationObserver(()=>mount());observer.observe(document.getElementById('staffApp')||document.body,{childList:true,subtree:true})}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

  window.SymiWeekCalendar=Object.freeze({build:BUILD,eventsFor,classEvents,readBookings,dateKey});
})();
