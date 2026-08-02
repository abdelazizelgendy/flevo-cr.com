(function(){
  function lang(){return (window.FlevoI18n&&window.FlevoI18n.lang)||localStorage.getItem('flevo_lang')||'ar'}
  function render(){
    const grid=document.getElementById('homeArticlesGrid');
    if(!grid||!window.FLEVO_ARTICLES)return;
    const en=lang()==='en';
    grid.innerHTML=window.FLEVO_ARTICLES.slice(0,3).map(a=>`<article class="article-card">
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
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',render):render();
  document.addEventListener('flevo:language',render);
})();
