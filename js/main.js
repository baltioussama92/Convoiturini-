(() => {
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const preloader = $('.preloader');
  if (preloader) setTimeout(() => preloader.classList.add('is-done'), 450);

  const theme = localStorage.getItem('covoiturini-theme')
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (theme === 'dark') document.body.classList.add('dark');
  const toggle = $('[data-theme-toggle]');
  toggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('covoiturini-theme', document.body.classList.contains('dark') ? 'dark' : 'light');
    toggle.textContent = document.body.classList.contains('dark') ? '☀' : '☾';
  });

  const header = $('.site-header');
  addEventListener('scroll', () => header?.classList.toggle('is-scrolled', scrollY > 20));
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  }), { threshold: .12 });
  $$('.reveal').forEach(element => observer.observe(element));
  $$('[data-counter]').forEach(element => {
    const target = +element.dataset.counter;
    const counterObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let value = 0;
      const step = Math.max(1, Math.ceil(target / 50));
      const timer = setInterval(() => {
        value = Math.min(target, value + step);
        element.textContent = value.toLocaleString('fr-FR');
        if (value === target) clearInterval(timer);
      }, 25);
      counterObserver.disconnect();
    });
    counterObserver.observe(element);
  });

  $$('[data-search-form]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    location.href = `search.html?from=${encodeURIComponent(data.get('from'))}&to=${encodeURIComponent(data.get('to'))}&date=${encodeURIComponent(data.get('date') || '')}`;
  }));
  const swap = $('[data-swap]');
  swap?.addEventListener('click', () => {
    const from = $('#from');
    const to = $('#to');
    [from.value, to.value] = [to.value, from.value];
  });

  const menuButton = $('[data-menu-button]');
  const menuOverlay = $('[data-mobile-menu]');
  menuButton?.addEventListener('click', () => {
    const open = menuButton.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuOverlay?.classList.toggle('is-open', open);
  });
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton?.classList.contains('is-open')) {
      menuButton.classList.remove('is-open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuOverlay?.classList.remove('is-open');
      menuButton.focus();
    }
  });

  $$('[data-auth-form]').forEach(form => form.addEventListener('submit', async event => {
    event.preventDefault();
    form.querySelectorAll('[data-field-error]').forEach(error => { error.textContent = ''; });
    let valid = true;
    form.querySelectorAll('[required]').forEach(field => {
      const error = form.querySelector(`[data-field-error="${field.name}"]`);
      if (!field.validity.valid) {
        valid = false;
        field.setAttribute('aria-invalid', 'true');
        if (error) error.textContent = field.validity.valueMissing ? 'Ce champ est requis.' : 'Veuillez vérifier cette valeur.';
      } else {
        field.removeAttribute('aria-invalid');
      }
    });
    if (form.dataset.authMode === 'register') {
      const password = form.elements.password;
      const confirmation = form.elements.password_confirm;
      if (password.value.length < 8) {
        valid = false;
        form.querySelector('[data-field-error="password"]').textContent = 'Au moins 8 caractères sont requis.';
      }
      if (confirmation && password.value !== confirmation.value) {
        valid = false;
        confirmation.setAttribute('aria-invalid', 'true');
        form.querySelector('[data-field-error="password_confirm"]').textContent = 'Les mots de passe ne correspondent pas.';
      }
    }
    if (!valid) {
      form.classList.remove('shake');
      void form.offsetWidth;
      form.classList.add('shake');
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    const endpoint = form.dataset.authMode === 'register' ? 'register.php' : 'login.php';
    const submitButton = form.querySelector('[data-submit-button]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
    }
    const result = window.covoituriniApi
      ? await window.covoituriniApi.post(endpoint, data)
      : { ok: false, error: 'network_error', status: 0 };
    if (!result.ok) {
      const messages = {
        invalid_credentials: 'Email/téléphone ou mot de passe incorrect.',
        phone_or_email_already_exists: 'Cet email ou numéro existe déjà.',
        too_many_login_attempts: 'Trop de tentatives. Réessayez plus tard.',
        invalid_csrf_token: 'La session a expiré. Rechargez la page.',
        network_error: 'Impossible de joindre le serveur.',
        timeout: 'Le serveur met trop de temps à répondre.',
      };
      let notice = form.querySelector('[data-form-error]');
      if (!notice) {
        notice = document.createElement('p');
        notice.dataset.formError = '';
        notice.className = 'form-error';
        form.prepend(notice);
      }
      notice.textContent = messages[result.error] || 'Une erreur est survenue. Vérifiez vos informations.';
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
      }
      return;
    }
    if (form.dataset.authMode === 'register') {
      localStorage.setItem('covoiturini-demo-user', JSON.stringify(data));
      location.href = 'login.html';
      return;
    }
    localStorage.setItem('covoiturini-session', 'demo');
    const requestedReturn = new URLSearchParams(location.search).get('return');
    location.href = requestedReturn ? decodeURIComponent(requestedReturn) : 'profile.html';
  }));

  const syncAuthNavbar = async () => {
    if (!window.covoituriniApi) return;
    const result = await window.covoituriniApi('me.php');
    if (result.ok) {
      const loginLink = document.querySelector('.header-actions [href="login.html"]');
      if (loginLink) {
        loginLink.textContent = 'Mon profil';
        loginLink.href = 'profile.html';
      }
    } else if (result.status === 401) {
      localStorage.removeItem('covoiturini-session');
    }
  };
  syncAuthNavbar();
})();
