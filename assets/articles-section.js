(function(){
  function lang(){return (window.FlevoI18n&&window.FlevoI18n.lang)||localStorage.getItem('flevo_lang')||'ar'}
  var cache=null;
  function adaptRow(r,i){
    var d=r.created_at?new Date(r.created_at):null;
    return {
      id:r.slug||r.id,number:String(i+1).padStart(2,'0'),
      titleAr:r.title_ar,titleEn:r.title_en||r.title_ar,
      categoryAr:r.category_ar||'',categoryEn:r.category_en||'',
      dateAr:d?new Intl.DateTimeFormat('ar-EG',{day:'numeric',month:'long',year:'numeric'}).format(d):'',
      dateEn:d?new Intl.DateTimeFormat('en-US',{day:'numeric',month:'long',year:'numeric'}).format(d):'',
      excerptAr:r.excerpt_ar||'',excerptEn:r.excerpt_en||r.excerpt_ar||'',
      image:r.image_url||'assets/flevo-logo-transparent.png',
      captionAr:r.category_ar||'',captionEn:r.category_en||''
    };
  }
  function render(list){
    var grid=document.getElementById('homeArticlesGrid');if(!grid)return;
    cache=list;var en=lang()==='en';var limit=grid.dataset.limit==='all'?list.length:3;
    grid.innerHTML=list.slice(0,limit).map(a=>`<article class="article-card">
      <div class="article-card-body">
        <div class="article-number">${a.number}</div>
        <h3>${en?a.titleEn:a.titleAr}</h3>
        <div class="article-meta"><span>${en?a.categoryEn:a.categoryAr}</span><span>•</span><time>${en?a.dateEn:a.dateAr}</time></div>
        <p class="article-excerpt">${en?a.excerptEn:a.excerptAr}</p>
        <a class="article-read" href="article.html?id=${encodeURIComponent(a.id)}">${en?'Read more':'اقرأ المزيد'}</a>
      </div>
      <a class="article-image" href="article.html?id=${encodeURIComponent(a.id)}"><img loading="lazy" src="${a.image}" alt="${en?a.titleEn:a.titleAr}"><span class="article-image-caption">${en?a.captionEn:a.captionAr}</span></a>
    </article>`).join('');
  }
  async function init(){
    var grid=document.getElementById('homeArticlesGrid');if(!grid)return;
    if(window.FlevoStore&&window.FlevoStore.getArticles){
      try{render((await FlevoStore.getArticles()).map(adaptRow));return}catch(e){}
    }
    if(window.FLEVO_ARTICLES)render(window.FLEVO_ARTICLES);
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
  document.addEventListener('flevo:language',()=>{if(cache)render(cache)});
})();
