const fs = require("fs");
const distance = require("fast-haversine");

const writeJson = (path, content) =>
  fs.writeFileSync(path, JSON.stringify(content, null, 2));

const sortByKey = key => (a, b) => {
  if (a[key] > b[key]) {
    return 1;
  } else if (a[key] < b[key]) {
    return -1;
  }
  return 0;
};

// poor-man csv parser
const loadCsv = path =>
  fs
    .readFileSync(path)
    .toString()
    .split("\n")
    .slice(1) // remove header
    .map(row => row.split(";").map(cell => cell.trim()));

// load cities geoloc data
const loadLocations = () =>
  loadCsv("./laposte_hexasmal.csv")
    // only if has coordonnees_gps (last column)
    .filter(row => !!row[row.length - 1])
    // pick insee code, postcode and lat+lon
    .map(
      ([
        Code_commune_INSEE,
        Nom_commune,
        Code_postal,
        Ligne_5,
        Libellé_d_acheminement,
        Libell_d_acheminement,
        coordonnees_gps
      ]) => [
        Code_commune_INSEE,
        Code_postal,
        ...coordonnees_gps.split(",").map(c => parseFloat(c))
      ]
    );

const loadPopulations = () =>
  loadCsv("./insee-populations.csv")
    // pick insee code, and total population
    .map(
      ([
        Code_région,
        Nom_de_la_région,
        Code_département,
        Code_arrondissement,
        Code_canton,
        Code_commune,
        Nom_de_la_commune,
        Population_municipale,
        Population_comptée_à_part,
        Population_totale
      ]) => [
        Code_département + Code_commune,
        parseInt(Population_totale.replace(/\s/g, ""), 10)
      ]
    );

const locations = loadLocations();
const populations = loadPopulations();

const getPopulationFromInsee = insee => {
  const inseePopulation = populations.find(pop => pop[0] === insee);
  if (!inseePopulation) {
    // mayotte not in insee data :/
    return 0;
  }
  return inseePopulation[1];
};

const locationsData = locations
  .map(([insee, postcode, lat, lon]) => ({
    postcode,
    insee,
    population: getPopulationFromInsee(insee),
    lat,
    lon
  }))
  // dont include entries not found in population data
  .filter(location => location.population > 0);

const findClosestCity = (city, bigCities) => {
  const fromPos = { lat: city.lat, lon: city.lon };

  // compute distance from all big cities
  const bigCitiesByDistance = bigCities.map(bigCity => ({
    ...bigCity,
    distance: distance(fromPos, {
      lat: bigCity.lat,
      lon: bigCity.lon
    })
  }));

  // sort by distance
  bigCitiesByDistance.sort(sortByKey("distance"));

  return bigCitiesByDistance[0];
};

//
// generate a single mapping with postcode: {from:to}
//
const generateMapping = minPopulation => {
  // our target cities
  const bigCities = locationsData.filter(
    city => city.population >= minPopulation
  );

  // now we have consolidated data, compute the closest city and reduce output data
  return (
    locationsData
      // only when necessary
      .filter(location => location.population < minPopulation)
      // compute closest big city for each city
      .map(city => ({
        postcode: city.postcode,
        closest: findClosestCity(city, bigCities).postcode
      }))
      // only when necessary. as multiple cities have same postcode, one of the same postcode may have more habitants
      .filter(location => location.postcode !== location.closest)
      // make it a dict
      .reduce(
        (a, c) => ({
          ...a,
          [c.postcode]: c.closest
        }),
        {}
      )
  );
};

const populationMappings = [
  100,
  1000,
  5000,
  10000,
  25000,
  50000,
  100000,
  1000000
];

populationMappings.forEach(population => {
  console.log(`generate mapping for output-${population}.json`);
  const mapping = generateMapping(population);
  writeJson(`./output-${population}.json`, mapping);
});
