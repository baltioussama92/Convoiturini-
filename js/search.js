(() => {
  const list = document.querySelector('[data-ride-list]');
  if (!list) return;
  const params = new URLSearchParams(location.search);
  const fields = {
    from: document.querySelector('[data-filter="from"]'),
    to: document.querySelector('[data-filter="to"]'),
    date: document.querySelector('[data-filter="date"]'),
    price: document.querySelector('[data-filter="price"]'),
    seats: document.querySelector('[data-filter="seats"]'),
  };
  const cities = window.covoituriniCities;
  let searchMap = null;
  let drawnLines = [];
  let searchMarkers = [];
  const initializeMap = () => {
    if (searchMap || !window.CovoituriniMap) return;
    searchMap = window.CovoituriniMap.createMap('search-map');
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        initializeMap();
        setTimeout(() => searchMap?.invalidateSize(), 80);
      }
    });
  });
  const mapElement = document.getElementById('search-map');
  if (mapElement) observer.observe(mapElement);
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
  const cityCoordinates = name => {
    const city = cities[(name || '').trim().toLowerCase()];
    return city ? { lat: city.lat, lng: city.lng } : null;
  };
  const render = rides => {
    list.innerHTML = rides.length ? rides.map(ride => `<article class="ride-card" data-ride-id="${ride.id}"><div class="ride-card__top"><div class="ride-card__route">${escapeHtml(ride.start_name)}<span>→</span>${escapeHtml(ride.end_name)}</div><strong class="price">${escapeHtml(ride.price)}<small> TND</small></strong></div><p class="ride-card__meta">${escapeHtml(ride.ride_date)} · ${escapeHtml(ride.ride_time.slice(0, 5))} · ${escapeHtml(ride.seats_left)} places restantes · ${escapeHtml(ride.gender_allowed)} · ${escapeHtml(ride.match_type || 'passes_by')}</p><div class="ride-card__bottom"><div class="ride-card__driver"><span class="avatar">${escapeHtml(ride.driver_name.charAt(0))}</span><span>${escapeHtml(ride.driver_name)}</span></div><a class="text-button" href="ride.html?id=${ride.id}">Voir le trajet</a></div>${ride.phone ? `<div class="ride-contact"><button type="button" class="text-button" data-show-phone="${escapeHtml(ride.phone)}">Afficher le numéro</button><a class="text-button" data-call-phone href="tel:${encodeURIComponent(ride.phone)}" hidden>Appeler</a><a class="text-button" data-whatsapp-phone href="https://wa.me/${encodeURIComponent(ride.phone.replace(/[^0-9]/g, ''))}" hidden target="_blank" rel="noopener">WhatsApp</a></div>` : ''}</article>`).join('') : '<p class="muted">Aucun trajet ne correspond à votre recherche.</p>';
    document.querySelector('[data-results-count]').textContent = rides.length;
    initializeMap();
    if (!searchMap) return;
    drawnLines.forEach(item => searchMap.removeLayer(item.line));
    drawnLines = [];
    const visibleRides = rides.length > 100 ? rides.filter(ride => {
      const from = cityCoordinates(ride.start_name);
      return from && searchMap.getBounds().contains([from.lat, from.lng]);
    }) : rides;
    visibleRides.forEach(ride => {
      const start = cityCoordinates(ride.start_name);
      const end = cityCoordinates(ride.end_name);
      if (!start || !end) return;
      const points = ride.route_points
        ? ride.route_points.map(point => [parseFloat(point.lat), parseFloat(point.lng)])
        : [[start.lat, start.lng], [(start.lat + end.lat) / 2, (start.lng + end.lng) / 2], [end.lat, end.lng]];
      const line = L.polyline(points, { color: '#1f7771', weight: 4, opacity: 0.75, className: 'ride-route' }).addTo(searchMap);
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = `${ride.start_name} → ${ride.end_name}`;
      const detail = document.createElement('span');
      detail.textContent = `${ride.ride_date} · ${ride.price} TND`;
      popup.append(title, document.createElement('br'), detail);
      line.bindPopup(popup);
      line.on('mouseover', () => line.setStyle({ weight: 8, color: '#e65d50', opacity: 1 }));
      line.on('mouseout', () => line.setStyle({ weight: 4, color: '#1f7771', opacity: 0.75 }));
      drawnLines.push({ ride, line });
    });
    list.querySelectorAll('[data-ride-id]').forEach(card => {
      const item = drawnLines.find(entry => String(entry.ride.id) === card.dataset.rideId);
      if (!item) return;
      card.addEventListener('mouseenter', () => {
        item.line.setStyle({ weight: 9, color: '#e65d50', opacity: 1, dashArray: '12 8' });
        searchMap.fitBounds(item.line.getBounds(), { padding: [40, 40] });
      });
      card.addEventListener('mouseleave', () => item.line.setStyle({ weight: 4, color: '#1f7771', opacity: 0.75, dashArray: null }));
    });
    list.querySelectorAll('[data-show-phone]').forEach(button => {
      button.addEventListener('click', () => {
        const contact = button.parentElement;
        button.textContent = button.dataset.showPhone;
        button.disabled = true;
        contact.querySelectorAll('[data-call-phone],[data-whatsapp-phone]').forEach(link => { link.hidden = false; });
      });
    });
    if (drawnLines.length) searchMap.fitBounds(L.featureGroup(drawnLines.map(item => item.line)).getBounds(), { padding: [35, 35] });
  };
  const showError = () => { list.innerHTML = '<p class="muted">Impossible de charger les trajets. Vérifiez que XAMPP et la base de données sont actifs.</p>'; };
  const load = async () => {
    const from = cityCoordinates(fields.from.value);
    const to = cityCoordinates(fields.to.value);
    initializeMap();
    if (searchMap) {
      searchMarkers.forEach(marker => searchMap.removeLayer(marker));
      searchMarkers = [];
      if (from) {
        searchMarkers.push(L.marker([from.lat, from.lng], { title: 'Départ' }).addTo(searchMap));
        searchMarkers.push(L.circle([from.lat, from.lng], { radius: 3000, color: '#1f7771', fillOpacity: 0.08 }).addTo(searchMap));
      }
      if (to) {
        searchMarkers.push(L.marker([to.lat, to.lng], { title: 'Destination' }).addTo(searchMap));
        searchMarkers.push(L.circle([to.lat, to.lng], { radius: 3000, color: '#e65d50', fillOpacity: 0.08 }).addTo(searchMap));
      }
    }
    const matchesMock = () => window.mockRides.filter(ride =>
      (!fields.from.value || ride.start_name.toLowerCase().includes(fields.from.value.toLowerCase())) &&
      (!fields.to.value || ride.end_name.toLowerCase().includes(fields.to.value.toLowerCase())) &&
      Number(ride.price) <= Number(fields.price.value || 30) &&
      Number(ride.seats_left) >= Number(fields.seats.value || 1)
    );
    if (!from || !to) { render(matchesMock()); return; }
    const query = new URLSearchParams({
      from_lat: from.lat, from_lng: from.lng, to_lat: to.lat, to_lng: to.lng,
      seats: fields.seats.value || '1', max_price: fields.price.value || '30',
    });
    if (fields.date.value) query.set('date', fields.date.value);
    try {
      if (window.covoituriniApi) render((await window.covoituriniApi(`search_rides.php?${query}`)).rides);
      else render(matchesMock());
    } catch { render(matchesMock()); }
  };
  fields.from.value = params.get('from') || '';
  fields.to.value = params.get('to') || '';
  if (params.get('date')) fields.date.value = params.get('date');
  document.querySelector('[data-run-search]')?.addEventListener('click', load);
  fields.price?.addEventListener('input', event => { document.querySelector('[data-price-output]').textContent = `${event.target.value} TND`; });
  document.querySelector('[data-clear-filters]')?.addEventListener('click', () => { Object.values(fields).forEach(field => { if (field) field.value = field.type === 'range' ? '30' : ''; }); load(); });
  load();
})();
