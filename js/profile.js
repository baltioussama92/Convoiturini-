(() => {
  const root = document.querySelector('[data-profile]');
  if (!root || !window.covoituriniApi) return;
  const esc = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
  const render = async () => {
    try {
      const { user, rides } = await window.covoituriniApi('profile.php');
      document.querySelector('[data-profile-name]').textContent = user.name;
      document.querySelector('[data-profile-initial]').textContent = user.name.charAt(0).toUpperCase();
      document.querySelector('[data-profile-meta]').textContent = `${user.email} · ${user.phone}`;
      document.querySelector('[data-profile-ride-count]').textContent = rides.length;
      document.querySelector('[data-profile-seats]').textContent = rides.reduce((sum, ride) => sum + Number(ride.seats_left), 0);
      document.querySelector('[data-profile-active]').textContent = rides.filter(ride => ride.status === 'active').length;
      document.querySelector('[data-profile-rides]').innerHTML = rides.length
        ? rides.map(ride => `<article class="profile-ride"><div class="profile-ride__route"><span>${esc(ride.start_name)}</span><b>→</b><span>${esc(ride.end_name)}</span></div><p>${esc(ride.ride_date)} · ${esc(ride.ride_time.slice(0, 5))} · ${ride.seats_left} places · ${ride.price} TND</p><span class="status ${ride.status === 'active' ? 'status--active' : ''}">${esc(ride.status)}</span></article>`).join('')
        : '<p class="muted">Vous n’avez pas encore publié de trajet.</p>';
    } catch (error) {
      document.querySelector('[data-profile-rides]').innerHTML = '<p class="muted">Connectez-vous pour consulter votre profil.</p>';
    }
  };
  document.querySelector('[data-logout]')?.addEventListener('click', async () => {
    try { await window.covoituriniApi.post('logout.php', {}); } finally { location.href = 'index.html'; }
  });
  render();
})();
