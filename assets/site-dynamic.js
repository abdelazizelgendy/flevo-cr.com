(async()=>{
  if(!window.FlevoStore)return;
  let settings=null,services=[];
  try{
    [settings,services]=await Promise.all([
      FlevoStore.getCompanySettings(),
      FlevoStore.getServices(false)
    ]);
  }catch(e){console.warn('FLEVO dynamic content:',e.message);return}

  const lang=()=>localStorage.getItem('flevo_lang')||'ar';
  const digits=x=>String(x||'').replace(/\D/g,'');

  const icons={
    design:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21l3.8-1 11-11a2.2 2.2 0 0 0-3.1-3.1l-11 11L3 21z"/><path d="M13.5 7.5l3 3"/><path d="M4.5 16.5l3 3"/></svg>`,
    factory:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 21V9l6 3V8l6 3V4h3v17H3z"/><path d="M7 17h1M11 17h1M15 17h1"/></svg>`,
    installation:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 7l3-3 3 3-3 3"/><path d="M5 19l6-6"/><path d="M4 4l6 6"/><path d="M14 14l6 6"/><path d="M3 3l3 1 1 3-2 2-3-3 1-3z"/></svg>`,
    branding:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16"/><path d="M6 16V8l6-4 6 4v8"/><path d="M9 16v-5h6v5"/><path d="M8 7h8"/></svg>`,
    lighting:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M8.5 15.5a7 7 0 1 1 7 0c-.9.7-1.5 1.4-1.5 2.5h-4c0-1.1-.6-1.8-1.5-2.5z"/></svg>`,
    technology:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M8 10h8M10 7h4"/></svg>`,
    support:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13v-2a8 8 0 0 1 16 0v2"/><path d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2zM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2z"/><path d="M17 18c0 2-2 3-5 3"/></svg>`
  };
  function normalizeIcon(value,title=''){
    const v=String(value||'').toLowerCase().trim();
    const t=String(title||'').toLowerCase();
    if(icons[v])return icons[v];
    if(v.includes('brand')||t.includes('طباعة')||t.includes('هوية'))return icons.branding;
    if(v.includes('install')||t.includes('تركيب')||t.includes('تنفيذ'))return icons.installation;
    if(v.includes('factory')||v.includes('fabric')||t.includes('تصنيع'))return icons.factory;
    if(v.includes('light')||t.includes('إضاءة'))return icons.lighting;
    if(v.includes('tech')||t.includes('تقني'))return icons.technology;
    if(v.includes('support')||t.includes('دعم')||t.includes('صيانة'))return icons.support;
    return icons.design;
  }

  function applySettings(){
    const en=lang()==='en';
    if(!settings)return;
    const heroSection=document.querySelector('.hero');
    if(heroSection&&settings.hero_background_url){
      heroSection.style.backgroundImage=`linear-gradient(90deg,rgba(5,22,40,.98) 0%,rgba(5,22,40,.88) 38%,rgba(5,22,40,.16) 74%),url("${settings.hero_background_url}")`;
      heroSection.style.backgroundPosition='center';heroSection.style.backgroundSize='cover';
    }
    const hero=document.querySelector('.hero-copy');
    if(hero){
      const h=hero.querySelector('h1'),p=hero.querySelector('p');
      if(h)h.textContent=en?(settings.hero_title_en||settings.hero_title_ar):(settings.hero_title_ar||'');
      if(p)p.textContent=en?(settings.hero_description_en||settings.hero_description_ar):(settings.hero_description_ar||'');
    }
    const phone=settings.phone||'',wa=settings.whatsapp||phone;
    document.querySelectorAll('a[href^="tel:"]').forEach(a=>a.href='tel:'+phone);
    document.querySelectorAll('a[href*="wa.me"]').forEach(a=>a.href='https://wa.me/'+digits(wa));
    document.querySelectorAll('.phone-number').forEach(x=>x.textContent=phone);
    const foot=document.querySelector('footer .foot>div:nth-child(3) p');
    if(foot)foot.innerHTML=`${en?(settings.address_en||settings.address_ar):(settings.address_ar||'')}<br><span class="phone-number" dir="ltr">${phone}</span><br>${settings.email||''}`;
    const stats=document.querySelectorAll('.stat strong');
    const vals=[settings.cities_count,settings.clients_count,settings.projects_count,settings.years_experience];
    stats.forEach((x,i)=>{if(vals[i]!=null)x.textContent='+'+vals[i]});
  }

  function applyServices(){
    const box=document.querySelector('#services .cards');
    if(!box||!services.length)return;
    const en=lang()==='en';
    box.innerHTML=services.map(s=>{
      const title=en?(s.title_en||s.title_ar):s.title_ar;
      const desc=en?(s.description_en||s.description_ar||''):(s.description_ar||'');
      return `<article class="card"><div class="ico">${normalizeIcon(s.icon,title)}</div><h3>${title||''}</h3><p>${desc}</p></article>`;
    }).join('');
  }

  function render(){applySettings();applyServices()}
  render();
  document.addEventListener('flevo:language',render);
})();
