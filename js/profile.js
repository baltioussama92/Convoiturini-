(() => {
  const root = document.querySelector('[data-profile]');
  if (!root || !window.covoituriniApi) return;
  const esc = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
  const render = async () => {
    try {
      let user, rides;
      if (window.covoituriniApi) {
        try { ({ user, rides } = await window.covoituriniApi('profile.php')); } catch {}
      }
      if (!user) {
        const saved = JSON.parse(localStorage.getItem('covoiturini-demo-user') || '{}');
        user = { name: saved.name || 'Amel Ben Salah', email: saved.email || 'amel@example.tn', phone: saved.phone || '+21620100001' };
        const published = JSON.parse(localStorage.getItem('covoiturini-rides') || '[]');
        rides = [
          { start_name: 'Manouba', end_name: 'Ariana', ride_date: '2026-11-23', ride_time: '08:00:00', seats_left: 2, price: '3.00', status: 'active' },
          ...published,
        ];
      }
      document.querySelector('[data-profile-name]').textContent = user.name;
      document.querySelector('[data-profile-initial]').textContent = user.name.charAt(0).toUpperCase();
      document.querySelector('[data-profile-meta]').textContent = `${user.email} · ${user.phone}`;
      document.querySelector('[data-profile-ride-count]').textContent = rides.length;
      document.querySelector('[data-profile-seats]').textContent = rides.reduce((sum, ride) => sum + Number(ride.seats_left), 0);
      document.querySelector('[data-profile-active]').textContent = rides.filter(ride => ride.status === 'active').length;
      document.querySelector('[data-profile-rides]').innerHTML = rides.length
        ? rides.map(ride => `<article class="profile-ride" data-profile-ride="${esc(ride.id || '')}"><div class="profile-ride__route"><span>${esc(ride.start_name)}</span><b>→</b><span>${esc(ride.end_name)}</span></div><p>${esc(ride.ride_date)} · ${esc(ride.ride_time.slice(0, 5))} · ${esc(ride.seats_left)} places · ${esc(ride.price)} TND</p><span class="status ${ride.status === 'active' ? 'status--active' : ''}">${esc(ride.status)}</span>${ride.id ? '<button type="button" class="profile-delete text-button" data-delete-ride="' + esc(ride.id) + '">Supprimer</button>' : ''}</article>`).join('')
        : '<p class="muted">Vous n’avez pas encore publié de trajet.</p>';
    } catch (error) {
      document.querySelector('[data-profile-rides]').innerHTML = '<p class="muted">Connectez-vous pour consulter votre profil.</p>';
    }
  };
  document.querySelector('[data-logout]')?.addEventListener('click', async () => {
    try { await window.covoituriniApi.post('logout.php', {}); } finally { location.href = 'index.html'; }
  });
  root.addEventListener('click', async event => {
    const button = event.target.closest('[data-delete-ride]');
    if (!button) return;
    if (!window.confirm('Supprimer définitivement ce trajet ?')) return;
    button.disabled = true;
    try {
      await window.covoituriniApi.post('delete_ride.php', { ride_id: Number(button.dataset.deleteRide) });
      button.closest('[data-profile-ride]').remove();
    } catch (error) {
      button.disabled = false;
      window.alert(error.message === 'ride_not_found_or_not_owner'
        ? 'Ce trajet ne peut pas être supprimé.'
        : 'La suppression a échoué.');
    }
  });
  render();
})();
