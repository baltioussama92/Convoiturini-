(() => {
  let step = 1;
  const form = document.querySelector('[data-publish-form]');
  if (!form) return;
  const steps = [...document.querySelectorAll('[data-step]')];
  const bar = [...document.querySelectorAll('.progress span')];
  const cities = window.covoituriniCities || {};
  const update = () => {
    steps.forEach(element => element.classList.toggle('is-active', +element.dataset.step === step));
    bar.forEach((element, index) => element.classList.toggle('is-active', index < step));
  };
  const city = name => cities[(name || '').trim().toLowerCase()];
  const interpolatePoints = (start, end) => [start, { lat: (start.lat + end.lat) / 2, lng: (start.lng + end.lng) / 2 }, end];
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
    const start = city(form.from.value);
    const end = city(form.to.value);
    if (!start || !end) { showError('Choisissez une ville tunisienne dans la liste.'); return; }
    try {
      await window.covoituriniApi.post('add_ride.php', {
        title: form.title.value, start_name: form.from.value, start_lat: start.lat, start_lng: start.lng,
        end_name: form.to.value, end_lat: end.lat, end_lng: end.lng, ride_date: form.date.value,
        ride_time: form.time.value, seats_total: Number(form.seats.value), seats_left: Number(form.seats.value),
        price: Number(form.price.value), gender_allowed: 'both', phone: form.phone.value,
        distance_km: 0, duration_min: 0, is_recurring: false, route_points: interpolatePoints(start, end),
      });
      location.href = 'profile.html';
    } catch (error) {
      showError(error.message === 'authentication_required' ? 'Connectez-vous avant de publier.' : 'La publication a échoué. Vérifiez vos informations.');
    }
  });
})();
