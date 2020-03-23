# closest-postcode

Generate mappings from postcode to closest postcode having more than N habitants. N=1000 in `output-1000.json`.

⚠️ If the city already has more than N habitants, it is not included in the dataset.

## Usage

```sh
yarn
yarn index
```

It takes ~20mins to generate all the datasets

## Datasets

Data is extracted from these files :

- geolocations : https://datanova.legroupe.laposte.fr/explore/dataset/laposte_hexasmal/export/?disjunctive.code_commune_insee&disjunctive.nom_de_la_commune&disjunctive.code_postal&disjunctive.ligne_5&disjunctive.libell_d_acheminement
- populations : https://www.insee.fr/fr/statistiques/3545833?sommaire=3292701
