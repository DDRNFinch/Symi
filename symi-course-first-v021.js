(()=>{
'use strict';
const VERSION='0.21.0',STORE='samos.classroom.data',SESSIONS='symi.course.sessions.v1',STYLE='symi-course-first-v021-style';let queued=false;
const read=(k,d)=>{try{const x=JSON.parse(localStorage.getItem(k)||'null');return x??d}catch{return d}};
function state(){return read(STORE,null)}
function style(){if(document.getElementById(STYLE))return;const s=document.createElement('style');s.id=STYLE;s.textContent=`
.symi-lesson-delivered{background:#edf8f1!important;border-color:#d5eadc!important}.symi-lesson-next{background:#fff8d9!important;border-color:#f0e4aa!important}.symi-lesson-delivered::after{content:'Taught';font-size:.58rem;font-weight:800;color:#4c8366;margin-left:.45rem}.symi-lesson-next::after{content:'Next';font-size:.58rem;font-weight:800;color:#8a742b;margin-left:.45rem}`;document.head.appendChild(s)}
function sessions(){const x=read(SESSIONS,{});return x&&typeof x==='object'?x:{}}
function courseIdFromPage(s){return String(s?.selectedCourseId||'')}
function completed(row,s){return Boolean(row?.completed||row?.status==='complete'||(s?.history||[]).some(h=>String(h.classId)===String(row?.registerId)&&String(h.date)===String(row?.date)))}
function patchHome(){const wrap=document.querySelector('.vh-arches');if(!wrap)return;const course=wrap.querySelector('[data-home-metric="courses"]');if(course&&wrap.firstElementChild!==course)wrap.prepend(course);const title=course?.querySelector('strong');if(title)title.textContent='MY COURSES';if(course)course.setAttribute('aria-label','Open my courses')}
function patchCourseList(){const app=document.getElementById('staffApp');if(!app)return;const head=app.querySelector('.staff-page-head h1');if(head&&head.textContent.trim()==='Official courses')head.textContent='My courses';const sub=app.querySelector('.staff-page-head small');if(head?.textContent.trim()==='My courses'&&sub)sub.textContent='CLASSROOM';const add=app.querySelector('[data-add-course]');if(add)add.textContent='+ Create course';const empty=app.querySelector('.samos-empty p');if(empty&&/official KSB wording/i.test(empty.textContent||''))empty.textContent='Create a course and Symi will build the SOW, lesson plans and teaching sequence.'}
function patchLessonStatus(){const s=state();if(!s)return;const cid=courseIdFromPage(s);if(!cid)return;const rows=Array.isArray(sessions()[cid])?sessions()[cid].slice():[];if(!rows.length)return;const done=new Set(rows.filter(r=>completed(r,s)).map(r=>String(r.lessonPlanId||'')));const next=rows.filter(r=>!completed(r,s)).sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')))[0];const nextId=String(next?.lessonPlanId||'');document.querySelectorAll('[data-view-resource]').forEach(el=>{const id=String(el.getAttribute('data-view-resource')||'');const row=el.closest('.samos-row,.sow-session-row')||el;row.classList.remove('symi-lesson-delivered','symi-lesson-next');if(done.has(id))row.classList.add('symi-lesson-delivered');else if(nextId&&id===nextId)row.classList.add('symi-lesson-next')})}
function patch(){style();patchHome();patchCourseList();patchLessonStatus()}
function queue(){if(queued)return;queued=true;setTimeout(()=>{queued=false;patch()},0)}
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',queue,true);window.addEventListener('pageshow',queue);setTimeout(queue,200);
window.SymiCourseFirst=Object.freeze({version:VERSION,refresh:queue});
})();
