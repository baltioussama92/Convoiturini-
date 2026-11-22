(() => {
  const form = document.querySelector('[data-auth-form]');
  if (!form) return;
  const password = form.querySelector('input[name="password"]');
  if (password) {
    const meter = document.createElement('div');
    meter.className = 'password-meter';
    meter.setAttribute('aria-label', 'Force du mot de passe');
    password.after(meter);
    password.addEventListener('input', () => {
      const value = password.value;
      const score = [value.length >= 8, /[A-Z]/.test(value), /[0-9]/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length;
      meter.dataset.score = String(score);
    });
  }
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'password-toggle';
  toggle.textContent = 'Voir';
  toggle.setAttribute('aria-label', 'Afficher le mot de passe');
  password?.parentElement?.append(toggle);
  toggle.addEventListener('click', () => {
    if (!password) return;
    const visible = password.type === 'text';
    password.type = visible ? 'password' : 'text';
    toggle.textContent = visible ? 'Voir' : 'Masquer';
  });
})();
