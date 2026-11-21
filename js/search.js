(() => {
  const list = document.querySelector('[data-ride-list]');
  if (!list || !window.covoituriniApi) return;
  const params = new URLSearchParams(location.search);
  const fields = {
    from: document.querySelector('[data-filter="from"]'),
    to: document.querySelector('[data-filter="to"]'),
    date: document.querySelector('[data-filter="date"]'),
    price: document.querySelector('[data-filter="price"]'),
    seats: document.querySelector('[data-filter="seats"]'),
  };
  const cities = window.covoituriniCities;
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
  const cityCoordinates = name => {
    const city = cities[(name || '').trim().toLowerCase()];
    return city ? { lat: city.lat, lng: city.lng } : null;
  };
  const render = rides => {
    list.innerHTML = rides.length ? rides.map(ride => `<article class="ride-card" data-ride-id="${ride.id}"><div class="ride-card__top"><div class="ride-card__route">${escapeHtml(ride.start_name)}<span>→</span>${escapeHtml(ride.end_name)}</div><strong class="price">${ride.price}<small> TND</small></strong></div><p class="ride-card__meta">${escapeHtml(ride.ride_date)} · ${escapeHtml(ride.ride_time.slice(0, 5))} · ${ride.seats_left} places restantes · ${escapeHtml(ride.gender_allowed)}</p><div class="ride-card__bottom"><div class="ride-card__driver"><span class="avatar">${escapeHtml(ride.driver_name.charAt(0))}</span><span>${escapeHtml(ride.driver_name)}</span></div><a class="text-button" href="ride.html?id=${ride.id}">Voir le trajet</a></div></article>`).join('') : '<p class="muted">Aucun trajet ne correspond à votre recherche.</p>';
    document.querySelector('[data-results-count]').textContent = rides.length;
  };
  const showError = () => { list.innerHTML = '<p class="muted">Impossible de charger les trajets. Vérifiez que XAMPP et la base de données sont actifs.</p>'; };
  const load = async () => {
    const from = cityCoordinates(fields.from.value);
    const to = cityCoordinates(fields.to.value);
    if (!from || !to) {
      showError();
      return;
    }
    const query = new URLSearchParams({
      from_lat: from.lat, from_lng: from.lng, to_lat: to.lat, to_lng: to.lng,
      seats: fields.seats.value || '1', max_price: fields.price.value || '30',
    });
    if (fields.date.value) query.set('date', fields.date.value);
    try { render((await window.covoituriniApi(`search_rides.php?${query}`)).rides); } catch { showError(); }
  };
  fields.from.value = params.get('from') || '';
  fields.to.value = params.get('to') || '';
  if (params.get('date')) fields.date.value = params.get('date');
  document.querySelector('[data-run-search]')?.addEventListener('click', load);
  fields.price?.addEventListener('input', event => { document.querySelector('[data-price-output]').textContent = `${event.target.value} TND`; });
  document.querySelector('[data-clear-filters]')?.addEventListener('click', () => { Object.values(fields).forEach(field => { if (field) field.value = field.type === 'range' ? '30' : ''; }); load(); });
  load();
})();
