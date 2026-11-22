(function () {
  'use strict';

  window.TUNISIA_CENTER = [33.8869, 9.5375];
  window.TUNISIA_BOUNDS = [[29.8, 7.3], [37.7, 11.8]];

  const cache = new Map();
  let placeController = null;
  let placeTimer = null;

  function addToast(message, isError) {
    let toast = document.querySelector('[data-map-toast]');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.dataset.mapToast = '';
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.toggle('toast--error', Boolean(isError));
    toast.classList.add('is-visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
  }

  function createMap(elementId) {
    const element = document.getElementById(elementId);
    if (!element || typeof L === 'undefined') return null;
    const map = L.map(elementId, {
      center: TUNISIA_CENTER,
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      maxBounds: TUNISIA_BOUNDS,
      maxBoundsViscosity: 0.8,
    });
    element._leaflet_map = map;
    setTileTheme(map);
    requestAnimationFrame(() => map.invalidateSize());
    return map;
  }

  function setTileTheme(map) {
    if (map._covoituriniTiles) map.removeLayer(map._covoituriniTiles);
    const dark = document.body.classList.contains('dark');
    map._covoituriniTiles = L.tileLayer(
      dark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      dark
        ? { subdomains: 'abcd', attribution: '&copy; OpenStreetMap contributors &copy; CARTO', maxZoom: 20 }
        : { attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 }
    ).addTo(map);
  }

  function switchTilesForTheme() {
    document.querySelectorAll('.leaflet-container').forEach(element => {
      const map = element._leaflet_map;
      if (map) setTileTheme(map);
    });
  }

  function searchPlace(query, lang) {
    const language = lang || document.documentElement.lang || 'fr';
    return new Promise(resolve => {
      clearTimeout(placeTimer);
      placeTimer = setTimeout(async () => {
        const key = `${language}:${query.trim().toLowerCase()}`;
        if (cache.has(key)) return resolve(cache.get(key));
        if (placeController) placeController.abort();
        placeController = new AbortController();
        const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=tn&limit=5&accept-language=${encodeURIComponent(language)}&q=${encodeURIComponent(query)}`;
        try {
          const response = await fetch(url, { signal: placeController.signal });
          if (!response.ok) throw new Error('Nominatim failed');
          const data = await response.json();
          const list = data.map(place => ({
            name: place.display_name,
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
          }));
          cache.set(key, list);
          resolve(list);
        } catch (error) {
          if (error.name === 'AbortError') return;
          try {
            const fallback = await fetch(`php/cities.php?q=${encodeURIComponent(query)}&lang=${encodeURIComponent(language)}`);
            if (!fallback.ok) throw new Error('City fallback failed');
            const payload = await fallback.json();
            const list = (payload.cities || []).map(city => ({
              name: language === 'ar' ? city.name_ar : city.name_fr,
              lat: parseFloat(city.lat),
              lng: parseFloat(city.lng),
            }));
            cache.set(key, list);
            resolve(list);
          } catch {
            resolve([]);
          }
        }
      }, 500);
    });
  }

  async function reverseGeocode(lat, lng, lang) {
    const language = lang || document.documentElement.lang || 'fr';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&zoom=14&accept-language=${encodeURIComponent(language)}&lat=${lat}&lon=${lng}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) throw new Error('Reverse geocoding failed');
      const data = await response.json();
      const address = data.address || {};
      return address.city || address.town || address.village || address.suburb || address.state || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch {
      try {
        const fallback = await fetch('php/cities.php');
        const payload = await fallback.json();
        let nearest = null;
        let nearestDistance = Infinity;
        (payload.cities || []).forEach(city => {
          const distance = Math.hypot(parseFloat(city.lat) - lat, parseFloat(city.lng) - lng);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = city;
          }
        });
        return nearest ? (language === 'ar' ? nearest.name_ar : nearest.name_fr) : `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      } catch {
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    }
  }

  function simplify(points, count) {
    const target = count || 35;
    const output = [];
    if (points.length < 2) return points;
    if (points.length === 2) {
      for (let index = 0; index < target; index++) {
        const ratio = index / (target - 1);
        output.push([
          points[0][0] + (points[1][0] - points[0][0]) * ratio,
          points[0][1] + (points[1][1] - points[0][1]) * ratio,
        ]);
      }
      return output;
    }
    if (points.length <= target) return points;
    const step = (points.length - 1) / (target - 1);
    for (let index = 0; index < target; index++) output.push(points[Math.round(index * step)]);
    return output;
  }

  async function getRoute(start, end, attempt) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok) throw new Error('Routing failed');
      const data = await response.json();
      if (!data.routes || !data.routes.length) throw new Error('No route found');
      const route = data.routes[0];
      const allPoints = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      return {
        points: simplify(allPoints, 35),
        allPoints,
        distanceKm: +(route.distance / 1000).toFixed(1),
        durationMin: Math.round(route.duration / 60),
      };
    } catch (error) {
      clearTimeout(timer);
      if (!attempt) return getRoute(start, end, true);
      throw error;
    }
  }

  function drawRoute(map, points, color) {
    if (!map) return null;
    const line = L.polyline(points, {
      color: color || '#e65d50',
      weight: 5,
      opacity: 0.9,
      lineJoin: 'round',
    }).addTo(map);
    animateRoute(line);
    map.fitBounds(line.getBounds(), { padding: [40, 40] });
    return line;
  }

  function animateRoute(line) {
    const element = line._path;
    if (!element) {
      setTimeout(() => animateRoute(line), 50);
      return;
    }
    element.classList.add('route-line--drawing');
  }

  function drawRideLines(map, rides) {
    if (!map) return [];
    const lines = [];
    rides.forEach(ride => {
      const points = (ride.route_points || []).map(point => [parseFloat(point.lat), parseFloat(point.lng)]);
      if (points.length < 2) return;
      const line = L.polyline(points, {
        color: '#1f7771',
        weight: 4,
        opacity: 0.72,
        className: 'ride-route',
      }).addTo(map);
      line.on('mouseover', () => line.setStyle({ weight: 8, opacity: 1, color: '#e65d50' }));
      line.on('mouseout', () => line.setStyle({ weight: 4, opacity: 0.72, color: '#1f7771' }));
      const container = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = `${ride.start_name} → ${ride.end_name}`;
      const detail = document.createElement('span');
      detail.textContent = `${ride.ride_date || ''} · ${ride.price || ''} TND`;
      container.append(title, document.createElement('br'), detail);
      line.bindPopup(container);
      lines.push({ ride, line });
    });
    return lines;
  }

  const module = {
    createMap,
    setTileTheme,
    switchTilesForTheme,
    searchPlace,
    reverseGeocode,
    simplify,
    getRoute,
    drawRoute,
    drawRideLines,
    addToast,
  };
  window.CovoituriniMap = module;

  document.querySelectorAll('[data-theme-toggle]').forEach(button => {
    button.addEventListener('click', () => setTimeout(switchTilesForTheme, 20));
  });
})();
