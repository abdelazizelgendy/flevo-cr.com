(function(){
  'use strict';
  const state={projects:[],filtered:[],active:0,category:'all',timer:null,dragStart:null,dragDelta:0};
  const fallback='assets/flevo-logo-transparent.png';
  const categoryNames={
    ar:{all:'الكل',booths:'بوثات المعارض',events:'الفعاليات',fabrication:'التصنيع',manufacturing:'التصنيع',special:'أعمال خاصة'},
    en:{all:'All',booths:'Exhibition Booths',events:'Events',fabrication:'Fabrication',manufacturing:'Fabrication',special:'Special Projects'}
  };
  const $=s=>document.querySelector(s);
  const els={track:$('#homeProjectsTrack'),filters:$('#homeProjectsFilters'),dots:$('#homeProjectsDots'),prev:$('#homeProjectsPrev'),next:$('#homeProjectsNext'),sub:$('#homeProjectsSub')};
  if(!els.track)return;

  function lang(){return window.FlevoI18n?.lang==='en'?'en':'ar'}
  function safe(v){return String(v??'').replace(/[&<>'"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[m]))}
  function normalizeCategory(v){return v==='manufacturing'?'fabrication':(v||'special')}
  function title(p){return lang()==='en'?(p.titleEn||p.titleAr):(p.titleAr||p.titleEn)}
  function locationText(p){return lang()==='en'?(p.locationEn||p.location):(p.location||p.locationEn)}
  function categoryText(p){const c=normalizeCategory(p.category);return lang()==='en'?(p.categoryEn||categoryNames.en[c]):(p.categoryAr||categoryNames.ar[c])}

  async function load(){
    els.track.innerHTML='<div class="home-projects-loading">جارٍ تحميل المشروعات...</div>';
    try{
      if(window.FlevoStore?.getProjects){
        state.projects=(await FlevoStore.getProjects()).filter(p=>p.published!==false).sort((a,b)=>(a.order??999)-(b.order??999));
      }else throw new Error('Store unavailable');
    }catch(err){
      console.warn('Home projects: Supabase fallback used',err);
      try{const r=await fetch('data/projects.json',{cache:'no-store'});state.projects=await r.json()}catch(e){state.projects=[]}
    }
    state.projects=state.projects.slice(0,12);
    renderFilters();applyFilter('all');bind();startAuto();
  }

  function renderFilters(){
    const l=lang();
    const cats=['all','booths','events','fabrication','special'];
    els.filters.innerHTML=cats.map(c=>`<button class="home-projects-filter${c===state.category?' active':''}" type="button" data-cat="${c}">${safe(categoryNames[l][c])}</button>`).join('');
  }

  function applyFilter(cat){
    state.category=cat;
    state.active=0;
    state.filtered=cat==='all'?state.projects:state.projects.filter(p=>normalizeCategory(p.category)===cat);
    els.filters.querySelectorAll('[data-cat]').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));
    renderCards();
  }

  function renderCards(){
    if(!state.filtered.length){
      els.track.innerHTML=`<div class="home-projects-empty">${lang()==='en'?'No projects in this category yet.':'لا توجد مشروعات في هذا التصنيف حاليًا.'}</div>`;
      els.dots.innerHTML='';return;
    }
    els.track.innerHTML=state.filtered.map((p,i)=>{
      const loc=locationText(p),yr=p.year||'';
      return `<article class="home-project-card" data-index="${i}" aria-hidden="true">
        <img src="${safe(p.cover||fallback)}" alt="${safe(title(p)||'FLEVO project')}" loading="${i<3?'eager':'lazy'}" onerror="this.onerror=null;this.src='${fallback}'">
        <div class="home-project-card-content">
          <span class="home-project-tag">${safe(categoryText(p)||'FLEVO')}</span>
          <h3>${safe(title(p)||'FLEVO')}</h3>
          <div class="home-project-meta">${loc?`<span>${safe(loc)}</span>`:''}${loc&&yr?'<i></i>':''}${yr?`<span>${safe(yr)}</span>`:''}</div>
        </div>
        <a class="home-project-open" href="project.html?id=${encodeURIComponent(p.id)}" aria-label="${lang()==='en'?'View project':'عرض المشروع'}">←</a>
      </article>`;
    }).join('');
    els.dots.innerHTML=state.filtered.map((_,i)=>`<button class="home-project-dot" type="button" data-index="${i}" aria-label="${i+1}"></button>`).join('');
    update();
  }

  function relative(i){
    const n=state.filtered.length;if(!n)return 99;
    let d=i-state.active;
    if(d>n/2)d-=n;if(d<-n/2)d+=n;
    return d;
  }

  function update(){
    els.track.querySelectorAll('.home-project-card').forEach((card,i)=>{
      const d=relative(i);
      card.classList.remove('is-active','is-prev','is-next','is-far-prev','is-far-next');
      if(d===0)card.classList.add('is-active');
      else if(d===-1)card.classList.add('is-prev');
      else if(d===1)card.classList.add('is-next');
      else if(d===-2)card.classList.add('is-far-prev');
      else if(d===2)card.classList.add('is-far-next');
      card.setAttribute('aria-hidden',d===0?'false':'true');
      card.tabIndex=d===0?0:-1;
    });
    els.dots.querySelectorAll('.home-project-dot').forEach((dot,i)=>dot.classList.toggle('active',i===state.active));
  }

  function go(step){
    const n=state.filtered.length;if(n<2)return;
    state.active=(state.active+step+n)%n;update();restartAuto();
  }
  function setActive(i){state.active=Number(i)||0;update();restartAuto()}
  function startAuto(){stopAuto();if(state.filtered.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches)state.timer=setInterval(()=>go(1),5200)}
  function stopAuto(){if(state.timer){clearInterval(state.timer);state.timer=null}}
  function restartAuto(){stopAuto();startAuto()}

  function bind(){
    els.prev.addEventListener('click',()=>go(-1));els.next.addEventListener('click',()=>go(1));
    els.filters.addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(b)applyFilter(b.dataset.cat)});
    els.dots.addEventListener('click',e=>{const b=e.target.closest('[data-index]');if(b)setActive(b.dataset.index)});
    els.track.addEventListener('click',e=>{const card=e.target.closest('.home-project-card');if(!card||e.target.closest('a'))return;const i=Number(card.dataset.index),d=relative(i);if(d)go(d>0?1:-1);else location.href=`project.html?id=${encodeURIComponent(state.filtered[i].id)}`});
    els.track.addEventListener('pointerdown',e=>{state.dragStart=e.clientX;state.dragDelta=0;stopAuto();els.track.setPointerCapture?.(e.pointerId)});
    els.track.addEventListener('pointermove',e=>{if(state.dragStart===null)return;state.dragDelta=e.clientX-state.dragStart});
    els.track.addEventListener('pointerup',()=>{if(state.dragStart===null)return;const threshold=45;if(Math.abs(state.dragDelta)>threshold)go(state.dragDelta>0?-1:1);state.dragStart=null;state.dragDelta=0;startAuto()});
    els.track.addEventListener('pointercancel',()=>{state.dragStart=null;state.dragDelta=0;startAuto()});
    els.track.addEventListener('mouseenter',stopAuto);els.track.addEventListener('mouseleave',startAuto);
    document.addEventListener('visibilitychange',()=>document.hidden?stopAuto():startAuto());
    document.addEventListener('flevo:language',()=>{renderFilters();renderCards();if(els.sub)els.sub.textContent=lang()==='en'?'We design and deliver exceptional experiences where creativity meets engineering precision.':'نصمم وننفّذ تجارب استثنائية تجمع بين الإبداع والدقة الهندسية.'});
    document.addEventListener('keydown',e=>{if(!els.track.closest(':hover'))return;if(e.key==='ArrowLeft')go(document.documentElement.dir==='rtl'?1:-1);if(e.key==='ArrowRight')go(document.documentElement.dir==='rtl'?-1:1)});
  }
  load();
})();
