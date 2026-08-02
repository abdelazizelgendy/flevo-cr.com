(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const body = document.body;

  function buildLoader(){
    if (document.querySelector('.flevo-loader')) return;
    const loader = document.createElement('div');
    loader.className = 'flevo-loader';
    loader.setAttribute('aria-hidden','true');
    loader.innerHTML = '<div class="flevo-loader__inner"><div class="flevo-loader__mark">FLE<span>V</span>O</div><div class="flevo-loader__bar"></div></div>';
    body.prepend(loader);

    const veil = document.createElement('div');
    veil.className = 'flevo-page-veil';
    veil.setAttribute('aria-hidden','true');
    body.append(veil);
  }

  function finishLoad(){
    body.classList.add('flevo-ready');
    const loader = document.querySelector('.flevo-loader');
    if (loader){
      loader.classList.add('is-hidden');
      window.setTimeout(() => loader.remove(), 550);
    }
  }

  function prepareImages(){
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('loading') && !img.closest('.hero')) img.loading = 'lazy';
      img.decoding = 'async';
      if (img.complete){
        img.classList.add('flevo-img-loaded');
      } else {
        img.classList.add('flevo-img-loading');
        img.addEventListener('load', () => {
          img.classList.remove('flevo-img-loading');
          img.classList.add('flevo-img-loaded');
        }, {once:true});
        img.addEventListener('error', () => img.classList.remove('flevo-img-loading'), {once:true});
      }
    });
  }

  function prepareReveals(){
    if (reduceMotion) return;
    const selectors = [
      'main > section','body > section','.section','.benefits',
      '.card','.project','.project-card','.gallery-item','.step','.stat',
      '.quote-card','.dashboard-card','.panel'
    ];
    const nodes = [...new Set(document.querySelectorAll(selectors.join(',')))];
    nodes.forEach((el,index) => {
      if (el.closest('header') || el.classList.contains('hero')) return;
      el.classList.add('motion-reveal');
      el.style.setProperty('--motion-delay', `${Math.min((index % 6) * 55, 275)}ms`);
    });

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {rootMargin:'0px 0px -8% 0px',threshold:.08});
    nodes.forEach(el => observer.observe(el));
  }

  function isInternalPageLink(anchor){
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return false;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin) return false;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
    return /\.html$|\/$/.test(url.pathname) || url.pathname === location.pathname;
  }

  function setupNavigation(){
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest('a');
      if (!isInternalPageLink(anchor)) return;
      event.preventDefault();
      body.classList.add('flevo-leaving');
      window.setTimeout(() => { location.href = anchor.href; }, reduceMotion ? 0 : 300);
    });

    // Prefetch local pages when the visitor shows intent.
    const prefetched = new Set();
    document.addEventListener('pointerover', event => {
      const anchor = event.target.closest('a');
      if (!isInternalPageLink(anchor) || prefetched.has(anchor.href)) return;
      prefetched.add(anchor.href);
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = anchor.href;
      document.head.append(link);
    }, {passive:true});
  }

  buildLoader();
  prepareImages();
  prepareReveals();
  setupNavigation();

  if (document.readyState === 'complete') finishLoad();
  else window.addEventListener('load', finishLoad, {once:true});
  // Prevent loader hanging if an external resource is slow.
  window.setTimeout(finishLoad, 1800);
  window.addEventListener('pageshow', () => body.classList.remove('flevo-leaving'));
})();
