import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const homeCss=readFileSync(new URL('../symi-home-polish-v025.css',import.meta.url),'utf8');
const homeJs=readFileSync(new URL('../symi-home-polish-v025.js',import.meta.url),'utf8');
const calendar=readFileSync(new URL('../symi-week-calendar-v023.js',import.meta.url),'utf8');
const managerCss=readFileSync(new URL('../symi-calendar-manager-v025.css',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');

test('Symi home removes the old large header treatment and matches the centred assistant layout',()=>{
  assert.match(homeCss,/\.app-header \.brand-word,\.app-header \.assessor-label\{display:none/);
  assert.match(homeCss,/top:43\.5dvh/);
  assert.match(homeCss,/width:164px/);
  assert.match(homeCss,/bottom:0/);
  assert.match(homeJs,/Tap me to get started/);
  assert.match(homeJs,/Sym<span class="app-brand-i">i<\/span>/);
  assert.match(index,/symi-home-polish-v025\.css\?v=0\.25\.0/);
});

test('home copy is normalised to one brand line and one hint',()=>{
  assert.match(homeJs,/copy\.innerHTML=expected/);
  assert.match(homeJs,/slice\(1\)\.forEach\(el=>el\.remove\(\)\)/);
  assert.match(homeCss,/\.staff-face-copy::before,.staff-face-copy::after/);
});

test('calendar items open complete details',()=>{
  assert.match(calendar,/data-scal-event=/);
  assert.match(calendar,/scal-detail-grid/);
  assert.match(calendar,/detail\('Date'/);
  assert.match(calendar,/detail\('Time'/);
  assert.match(calendar,/detail\('Class'/);
  assert.match(calendar,/detail\('Course'/);
  assert.match(calendar,/detail\('Lesson plan'/);
  assert.match(calendar,/detail\('Location \/ room'/);
  assert.match(managerCss,/\.scal-detail/);
});

test('manual Symi bookings can be edited rescheduled and deleted',()=>{
  assert.match(calendar,/Edit \/ reschedule/);
  assert.match(calendar,/Delete booking/);
  assert.match(calendar,/name="date" type="date"/);
  assert.match(calendar,/data-booking-id/);
  assert.match(calendar,/window\.confirm/);
  assert.match(managerCss,/\.scal-danger/);
});

test('recurring classes remain timetable-driven and show lesson/session details',()=>{
  assert.match(calendar,/editable:false,removable:false/);
  assert.match(calendar,/sessionNumber:n/);
  assert.match(calendar,/lessonTitle:lesson\?\.title/);
  assert.match(calendar,/Change the class timetable to alter its recurring dates/);
});
