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
  if (mapElement) {
    let dragStart = null;
    let startHeight = 0;
    mapElement.addEventListener('pointerdown', event => {
      if (matchMedia('(max-width:900px)').matches) {
        dragStart = event.clientY;
        startHeight = mapElement.getBoundingClientRect().height;
        mapElement.setPointerCapture?.(event.pointerId);
      }
    });
    mapElement.addEventListener('pointermove', event => {
      if (dragStart === null) return;
      const height = Math.min(innerHeight * .75, Math.max(280, startHeight + dragStart - event.clientY));
      mapElement.style.height = `${height}px`;
      searchMap?.invalidateSize();
    });
    mapElement.addEventListener('pointerup', () => { dragStart = null; });
  }
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
  const showError = () => {
    list.innerHTML = '<div class="data-state"><p>Impossible de charger les trajets.</p><button type="button" class="button button--ghost" data-search-retry>Réessayer</button></div>';
    list.querySelector('[data-search-retry]')?.addEventListener('click', load);
  };
  const load = async () => {
    list.innerHTML = '<div class="ride-skeleton"></div><div class="ride-skeleton"></div><div class="ride-skeleton"></div>';
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
    if (!from || !to) {
      const query = new URLSearchParams({ limit: '100' });
      if (fields.date.value) query.set('date', fields.date.value);
      const result = await window.covoituriniApi(`get_rides.php?${query}`);
      if (result.ok) render(result.data.rides || []);
      else showError();
      return;
    }
    const query = new URLSearchParams({
      from_lat: from.lat, from_lng: from.lng, to_lat: to.lat, to_lng: to.lng,
      seats: fields.seats.value || '1', max_price: fields.price.value || '30',
    });
    if (fields.date.value) query.set('date', fields.date.value);
    if (!window.covoituriniApi) {
      showError();
      return;
    }
    const result = await window.covoituriniApi(`search_rides.php?${query}`);
    if (result.ok) render(result.data.rides || []);
    else showError();
  };
  fields.from.value = params.get('from') || '';
  fields.to.value = params.get('to') || '';
  if (params.get('date')) fields.date.value = params.get('date');
  document.querySelector('[data-run-search]')?.addEventListener('click', load);
  fields.price?.addEventListener('input', event => { document.querySelector('[data-price-output]').textContent = `${event.target.value} TND`; });
  document.querySelector('[data-clear-filters]')?.addEventListener('click', () => { Object.values(fields).forEach(field => { if (field) field.value = field.type === 'range' ? '30' : ''; }); load(); });
  if (window.loadCityCatalog) {
    window.loadCityCatalog().finally(load);
  } else {
    load();
  }
})();
