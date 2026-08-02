(() => {
  'use strict';

  const header = document.querySelector('header');
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  const mobileQuery = window.matchMedia('(max-width: 980px)');

  document.querySelectorAll('a[href]').forEach((anchor) => {
    anchor.style.pointerEvents = 'auto';
    if (!anchor.getAttribute('aria-label') && !anchor.textContent.trim()) {
      anchor.setAttribute('aria-label', anchor.title || 'رابط');
    }
  });

  function setMenuState(open) {
    if (!toggle || !nav) return;
    const shouldOpen = Boolean(open) && mobileQuery.matches;
    nav.classList.toggle('open', shouldOpen);
    document.body.classList.toggle('flevo-mobile-nav-open', shouldOpen);
    toggle.classList.toggle('is-open', shouldOpen);
    toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', shouldOpen ? 'إغلاق القائمة' : 'فتح القائمة');
    const icon = toggle.querySelector('span');
    if (icon) icon.textContent = shouldOpen ? '×' : '☰';
  }

  if (toggle && nav && !toggle.dataset.flevoBound) {
    toggle.dataset.flevoBound = '1';

    toggle.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setMenuState(!nav.classList.contains('open'));
    });

    document.addEventListener('click', (event) => {
      if (!nav.classList.contains('open')) return;
      if (nav.contains(event.target) || toggle.contains(event.target)) return;
      setMenuState(false);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMenuState(false);
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', (event) => {
        const rawHref = (link.getAttribute('href') || '').trim();
        if (rawHref.startsWith('#')) {
          const target = document.querySelector(rawHref);
          if (target) {
            event.preventDefault();
            setMenuState(false);
            requestAnimationFrame(() => {
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              history.replaceState(null, '', rawHref);
            });
            setActiveLink(link);
            return;
          }
        }
        setMenuState(false);
      });
    });

    mobileQuery.addEventListener?.('change', (event) => {
      if (!event.matches) setMenuState(false);
    });
  }

  function setActiveLink(activeLink) {
    if (!nav) return;
    nav.querySelectorAll('a').forEach((link) => link.classList.toggle('active', link === activeLink));
  }

  if (nav && location.pathname.endsWith('index.html') || (nav && location.pathname.endsWith('/'))) {
    const sectionLinks = [...nav.querySelectorAll('a[href^="#"]')]
      .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
      .filter((item) => item.section);

    if ('IntersectionObserver' in window && sectionLinks.length) {
      const observer = new IntersectionObserver((entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const item = sectionLinks.find((candidate) => candidate.section === visible.target);
        if (item) setActiveLink(item.link);
      }, { rootMargin: '-22% 0px -64% 0px', threshold: [0.05, 0.2, 0.5] });
      sectionLinks.forEach((item) => observer.observe(item.section));
    }
  }

  window.addEventListener('pageshow', () => {
    document.body.classList.remove('flevo-leaving');
    setMenuState(false);
  });
})();
