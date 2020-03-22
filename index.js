const fs = require("fs");
const distance = require("fast-haversine");

const locationData = fs.readFileSync("./laposte_hexasmal.csv").toString();
const populationData = fs.readFileSync("./insee-populations.csv").toString();

const MIN_HABITANTS = 1000;

const sortByKey = key => (a, b) => {
  if (a[key] > b[key]) {
    return 1;
  } else if (a[key] < b[key]) {
    return -1;
  }
  return 0;
};

// load cities geoloc data
const loadLocations = () =>
  locationData
    .split("\n")
    .slice(1)
    .map(row => row.split(";").map(cell => cell.trim()))
    // only if has coordonnees_gps
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
  populationData
    .split("\n")
    .slice(1)
    .map(row => row.split(";").map(cell => cell.trim()))
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

const generateMapping = () => {
  // generate a single dataset with postcode, lat/lon and population
  const locations = loadLocations();
  const populations = loadPopulations();

  const getPopulationFromInsee = insee => {
    const inseePopulation = populations.find(pop => pop[0] === insee);
    if (!inseePopulation) {
      // mayotte not in insee data :/
      console.error(`cannot find ${insee} in insee data`);
      return 0;
    }
    return inseePopulation[1];
  };

  const findClosestBigCity = city => {
    //console.log("findClosestBigCity", city.postcode);
    if (city.population >= MIN_HABITANTS) {
      return city;
    }

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

  const cities = locations.map(([insee, postcode, lat, lon]) => ({
    postcode,
    population: getPopulationFromInsee(insee),
    lat,
    lon
  }));

  // our target cities
  const bigCities = cities.filter(city => city.population >= MIN_HABITANTS);

  // now we have consolidated data, compute the closest city and reduce output data
  return (
    cities
      // compute closest big city for each city
      .map(city => ({
        postcode: city.postcode,
        closest: findClosestBigCity(city).postcode
      }))
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

const mapping = generateMapping();

console.log(JSON.stringify(mapping, null, 2));
