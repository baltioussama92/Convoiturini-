(() => {
  let step = 1;
  const form = document.querySelector('[data-publish-form]');
  if (!form) return;
  const steps = [...document.querySelectorAll('[data-step]')];
  const bar = [...document.querySelectorAll('.progress span')];
  const cities = window.covoituriniCities || {};
  let publishMap = null;
  let startMarker = null;
  let endMarker = null;
  let routeLine = null;
  let startPoint = null;
  let endPoint = null;
  let routeData = null;
  const markerIcon = kind => L.divIcon({
    className: `custom-map-marker custom-map-marker--${kind}`,
    html: '<span></span>',
    iconSize: [32, 32],
    iconAnchor: [16, 30],
  });
  const initializeMap = () => {
    if (publishMap || !window.CovoituriniMap) return;
    publishMap = window.CovoituriniMap.createMap('publish-map');
    if (!publishMap) return;
    publishMap.on('click', event => setPoint([event.latlng.lat, event.latlng.lng]));
  };
  const update = () => {
    steps.forEach(element => element.classList.toggle('is-active', +element.dataset.step === step));
    bar.forEach((element, index) => element.classList.toggle('is-active', index < step));
    if (publishMap) setTimeout(() => publishMap.invalidateSize(), 80);
  };
  const city = name => cities[(name || '').trim().toLowerCase()];
  const interpolatePoints = (start, end) => [start, { lat: (start.lat + end.lat) / 2, lng: (start.lng + end.lng) / 2 }, end];
  const updateSelectionText = () => {
    const selection = document.querySelector('[data-map-selection]');
    if (!selection) return;
    selection.textContent = startPoint && endPoint
      ? 'Départ et destination sélectionnés'
      : startPoint ? 'Départ sélectionné · choisissez la destination' : 'Aucun point sélectionné';
  };
  const recalculateRoute = async () => {
    if (!startPoint || !endPoint || !publishMap) return;
    if (routeLine) publishMap.removeLayer(routeLine);
    CovoituriniMap.addToast('Calcul du trajet...');
    try {
      routeData = await CovoituriniMap.getRoute(startPoint, endPoint);
      routeLine = CovoituriniMap.drawRoute(publishMap, routeData.points, '#e65d50');
      const summary = document.querySelector('[data-route-summary]');
      if (summary) summary.textContent = `${routeData.distanceKm} km · ${routeData.durationMin} min`;
      CovoituriniMap.addToast('Trajet calculé');
    } catch {
      CovoituriniMap.addToast('Impossible de calculer le trajet', true);
      routeData = null;
    }
  };
  const setPoint = async (latLng) => {
    if (!publishMap) initializeMap();
    const point = { lat: latLng[0], lng: latLng[1] };
    if (!startPoint) {
      startPoint = point;
      startMarker = L.marker(latLng, { draggable: true, icon: markerIcon('start') }).addTo(publishMap);
      startMarker.on('dragend', event => {
        const position = event.target.getLatLng();
        startPoint = { lat: position.lat, lng: position.lng };
        recalculateRoute();
      });
      form.from.value = await CovoituriniMap.reverseGeocode(point.lat, point.lng);
    } else if (!endPoint) {
      endPoint = point;
      endMarker = L.marker(latLng, { draggable: true, icon: markerIcon('end') }).addTo(publishMap);
      endMarker.on('dragend', event => {
        const position = event.target.getLatLng();
        endPoint = { lat: position.lat, lng: position.lng };
        recalculateRoute();
      });
      form.to.value = await CovoituriniMap.reverseGeocode(point.lat, point.lng);
      recalculateRoute();
    } else {
      CovoituriniMap.addToast('Déplacez un marqueur pour modifier le trajet');
    }
    updateSelectionText();
  };
  initializeMap();
  const placeSearch = document.querySelector('#place-search');
  const placeResults = document.querySelector('[data-place-results]');
  placeSearch?.addEventListener('input', event => {
    CovoituriniMap.searchPlace(event.target.value).then(results => {
      placeResults.innerHTML = '';
      results.forEach(result => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'place-result';
        button.textContent = result.name;
        button.addEventListener('click', () => {
          publishMap.setView([result.lat, result.lng], 13);
          setPoint([result.lat, result.lng]);
          placeResults.innerHTML = '';
        });
        placeResults.append(button);
      });
    });
  });
  document.querySelector('[data-location]')?.addEventListener('click', () => {
    if (!navigator.geolocation) { CovoituriniMap.addToast('Géolocalisation indisponible', true); return; }
    navigator.geolocation.getCurrentPosition(position => {
      setPoint([position.coords.latitude, position.coords.longitude]);
      publishMap.setView([position.coords.latitude, position.coords.longitude], 13);
    }, () => CovoituriniMap.addToast('Position refusée', true), { enableHighAccuracy: true, timeout: 8000 });
  });
  const showError = message => {
    const toast = document.querySelector('[data-toast]');
    toast.textContent = message;
    toast.classList.add('is-visible');
  };
  document.querySelectorAll('[data-next]').forEach(button => button.addEventListener('click', () => {
    if (!form.reportValidity()) return;
    if (step < 3) {
      step++;
      update();
      const start = city(form.from.value);
      const end = city(form.to.value);
      document.querySelector('[data-summary-route]').textContent = `${form.from.value} → ${form.to.value}`;
      document.querySelector('[data-summary-date]').textContent = form.date.value || 'Date à définir';
      document.querySelector('[data-summary-seats]').textContent = `${form.seats.value} places`;
      document.querySelector('[data-summary-price]').textContent = `${form.price.value} TND`;
      if (!start || !end) showError('Choisissez une ville tunisienne dans la liste.');
    }
  }));
  document.querySelectorAll('[data-prev]').forEach(button => button.addEventListener('click', () => { if (step > 1) { step--; update(); } }));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const start = startPoint || city(form.from.value);
    const end = endPoint || city(form.to.value);
    if (!start || !end) { showError('Choisissez une ville tunisienne dans la liste.'); return; }
    const startPayload = { lat: start.lat, lng: start.lng };
    const endPayload = { lat: end.lat, lng: end.lng };
    const routePoints = routeData
      ? routeData.points.map(([lat, lng]) => ({ lat, lng }))
      : interpolatePoints(startPayload, endPayload);
    try {
      if (window.covoituriniApi) await window.covoituriniApi.post('add_ride.php', {
        title: form.title.value, start_name: form.from.value, start_lat: startPayload.lat, start_lng: startPayload.lng,
        end_name: form.to.value, end_lat: endPayload.lat, end_lng: endPayload.lng, ride_date: form.date.value,
        ride_time: form.time.value, seats_total: Number(form.seats.value), seats_left: Number(form.seats.value),
        price: Number(form.price.value), gender_allowed: 'both', phone: form.phone.value,
        distance_km: routeData ? routeData.distanceKm : 0, duration_min: routeData ? routeData.durationMin : 0,
        is_recurring: false, route_points: routePoints,
      });
      const published = JSON.parse(localStorage.getItem('covoiturini-rides') || '[]');
      published.unshift({
        title: form.title.value, start_name: form.from.value, end_name: form.to.value,
        ride_date: form.date.value, ride_time: form.time.value,
        seats_left: Number(form.seats.value), price: Number(form.price.value),
        gender_allowed: 'both', status: 'active',
      });
      localStorage.setItem('covoiturini-rides', JSON.stringify(published));
      location.href = 'profile.html';
    } catch (error) {
      showError(error.message === 'authentication_required' ? 'Connectez-vous avant de publier.' : 'La publication a échoué. Vérifiez vos informations.');
    }
  });
})();
