(() => {
  const root = document.querySelector('[data-ride-details]');
  if (!root || !window.covoituriniApi) return;
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return;
  const setAll = (selector, value) => document.querySelectorAll(selector).forEach(element => { element.textContent = value; });
  const load = async () => {
    try {
      let ride;
      if (window.covoituriniApi) {
        try { ({ ride } = await window.covoituriniApi(`get_ride.php?id=${encodeURIComponent(id)}`)); } catch {}
      }
      if (!ride) {
        ride = (window.mockRides || []).find(item => String(item.id) === String(id));
        if (ride) {
          const start = window.covoituriniCities?.[ride.start_name.toLowerCase()];
          const end = window.covoituriniCities?.[ride.end_name.toLowerCase()];
          ride.route_points = start && end
            ? [{ lat: start.lat, lng: start.lng }, { lat: (start.lat + end.lat) / 2, lng: (start.lng + end.lng) / 2 }, { lat: end.lat, lng: end.lng }]
            : [];
          ride.duration_min = 45;
        }
      }
      if (!ride) throw new Error('Ride not found');
      setAll('[data-ride-start]', ride.start_name);
      setAll('[data-ride-end]', ride.end_name);
      document.querySelector('[data-ride-schedule]').textContent = `${ride.ride_date} · ${ride.ride_time.slice(0, 5)}`;
      document.querySelector('[data-ride-duration]').textContent = `⏱ ${ride.duration_min} min`;
      document.querySelector('[data-ride-distance]').textContent = `↗ ${ride.distance_km} km`;
      document.querySelector('[data-ride-seats]').textContent = `♙ ${ride.seats_left} places`;
      document.querySelector('[data-ride-driver]').textContent = ride.driver_name;
      document.querySelector('[data-ride-initial]').textContent = ride.driver_name.charAt(0).toUpperCase();
      document.querySelector('[data-ride-price]').innerHTML = `${ride.price} <small>TND</small>`;
      if (window.CovoituriniMap) {
        const map = window.CovoituriniMap.createMap('ride-map');
        if (map) {
          const points = (ride.route_points || []).map(point => [parseFloat(point.lat), parseFloat(point.lng)]);
          if (points.length >= 2) {
            window.CovoituriniMap.drawRoute(map, points, '#e65d50');
          }
        }
      }
    } catch {
      root.innerHTML = '<section class="ride-details glass"><h1>Trajet introuvable.</h1><a class="button button--primary" href="search.html">Retour aux trajets</a></section>';
    }
  };
  load();
})();
