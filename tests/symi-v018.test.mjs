import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const hub=readFileSync(new URL('../symi-course-hub-v018.js',import.meta.url),'utf8');
const otj=readFileSync(new URL('../symi-otj-share-v017.js',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../manifest.webmanifest',import.meta.url),'utf8'));

test('Symi 0.18 makes Course the parent of delivery',()=>{
  assert.match(hub,/COURSE DELIVERY/);
  assert.match(hub,/Sessions & lesson plans/);
  assert.match(hub,/Build course sessions/);
  assert.match(hub,/teachingClassId/);
  assert.match(hub,/symi\.course\.sessions\.v1/);
  assert.match(hub,/symi\.session\.lesson\.v1/);
});

test('delivery setup creates matching recurring registers and dated sessions',()=>{
  assert.match(hub,/generateDates\(/);
  assert.match(hub,/recurrence=\{type:'weekly',interval,weekdays:\[day\]/);
  assert.match(hub,/registerId:reg\?\.id/);
  assert.match(hub,/lessonPlanId:lp\?\.id/);
});

test('migration QR carries previous figures without learner identity',()=>{
  assert.match(hub,/NISI:SYMI:MIGRATION:1/);
  assert.match(hub,/t:'migration'/);
  assert.match(hub,/om:otjMinutes/);
  assert.match(hub,/a:\{p,em:expectedMinutes,am:attendedMinutes,x:Boolean\(expectedMinutes\)\}/);
  const payload=hub.match(/const payload=\{v:1,t:'migration'[^;]+/s)?.[0]||'';
  assert.doesNotMatch(payload,/learnerId|learnerName|name:/);
});

test('normal Symi OTJ receipts include attendance and remain anonymous',()=>{
  assert.match(otj,/a:attendanceSnapshot\(learnerId\)/);
  assert.match(otj,/NISI:SYMI:COLLEGEOTJ:1/);
  const payload=otj.match(/function payload\([^}]+return\{[^}]+/s)?.[0]||'';
  assert.doesNotMatch(payload,/name:|learnerId:/);
});

test('0.18 shell, cache and manifest are aligned',()=>{
  assert.match(index,/symi-build" content="0\.18\.0"/);
  assert.match(index,/symi-course-hub-v018\.js\?v=0\.18\.0/);
  assert.match(sw,/const BUILD='0\.18\.0'/);
  assert.match(sw,/symi-course-hub-v018\.js/);
  assert.equal(manifest.short_name,'Symi');
  assert.equal(manifest.start_url,'./?v=0.18.0');
});
