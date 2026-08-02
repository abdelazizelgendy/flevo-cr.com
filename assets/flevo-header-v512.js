(function(){
  'use strict';
  const header=document.querySelector('.flevo-main-header');
  if(!header)return;
  document.body.classList.add('flevo-public-page');
  const toggle=header.querySelector('#menuToggle');
  const nav=header.querySelector('#mainNav');
  const searchBtn=header.querySelector('[data-flevo-search-toggle]');
  const searchPanel=document.querySelector('#flevoSearchPanel');
  const searchInput=searchPanel?.querySelector('input');
  const languageButtons=[...header.querySelectorAll('[data-lang]')];
  const media=window.matchMedia('(max-width:1040px)');

  function currentLang(){return localStorage.getItem('flevo_lang')||document.documentElement.lang||'ar'}
  function syncLanguageButtons(){const lang=currentLang();languageButtons.forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));header.querySelectorAll('[data-fh-ar][data-fh-en]').forEach(el=>{el.textContent=lang==='en'?el.dataset.fhEn:el.dataset.fhAr});document.querySelectorAll('#flevoSearchPanel [data-fh-ar][data-fh-en]').forEach(el=>{el.textContent=lang==='en'?el.dataset.fhEn:el.dataset.fhAr});if(searchInput)searchInput.placeholder=lang==='en'?'Search pages and sections':'ابحث في الصفحات والأقسام'}
  function applyLanguage(lang){
    localStorage.setItem('flevo_lang',lang);
    if(window.FlevoI18n?.set){window.FlevoI18n.set(lang)}
    else{
      const profileButton=document.querySelector('.profile-lang [data-lang="'+lang+'"]');
      if(profileButton)profileButton.click();
      document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
    }
    syncLanguageButtons();
  }
  languageButtons.forEach(btn=>btn.addEventListener('click',()=>applyLanguage(btn.dataset.lang)));
  document.addEventListener('flevo:language',syncLanguageButtons);
  syncLanguageButtons();

  function closeSearch(){if(!searchPanel||!searchBtn)return;searchPanel.classList.remove('open');searchBtn.setAttribute('aria-expanded','false')}
  searchBtn?.addEventListener('click',e=>{e.stopPropagation();const open=!searchPanel.classList.contains('open');searchPanel.classList.toggle('open',open);searchBtn.setAttribute('aria-expanded',String(open));if(open)setTimeout(()=>searchInput?.focus(),50)});
  searchPanel?.addEventListener('click',e=>e.stopPropagation());
  document.addEventListener('click',closeSearch);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSearch()});
  searchInput?.addEventListener('input',()=>{const q=searchInput.value.trim().toLowerCase();searchPanel.querySelectorAll('[data-search-label]').forEach(a=>{const text=((a.dataset.searchLabel||'')+' '+a.textContent).toLowerCase();a.hidden=Boolean(q&&!text.includes(q))})});
  searchPanel?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeSearch));

  function setScrolled(){header.classList.toggle('is-scrolled',scrollY>24)}
  addEventListener('scroll',setScrolled,{passive:true});setScrolled();

  // navigation-audit.js owns the mobile menu when present. Fallback keeps this component standalone.
  if(toggle&&nav&&!toggle.dataset.flevoBound){
    toggle.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.querySelector('span').textContent=open?'×':'☰'});
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{if(media.matches){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.querySelector('span').textContent='☰'}}));
  }

  // Correct active state by page first, then by visible section on home.
  const links=[...nav.querySelectorAll('a[data-nav-key]')];
  const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  function activeByPage(){
    let key='home';
    if(path==='projects.html'||path==='project.html'||path==='gallery.html')key='projects';
    else if(path==='articles.html'||path==='article.html')key='articles';
    else if(path==='profile.html')key='profile';
    links.forEach(a=>a.classList.toggle('active',a.dataset.navKey===key));
  }
  activeByPage();
  if(path==='index.html'||path===''){
    const observed=links.map(link=>{const href=link.getAttribute('href')||'';if(!href.startsWith('#'))return null;return{link,section:document.querySelector(href)}}).filter(Boolean);
    if('IntersectionObserver'in window&&observed.length){
      const observer=new IntersectionObserver(entries=>{const entry=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!entry)return;const item=observed.find(x=>x.section===entry.target);if(item)links.forEach(a=>a.classList.toggle('active',a===item.link))},{rootMargin:'-25% 0px -62% 0px',threshold:[.08,.25,.5]});
      observed.forEach(x=>observer.observe(x.section));
    }
  }
})();
