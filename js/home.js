(() => {
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;',
  }[char]));

  const setState = (container, message, retry) => {
    container.innerHTML = message
      ? `<p>${escapeHtml(message)}</p>${retry ? '<button type="button" class="button button--ghost" data-retry>Réessayer</button>' : ''}`
      : '';
  };

  const loadStats = async () => {
    const result = await window.covoituriniApi('stats.php');
    if (!result.ok) {
      document.querySelectorAll('[data-stat]').forEach(element => { element.textContent = '—'; });
      return;
    }
    const stats = result.data.stats || {};
    Object.entries(stats).forEach(([key, value]) => {
      const element = document.querySelector(`[data-stat="${key}"]`);
      if (element) element.textContent = Number(value).toLocaleString('fr-FR');
    });
  };

  const popularContainer = document.querySelector('[data-popular-routes]');
  const stateContainer = document.querySelector('[data-popular-state]');
  const loadRoutes = async () => {
    if (!popularContainer) return;
    popularContainer.innerHTML = '<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>';
    setState(stateContainer, '');
    const result = await window.covoituriniApi('popular_routes.php?limit=6');
    if (!result.ok) {
      popularContainer.innerHTML = '';
      setState(stateContainer, result.error === 'network_error'
        ? 'Impossible de charger les itinéraires populaires.'
        : 'Les itinéraires populaires sont momentanément indisponibles.', true);
      stateContainer.querySelector('[data-retry]')?.addEventListener('click', loadRoutes);
      return;
    }
    const routes = result.data.routes || [];
    if (!routes.length) {
      popularContainer.innerHTML = '';
      setState(stateContainer, 'Aucun itinéraire populaire pour le moment.', false);
      return;
    }
    popularContainer.innerHTML = routes.slice(0, 3).map((route, index) => `
      <a class="route-card ${index === 1 ? 'route-card--coral' : index === 2 ? 'route-card--gold' : ''} reveal" href="search.html?from=${encodeURIComponent(route.start_name)}&to=${encodeURIComponent(route.end_name)}">
        <div class="route-card__top"><span>${escapeHtml(route.start_name.slice(0, 3).toUpperCase())}</span><b>→</b><span>${escapeHtml(route.end_name.slice(0, 3).toUpperCase())}</span></div>
        <h3>${escapeHtml(route.start_name)} <span>→</span> ${escapeHtml(route.end_name)}</h3>
        <p>${Number(route.ride_count)} trajet(s) disponible(s)</p>
        <strong>à partir de ${escapeHtml(route.starting_price)} TND</strong>
      </a>
    `).join('');
  };

  if (window.covoituriniApi) {
    loadStats();
    loadRoutes();
  }
})();
