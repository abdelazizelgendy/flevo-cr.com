(function () {
  'use strict';

  const TARGET_KEY = 'flevo.auth.target.v57';
  const LAST_EMAIL_KEY = 'flevo.auth.lastEmail.v57';
  const MODAL_ID = 'flevoUnifiedAuth';
  const DEFAULT_ADMIN_PAGE = 'dashboard.html';

  let bootPromise = null;
  let currentSession = null;
  let protectedReadyCallback = null;
  let readySessionId = null;
  let elements = {};

  const api = {
    boot,
    protectPage,
    open: openLogin,
    close: closeLogin,
    logout,
    session: function () { return currentSession; },
    user: function () { return currentSession ? currentSession.user : null; },
    navigateAfterLogin
  };

  window.FlevoUnifiedAuth = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      boot().catch(reportBootError);
    });
  } else {
    boot().catch(reportBootError);
  }

  function reportBootError(error) {
    console.error('FLEVO unified auth error:', error);
  }

  function boot() {
    if (bootPromise) return bootPromise;

    bootPromise = (async function () {
      assertDependencies();
      injectCard();
      cacheElements();
      bindEvents();

      const result = await FlevoStore.client.auth.getSession();
      if (result.error) throw result.error;

      currentSession = result.data ? result.data.session : null;
      updatePageState(currentSession);

      FlevoStore.client.auth.onAuthStateChange(function (event, session) {
        currentSession = session || null;
        updatePageState(currentSession);

        if (event === 'SIGNED_OUT' && isProtectedPage()) {
          readySessionId = null;
          openLogin(currentPageTarget(), null, false);
        }

        document.dispatchEvent(new CustomEvent('flevo:authchange', {
          detail: { event: event, session: currentSession }
        }));
      });

      if (isProtectedPage() && !currentSession) {
        saveTarget(currentPageTarget());
        openLogin(currentPageTarget(), null, false);
      }

      return currentSession;
    })();

    return bootPromise;
  }

  async function protectPage(options) {
    options = options || {};
    protectedReadyCallback =
      typeof options.onAuthenticated === 'function'
        ? options.onAuthenticated
        : null;

    const session = await boot();

    if (session) {
      await runProtectedReady(session);
      return session;
    }

    openLogin(currentPageTarget(), null, false);
    return null;
  }

  async function runProtectedReady(session) {
    if (!session) return;
    const sessionId = session.access_token || (session.user && session.user.id) || 'active';

    document.body.classList.add('flevo-auth-ready');

    if (!protectedReadyCallback || readySessionId === sessionId) return;

    readySessionId = sessionId;
    try {
      await protectedReadyCallback(session);
    } catch (error) {
      console.error('FLEVO protected page load error:', error);
      showMessage('تعذر تحميل بيانات الصفحة: ' + readError(error), 'error');
    }
  }

  function assertDependencies() {
    if (!window.FlevoStore || !FlevoStore.client) {
      throw new Error('يجب تحميل supabase-config.js وdata-store.js قبل unified-auth.js.');
    }
  }

  function injectCard() {
    if (document.getElementById(MODAL_ID)) return;

    const lang = getLanguage();
    const text = dictionary(lang);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div
        id="${MODAL_ID}"
        class="flevo-auth-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flevoAuthTitle"
        aria-hidden="true"
      >
        <section class="flevo-auth-card">
          <div class="flevo-auth-brand">
            <button
              class="flevo-auth-close"
              type="button"
              data-flevo-auth-close
              aria-label="${escapeHtml(text.close)}"
            >×</button>
            <img
              src="assets/flevo-logo-on-dark.png"
              alt="FLEVO Creative Industries"
            >
          </div>

          <div class="flevo-auth-body">
            <h2 id="flevoAuthTitle" class="flevo-auth-title">${escapeHtml(text.title)}</h2>
            <p class="flevo-auth-subtitle">${escapeHtml(text.subtitle)}</p>

            <form id="flevoUnifiedLoginForm" novalidate>
              <div class="flevo-auth-field">
                <label for="flevoUnifiedEmail">${escapeHtml(text.email)}</label>
                <div class="flevo-auth-input-wrap">
                  <span class="flevo-auth-field-icon" aria-hidden="true">✉</span>
                  <input
                    id="flevoUnifiedEmail"
                    class="flevo-auth-input"
                    type="email"
                    inputmode="email"
                    autocomplete="username"
                    placeholder="admin@flevo.com"
                    required
                  >
                </div>
              </div>

              <div class="flevo-auth-field">
                <label for="flevoUnifiedPassword">${escapeHtml(text.password)}</label>
                <div class="flevo-auth-input-wrap">
                  <span class="flevo-auth-field-icon" aria-hidden="true">●</span>
                  <input
                    id="flevoUnifiedPassword"
                    class="flevo-auth-input"
                    type="password"
                    autocomplete="current-password"
                    placeholder="••••••••"
                    required
                  >
                  <button
                    id="flevoUnifiedPasswordToggle"
                    class="flevo-auth-password-toggle"
                    type="button"
                    aria-label="${escapeHtml(text.togglePassword)}"
                  >◉</button>
                </div>
              </div>

              <div
                id="flevoUnifiedAuthMessage"
                class="flevo-auth-message"
                role="alert"
              ></div>

              <button
                id="flevoUnifiedLoginSubmit"
                class="flevo-auth-submit"
                type="submit"
              >
                <span class="flevo-auth-spinner" aria-hidden="true"></span>
                <span data-flevo-auth-submit-label>${escapeHtml(text.submit)}</span>
              </button>
            </form>

            <div class="flevo-auth-footer">${escapeHtml(text.footer)}</div>
          </div>
        </section>
      </div>
    `;

    document.body.appendChild(wrapper.firstElementChild);
  }

  function cacheElements() {
    elements.overlay = document.getElementById(MODAL_ID);
    elements.form = document.getElementById('flevoUnifiedLoginForm');
    elements.email = document.getElementById('flevoUnifiedEmail');
    elements.password = document.getElementById('flevoUnifiedPassword');
    elements.toggle = document.getElementById('flevoUnifiedPasswordToggle');
    elements.submit = document.getElementById('flevoUnifiedLoginSubmit');
    elements.message = document.getElementById('flevoUnifiedAuthMessage');
    elements.close = elements.overlay.querySelector('[data-flevo-auth-close]');

    const savedEmail = localStorage.getItem(LAST_EMAIL_KEY);
    if (savedEmail) elements.email.value = savedEmail;
  }

  function bindEvents() {
    if (elements.form && !elements.form.dataset.bound) {
      elements.form.dataset.bound = 'true';
      elements.form.addEventListener('submit', handleLogin);
    }

    if (elements.toggle && !elements.toggle.dataset.bound) {
      elements.toggle.dataset.bound = 'true';
      elements.toggle.addEventListener('click', togglePassword);
    }

    if (elements.close && !elements.close.dataset.bound) {
      elements.close.dataset.bound = 'true';
      elements.close.addEventListener('click', closeLogin);
    }

    document.addEventListener('click', handleDocumentClick);

    window.addEventListener('pageshow', function () {
      FlevoStore.client.auth.getSession().then(function (result) {
        currentSession = result.data ? result.data.session : null;
        updatePageState(currentSession);

        if (isProtectedPage()) {
          if (currentSession) runProtectedReady(currentSession);
          else openLogin(currentPageTarget(), null, false);
        }
      });
    });
  }

  async function handleDocumentClick(event) {
    const logoutButton = event.target.closest('[data-flevo-logout]');
    if (logoutButton) {
      event.preventDefault();
      await logout();
      return;
    }

    const protectedLink = event.target.closest('[data-flevo-auth-target]');
    if (!protectedLink) return;

    const target = readTarget(protectedLink);
    if (!target) return;

    event.preventDefault();

    const session = await boot();

    if (session) {
      window.location.assign(target.url);
      return;
    }

    saveTarget(target);
    openLogin(target, null, true);
  }

  async function handleLogin(event) {
    event.preventDefault();
    clearMessage();

    const lang = getLanguage();
    const text = dictionary(lang);
    const email = String(elements.email.value || '').trim();
    const password = String(elements.password.value || '');

    if (!email || !password) {
      showMessage(text.required, 'error');
      return;
    }

    setLoading(true);

    try {
      const result = await FlevoStore.signIn(email, password);
      if (result.error) throw result.error;

      currentSession = result.data ? result.data.session : await FlevoStore.session();
      if (!currentSession) throw new Error(text.noSession);

      localStorage.setItem(LAST_EMAIL_KEY, email);
      updatePageState(currentSession);
      showMessage(text.success, 'success');
      elements.password.value = '';

      if (isProtectedPage() && isCurrentPageTarget(readTargetFromStorage())) {
        clearStoredTarget();
        closeLogin(true);
        await runProtectedReady(currentSession);
        return;
      }

      setTimeout(function () {
        navigateAfterLogin();
      }, 180);
    } catch (error) {
      showMessage(translateError(error, lang), 'error');
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    clearStoredTarget();
    readySessionId = null;

    const result = await FlevoStore.signOut();
    if (result && result.error) {
      console.error('FLEVO logout error:', result.error);
    }

    currentSession = null;
    updatePageState(null);

    const logoutUrl =
      (document.body && document.body.dataset.flevoLogoutUrl) ||
      'index.html';

    window.location.assign(logoutUrl);
  }

  function openLogin(target, message, closable) {
    if (!elements.overlay) return;

    if (target) saveTarget(target);
    clearMessage();

    if (message) showMessage(message, 'error');

    const allowClose =
      typeof closable === 'boolean'
        ? closable
        : !isProtectedPage();

    elements.close.hidden = !allowClose;
    elements.overlay.classList.add('is-open');
    elements.overlay.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('flevo-auth-locked');

    setTimeout(function () {
      if (elements.email) elements.email.focus();
    }, 70);
  }

  function closeLogin(force) {
    if (isProtectedPage() && !currentSession && force !== true) return;

    elements.overlay.classList.remove('is-open');
    elements.overlay.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('flevo-auth-locked');
    clearMessage();
  }

  function navigateAfterLogin() {
    const target = readTargetFromStorage();
    clearStoredTarget();

    if (!target || !target.url) {
      if (isProtectedPage()) {
        closeLogin(true);
        runProtectedReady(currentSession);
        return;
      }

      window.location.assign(DEFAULT_ADMIN_PAGE);
      return;
    }

    if (isCurrentPageTarget(target)) {
      closeLogin(true);
      runProtectedReady(currentSession);
      return;
    }

    window.location.assign(target.url);
  }

  function readTarget(element) {
    const explicit = element.getAttribute('data-flevo-auth-target');
    const href = element.getAttribute('href');
    const raw = explicit || href;

    if (!raw || raw === '#' || /^javascript:/i.test(raw)) return null;

    return {
      url: new URL(raw, window.location.href).href,
      label: String(element.textContent || '').trim()
    };
  }

  function currentPageTarget() {
    return {
      url: window.location.href,
      label: document.title || ''
    };
  }

  function saveTarget(target) {
    if (!target || !target.url) return;
    sessionStorage.setItem(TARGET_KEY, JSON.stringify(target));
  }

  function readTargetFromStorage() {
    try {
      return JSON.parse(sessionStorage.getItem(TARGET_KEY) || 'null');
    } catch (error) {
      clearStoredTarget();
      return null;
    }
  }

  function clearStoredTarget() {
    sessionStorage.removeItem(TARGET_KEY);
  }

  function isCurrentPageTarget(target) {
    if (!target || !target.url) return false;

    const current = new URL(window.location.href);
    const requested = new URL(target.url, window.location.href);

    return (
      current.origin === requested.origin &&
      current.pathname === requested.pathname &&
      current.search === requested.search &&
      current.hash === requested.hash
    );
  }

  function isProtectedPage() {
    return Boolean(
      document.body &&
      document.body.dataset &&
      document.body.dataset.flevoProtected === 'true'
    );
  }

  function updatePageState(session) {
    document.body.classList.toggle('flevo-authenticated', Boolean(session));

    if (session) {
      document.body.classList.add('flevo-auth-ready');
    } else if (isProtectedPage()) {
      document.body.classList.remove('flevo-auth-ready');
    }

    document.querySelectorAll('[data-flevo-user-email]').forEach(function (node) {
      node.textContent = session && session.user ? session.user.email : '';
    });
  }

  function togglePassword() {
    const hidden = elements.password.type === 'password';
    elements.password.type = hidden ? 'text' : 'password';
    elements.toggle.textContent = hidden ? '◎' : '◉';
  }

  function setLoading(loading) {
    elements.submit.disabled = Boolean(loading);
    elements.submit.classList.toggle('is-loading', Boolean(loading));
  }

  function showMessage(message, kind) {
    if (!elements.message) return;
    elements.message.textContent = message || '';
    elements.message.className = 'flevo-auth-message is-open ' + (kind || 'error');
  }

  function clearMessage() {
    if (!elements.message) return;
    elements.message.textContent = '';
    elements.message.className = 'flevo-auth-message';
  }

  function getLanguage() {
    return localStorage.getItem('flevo_lang') === 'en' ||
      document.documentElement.lang === 'en'
      ? 'en'
      : 'ar';
  }

  function dictionary(lang) {
    if (lang === 'en') {
      return {
        title: 'Admin Sign In',
        subtitle: 'Use your unified account to open the requested FLEVO website section.',
        email: 'Email address',
        password: 'Password',
        submit: 'Sign in',
        footer: 'One secure Supabase session for every FLEVO admin page',
        close: 'Close',
        togglePassword: 'Show or hide password',
        required: 'Enter your email address and password.',
        success: 'Signed in successfully.',
        noSession: 'A login session could not be created.'
      };
    }

    return {
      title: 'تسجيل دخول الإدارة',
      subtitle: 'استخدم حسابك الموحّد لفتح القسم المطلوب في موقع FLEVO.',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      submit: 'دخول إلى إدارة الموقع',
      footer: 'جلسة Supabase واحدة وآمنة لجميع صفحات إدارة FLEVO',
      close: 'إغلاق',
      togglePassword: 'إظهار أو إخفاء كلمة المرور',
      required: 'أدخل البريد الإلكتروني وكلمة المرور.',
      success: 'تم تسجيل الدخول بنجاح.',
      noSession: 'لم يتم إنشاء جلسة دخول.'
    };
  }

  function translateError(error, lang) {
    const message = readError(error);

    if (/invalid login credentials/i.test(message)) {
      return lang === 'en'
        ? 'The email address or password is incorrect.'
        : 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    }

    if (/email not confirmed/i.test(message)) {
      return lang === 'en'
        ? 'Confirm the email address before signing in.'
        : 'يجب تأكيد البريد الإلكتروني قبل تسجيل الدخول.';
    }

    if (/too many requests|rate limit/i.test(message)) {
      return lang === 'en'
        ? 'Too many attempts. Try again later.'
        : 'محاولات كثيرة. أعد المحاولة لاحقًا.';
    }

    if (/failed to fetch|network/i.test(message)) {
      return lang === 'en'
        ? 'Could not connect to Supabase. Check the internet connection.'
        : 'تعذر الاتصال بـ Supabase. تحقق من اتصال الإنترنت.';
    }

    return message || (
      lang === 'en'
        ? 'Could not sign in.'
        : 'تعذر تسجيل الدخول.'
    );
  }

  function readError(error) {
    return String(
      error && error.message
        ? error.message
        : error || ''
    );
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char];
    });
  }
})();
