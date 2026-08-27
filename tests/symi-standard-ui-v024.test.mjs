import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css=readFileSync(new URL('../symi-standard-ui-v024.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../symi-standard-ui-v024.js',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=readFileSync(new URL('../service-worker.js',import.meta.url),'utf8');

test('Symi 0.24 loads standardized UI last and offline',()=>{
  assert.match(index,/symi-standard-ui-v024\.css\?v=0\.24\.0/);
  assert.match(index,/symi-standard-ui-v024\.js\?v=0\.24\.0/);
  assert.ok(index.indexOf('symi-standard-ui-v024.css')>index.indexOf('symi-week-calendar-v023.css'));
  assert.match(sw,/symi-standard-ui-v024\.css/);
  assert.match(sw,/symi-standard-ui-v024\.js/);
});

test('Symi brand has a green i and classroom lockup',()=>{
  assert.match(css,/--std-brand:#38A96B/);
  assert.match(index,/Sym<span class="app-brand-i">i<\/span>/);
  assert.match(index,/Classroom assistant/);
  assert.match(js,/Sym<span class="app-brand-i">i<\/span>/);
});

test('Symi uses the same professional component geometry as Milos',()=>{
  assert.match(css,/--std-radius:18px/);
  assert.match(css,/\.staff-card,\.ta-card/);
  assert.match(css,/\.samos-row,\.class-learner-row/);
  assert.match(css,/\.blue-button,\.ta-actions \.primary/);
  assert.match(css,/\.staff-form input/);
  assert.match(css,/\.staff-page-head/);
});

test('Symi home and calendar use the standardized shell',()=>{
  assert.match(css,/\.staff-face-panel\.progress-panel/);
  assert.match(css,/\.staff-face-copy strong/);
  assert.match(css,/\.scal-day\.is-today/);
  assert.match(index,/Tap me to get started/);
});
