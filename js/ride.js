(() => {
  const root = document.querySelector('[data-ride-details]');
  if (!root || !window.covoituriniApi) return;
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return;
  const setAll = (selector, value) => document.querySelectorAll(selector).forEach(element => { element.textContent = value; });
  const load = async () => {
    try {
      const { ride } = await window.covoituriniApi(`get_ride.php?id=${encodeURIComponent(id)}`);
      setAll('[data-ride-start]', ride.start_name);
      setAll('[data-ride-end]', ride.end_name);
      document.querySelector('[data-ride-schedule]').textContent = `${ride.ride_date} · ${ride.ride_time.slice(0, 5)}`;
      document.querySelector('[data-ride-duration]').textContent = `⏱ ${ride.duration_min} min`;
      document.querySelector('[data-ride-distance]').textContent = `↗ ${ride.distance_km} km`;
      document.querySelector('[data-ride-seats]').textContent = `♙ ${ride.seats_left} places`;
      document.querySelector('[data-ride-driver]').textContent = ride.driver_name;
      document.querySelector('[data-ride-initial]').textContent = ride.driver_name.charAt(0).toUpperCase();
      document.querySelector('[data-ride-price]').innerHTML = `${ride.price} <small>TND</small>`;
    } catch {
      root.innerHTML = '<section class="ride-details glass"><h1>Trajet introuvable.</h1><a class="button button--primary" href="search.html">Retour aux trajets</a></section>';
    }
  };
  load();
})();
