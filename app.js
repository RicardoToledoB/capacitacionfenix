'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const pad=n=>String(n).padStart(2,'0');
const mods=[...new Set(tutoriales.map(t=>t.modulo))];
const status={};
let current=tutoriales[0].id,tab='video';
$('tc').textContent=tutoriales.length;$('mc').textContent=mods.length;
for(const m of mods){const o=document.createElement('option');o.value=o.textContent=m;$('module').append(o)}
$('modules').innerHTML=mods.map((m,i)=>`<button class="module" data-module="${i}"><span class="num">MÓDULO ${pad(i+1)}</span><strong>${esc(m)}</strong><small>${tutoriales.filter(t=>t.modulo===m).length} tutoriales →</small></button>`).join('');
function render(){
 const query=norm($('search').value).trim();
 const list=tutoriales.filter(t=>(!$('module').value||t.modulo===$('module').value)&&norm([t.titulo,t.perfil,t.modulo,t.descripcion,...t.pasos].join(' ')).includes(query));
 if(!list.some(t=>t.id===current))current=list[0]?.id;
 document.querySelectorAll('.module').forEach(b=>{const active=mods[b.dataset.module]===$('module').value;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 let prev='';$('catalog').innerHTML=list.map(t=>{const h=prev===t.modulo?'':`<h3>${esc(t.modulo)}</h3>`;prev=t.modulo;return h+`<button data-id="${t.id}" class="${t.id===current?'active':''}" ${t.id===current?'aria-current="true"':''}><span>${pad(t.numero)}</span><span>${esc(t.titulo)}</span></button>`}).join('')||'<p>No se encontraron tutoriales.</p>';
 renderDetail();
}
function links(t,s){return `<div class="resourcebar">${s.doc?`<a class="doclink" href="${esc(t.documento)}" target="_blank" rel="noopener">Abrir manual PDF ↗</a><a class="doclink secondary" href="${esc(t.documento)}" download>Descargar PDF</a>`:''}${s.video?`<a class="doclink secondary" href="${esc(t.video)}" download>Descargar video</a>`:''}</div>`}
function renderDetail(){
 const t=tutoriales.find(t=>t.id===current);if(!t){$('detail').textContent='Prueba con otra búsqueda.';return}
 const s=status[t.id]||{};
 const video=s.video?`<video controls playsinline preload="metadata" src="${esc(t.video)}"><track kind="captions" src="${esc(t.subtitulos)}" srclang="es" label="Español"></video>`:`<div class="placeholder"><strong>▷</strong><b>${s.video===undefined?'Comprobando disponibilidad…':'Video no disponible'}</b><small>Material de capacitación FÉNIX</small></div>`;
 const doc=s.doc?`<iframe title="Manual PDF: ${esc(t.titulo)}" src="${esc(t.documento)}" loading="lazy"></iframe>`:`<p>${s.doc===undefined?'Comprobando disponibilidad…':'Manual no disponible.'}</p>`;
 $('detail').innerHTML=`<div class="tag">TUTORIAL ${pad(t.numero)} · ${esc(t.modulo)} · ${esc(t.perfil)}</div><h2>${esc(t.titulo)}</h2><p class="guide-ref">Guía original ${esc(t.guia)} · ${Math.floor(t.duracion/60)} min ${String(Math.round(t.duracion)%60).padStart(2,'0')} s</p><div class="tabs"><button data-tab="video" class="${tab==='video'?'active':''}" aria-pressed="${tab==='video'}">▶ Videotutorial</button><button data-tab="doc" class="${tab==='doc'?'active':''}" aria-pressed="${tab==='doc'}">▤ Documentación</button></div>${tab==='video'?video:`<h3>Manual de usuario</h3>${doc}`}<div id="resource-links">${links(t,s)}</div>${t.descripcion?`<h3>Antes de empezar</h3><p>${esc(t.descripcion)}</p>`:''}${t.pasos.length?'<h3>Paso a paso</h3><ol>'+t.pasos.map(p=>'<li>'+esc(p)+'</li>').join('')+'</ol>':''}`;
 $('detail').querySelector('video')?.addEventListener('error',()=>{const v=$('detail').querySelector('video');if(v){const p=document.createElement('p');p.textContent='No se pudo reproducir el video. Intenta descargarlo o consultar el manual.';v.after(p)}},{once:true});
}
$('catalog').onclick=e=>{const b=e.target.closest('[data-id]');if(b){current=Number(b.dataset.id);tab='video';history.replaceState(null,'','#tutorial-'+current);render();if(matchMedia('(max-width:850px)').matches)$('detail').scrollIntoView({block:'start'})}};
$('detail').onclick=e=>{const b=e.target.closest('[data-tab]');if(b){tab=b.dataset.tab;renderDetail()}};
$('modules').onclick=e=>{const b=e.target.closest('[data-module]');if(b){$('module').value=mods[b.dataset.module];$('search').value='';tab='video';render();$('tutoriales').scrollIntoView()}};
$('search').oninput=render;$('module').onchange=()=>{tab='video';render()};
function fromHash(){const raw=Number(location.hash.replace('#tutorial-',''));const id=tutoriales.some(t=>t.id===raw)?raw:(aliasTutorial[raw]||raw);if(tutoriales.some(t=>t.id===id)){current=id;$('search').value='';$('module').value='';tab='video'}else if([1,5].includes(raw)){$('pendientes').querySelector('details').open=true;requestAnimationFrame(()=>$('pendientes').scrollIntoView())}render()}
window.addEventListener('hashchange',fromHash);fromHash();
async function check(t,k){try{const r=await fetch(k==='video'?t.video:t.documento,{method:'HEAD',cache:'no-store'});return r.ok&&(r.headers.get('content-type')||'').includes(k==='video'?'video/mp4':'application/pdf')}catch{return false}}
async function scan(){const jobs=tutoriales.flatMap(t=>['video','doc'].map(k=>[t,k]));for(let i=0;i<jobs.length;i+=8){await Promise.all(jobs.slice(i,i+8).map(async ([t,k])=>{const available=await check(t,k);(status[t.id]??={})[k]=available;if(t.id===current){if(tab===k)renderDetail();else if($('resource-links'))$('resource-links').innerHTML=links(t,status[t.id])}}));$('vc').textContent=Object.values(status).filter(s=>s.video).length;$('dc').textContent=Object.values(status).filter(s=>s.doc).length}}
scan();
