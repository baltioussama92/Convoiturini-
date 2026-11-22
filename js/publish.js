(() => {
  let step = 1;
  const form = document.querySelector('[data-publish-form]');
  if (!form) return;
  const protectDraft = async () => {
    if (!window.covoituriniApi) return;
    const result = await window.covoituriniApi('me.php');
    if (!result.ok) {
      sessionStorage.setItem('covoiturini-publish-draft', JSON.stringify(Object.fromEntries(new FormData(form))));
      const returnUrl = encodeURIComponent(location.pathname + location.search);
      location.href = `login.html?return=${returnUrl}`;
    }
  };
  protectDraft();
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
  const today = new Date();
  const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const dateInput = form.elements.date;
  if (dateInput) dateInput.min = todayValue;
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
  if (window.loadCityCatalog) window.loadCityCatalog();
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
  form.addEventListener('input', () => {
    sessionStorage.setItem('covoiturini-publish-draft', JSON.stringify(Object.fromEntries(new FormData(form))));
  });
  try {
    const draft = JSON.parse(sessionStorage.getItem('covoiturini-publish-draft') || '{}');
    Object.entries(draft).forEach(([name, value]) => {
      if (form.elements[name]) form.elements[name].value = value;
    });
  } catch {}
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const title = form.title.value.trim();
    if (title.length < 3 || title.length > 100 || /[<>"]/u.test(title)) {
      showError('Le titre doit contenir 3 à 100 caractères sans balises HTML.');
      return;
    }
    if (!routeData) {
      showError('Calculez le trajet sur la carte avant de publier.');
      step = 1;
      update();
      return;
    }
    if (startPoint && endPoint
      && Math.abs(startPoint.lat - endPoint.lat) < 0.000001
      && Math.abs(startPoint.lng - endPoint.lng) < 0.000001) {
      showError('Le départ et la destination doivent être différents.');
      step = 1;
      update();
      return;
    }
    if (form.date.value < todayValue) {
      showError('La date du trajet ne peut pas être passée.');
      return;
    }
    if (form.date.value === todayValue) {
      const now = new Date();
      const [hours, minutes] = form.time.value.split(':').map(Number);
      if (hours * 60 + minutes <= now.getHours() * 60 + now.getMinutes()) {
        showError("L'heure doit être postérieure à l'heure actuelle.");
        return;
      }
    }
    const seats = Number(form.seats.value);
    if (!Number.isInteger(seats) || seats < 1 || seats > 8) {
      showError('Le nombre de places doit être un entier entre 1 et 8.');
      return;
    }
    const price = String(form.price.value);
    if (!/^\d+(?:\.\d{1,2})?$/.test(price) || Number(price) < 0 || Number(price) > 9999.99) {
      showError('Le prix doit être positif avec au maximum deux décimales.');
      return;
    }
    if (!/^(?:\+216\s?)?[234579][0-9]{7}$/.test(form.phone.value.trim())) {
      showError('Entrez un numéro tunisien valide commençant par 2, 3, 4, 5, 7 ou 9.');
      return;
    }
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
    }
    const start = startPoint || city(form.from.value);
    const end = endPoint || city(form.to.value);
    if (!start || !end) { showError('Choisissez une ville tunisienne dans la liste.'); return; }
    const startPayload = { lat: start.lat, lng: start.lng };
    const endPayload = { lat: end.lat, lng: end.lng };
    const routePoints = routeData
      ? routeData.points.map(([lat, lng]) => ({ lat, lng }))
      : interpolatePoints(startPayload, endPayload);
    try {
      if (window.covoituriniApi) {
        const publishKey = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
        const publishedResult = await window.covoituriniApi.post('add_ride.php', {
        title: form.title.value, start_name: form.from.value, start_lat: startPayload.lat, start_lng: startPayload.lng,
        end_name: form.to.value, end_lat: endPayload.lat, end_lng: endPayload.lng, ride_date: form.date.value,
        ride_time: form.time.value, seats_total: seats, seats_left: seats,
        price: price, gender_allowed: form.gender_allowed.value, phone: form.phone.value,
        distance_km: routeData ? routeData.distanceKm : 0, duration_min: routeData ? routeData.durationMin : 0,
        is_recurring: Boolean(form.elements.is_recurring?.checked), route_points: routePoints,
        publish_key: publishKey,
        });
        if (!publishedResult.ok) throw new Error(publishedResult.error);
      }
      sessionStorage.removeItem('covoiturini-publish-draft');
      const overlay = document.createElement('div');
      overlay.className = 'publish-success';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.innerHTML = '<div class="publish-success__card"><div class="success-check">✓</div><h2>Trajet publié !</h2><p>Votre trajet est maintenant visible par les passagers.</p><a class="button button--primary" href="search.html">Voir les trajets</a><a class="text-link" href="publish.html">Publier un autre trajet</a></div>';
      document.body.append(overlay);
      const card = overlay.querySelector('.publish-success__card');
      for (let i = 0; i < 28; i++) {
        const piece = document.createElement('i');
        piece.className = 'confetti';
        piece.style.setProperty('--x', `${(Math.random() - .5) * 240}px`);
        piece.style.setProperty('--delay', `${Math.random() * .25}s`);
        card.append(piece);
      }
    } catch (error) {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
      }
      showError(error.message === 'authentication_required' ? 'Connectez-vous avant de publier.' : 'La publication a échoué. Vérifiez vos informations.');
    }
  });
})();
