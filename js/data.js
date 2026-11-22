window.covoituriniCities = {};

window.loadCityCatalog = async () => {
  if (!window.covoituriniApi) return;
  const result = await window.covoituriniApi('cities.php');
  if (!result.ok) return;
  (result.data.cities || []).forEach(city => {
    window.covoituriniCities[String(city.name_fr).toLowerCase()] = {
      lat: parseFloat(city.lat),
      lng: parseFloat(city.lng),
    };
  });
};
